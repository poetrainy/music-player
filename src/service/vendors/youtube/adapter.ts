import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { cache } from "react";
import {
  Playlist,
  PlaylistSong,
  PlaylistSummary,
} from "@/features/playlist/entity";
import { Song } from "@/features/song/entity";
import { chunkArray } from "@/library";
import { ServiceAdapter } from "@/service/adapter";
import {
  deleteApi,
  fetchApi,
  getAccessTokenContext,
  postApi,
  putApi,
} from "@/service/vendors/youtube/api";
import { YOUTUBE_AUTH_SCOPE } from "@/service/vendors/youtube/authScope";

// NOTE: プレイリストの取得結果をユーザー横断でキャッシュしないよう、
// unstable_cache のキーには必ずユーザーごとの識別子（userCacheKey）を含める
const PLAYLISTS_CACHE_TAG = "youtube-playlists";

const CHANNEL_TITLE_TOPIC_SUFFIX_PATTERN = / - Topic$/;

const trimChannelTopicSuffix = (channelTitle: string): string =>
  channelTitle.replace(CHANNEL_TITLE_TOPIC_SUFFIX_PATTERN, "");

const buildThumbnailUrl = (videoId: string, quality: string): string =>
  `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;

const ISO8601_DURATION_PATTERN = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

const parseDurationSeconds = (duration: string | undefined): number => {
  const match = duration ? ISO8601_DURATION_PATTERN.exec(duration) : null;

  if (!match) {
    return 0;
  }

  const [, hours, minutes, seconds] = match;

  return (
    Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
  );
};

// NOTE: videos.list のレスポンスに含まれる thumbnails は実際に生成済みの画質のみを返すため、
// 優先度順に存在するものを選べば十分で、i.ytimg.com への疎通確認（HEADリクエスト）は不要
const resolveLargeThumbnailUrl = (
  videoId: string,
  thumbnails: gapi.client.youtube.ThumbnailDetails | undefined,
): string =>
  thumbnails?.maxres?.url ??
  thumbnails?.standard?.url ??
  thumbnails?.high?.url ??
  buildThumbnailUrl(videoId, "default");

const toSong = (item: gapi.client.youtube.Video): Song[] => {
  if (!item.id || !item.snippet?.title) {
    return [];
  }

  return [
    {
      id: item.id,
      title: item.snippet.localized?.title ?? item.snippet.title,
      artist: trimChannelTopicSuffix(item.snippet.channelTitle ?? ""),
      durationSeconds: parseDurationSeconds(item.contentDetails?.duration),
      thumbnailUrlSmall: buildThumbnailUrl(item.id, "mqdefault"),
      thumbnailUrlLarge: resolveLargeThumbnailUrl(
        item.id,
        item.snippet.thumbnails,
      ),
    },
  ];
};

// NOTE: videos.list の id パラメータは一度に指定できる件数が50件までのため、チャンクに分割して取得する
const MAX_VIDEO_IDS_PER_REQUEST = 50;

const getSongsByIds = async (
  accessToken: string,
  songIds: string[],
): Promise<Song[]> => {
  if (!songIds.length) {
    return [];
  }

  const idChunks = chunkArray(songIds, MAX_VIDEO_IDS_PER_REQUEST);
  const responses = await Promise.all(
    idChunks.map((idChunk) =>
      fetchApi<gapi.client.youtube.VideoListResponse>(accessToken, "/videos", {
        part: "snippet,contentDetails",
        id: idChunk.join(","),
        hl: "ja",
      }),
    ),
  );
  const items = responses.flatMap((data) => data.items ?? []);

  return items.flatMap(toSong);
};

// NOTE: search.list は contentDetails（再生時間）を返さないため、videos.list（getSongsByIds）を再利用して取得する。検索結果の順序は videoIds の並びで復元する
const searchSongs = async (
  accessToken: string,
  query: string,
): Promise<Song[]> => {
  if (!query.trim()) {
    return [];
  }

  const data = await fetchApi<gapi.client.youtube.SearchListResponse>(
    accessToken,
    "/search",
    {
      part: "snippet",
      q: query,
      type: "video",
      videoCategoryId: "10",
      maxResults: "25",
      hl: "ja",
    },
  );

  const videoIds = (data.items ?? []).flatMap((item) =>
    item.id?.videoId ? [item.id.videoId] : [],
  );
  const songs = await getSongsByIds(accessToken, videoIds);
  const songsById = new Map(songs.map((song) => [song.id, song]));

  return videoIds.flatMap((videoId) => {
    const song = songsById.get(videoId);

    return song ? [song] : [];
  });
};

// NOTE: playlistItems.list は maxResults の上限が50件のため、nextPageToken を辿って全件取得する
const fetchAllPlaylistItems = async (
  accessToken: string,
  playlistId: string,
): Promise<gapi.client.youtube.PlaylistItem[]> => {
  const items: gapi.client.youtube.PlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const data = await fetchApi<gapi.client.youtube.PlaylistItemListResponse>(
      accessToken,
      "/playlistItems",
      {
        part: "snippet",
        playlistId,
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      },
    );

    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
};

const getPlaylistSongs = async (
  accessToken: string,
  playlistId: string,
): Promise<PlaylistSong[]> => {
  const items = await fetchAllPlaylistItems(accessToken, playlistId);

  const videoIds = items.flatMap((item) => {
    const videoId = item.snippet?.resourceId?.videoId;

    return videoId ? [videoId] : [];
  });
  const songs = await getSongsByIds(accessToken, videoIds);
  const songsById = new Map(songs.map((song) => [song.id, song]));

  return items.flatMap((item) => {
    const videoId = item.snippet?.resourceId?.videoId;
    const song = videoId ? songsById.get(videoId) : undefined;

    if (!song || !item.id) {
      return [];
    }

    return [{ ...song, playlistItemId: item.id }];
  });
};

const toPlaylistSummary = (
  item: gapi.client.youtube.Playlist,
): PlaylistSummary[] => {
  if (!item.id || !item.snippet?.title) {
    return [];
  }

  return [{ id: item.id, title: item.snippet.title }];
};

const COLLAGE_THUMBNAIL_COUNT = 4;
// NOTE: 重複判定のために画像を取得する単位。いきなり全曲分を取得せず、
// 4枚集まるまでこの件数ずつ候補を広げていく
const COLLAGE_THUMBNAIL_BATCH_SIZE = 10;
// NOTE: サムネイル画像はvideoIdごとに不変なため、ユーザーを問わずグローバルにキャッシュしてよい
const THUMBNAIL_HASH_CACHE_SECONDS = 60 * 60 * 24 * 7;

// NOTE: 同じアルバムの曲同士は動画IDが異なってもサムネイル画像（バイト列）が
// 一致することがあるため、URLではなく画像の中身のハッシュで重複を判定する。
// small（mqdefault）はlargeより軽量で、同じ元画像から生成されていれば
// 一致関係はlargeでも変わらないためsmallのみ取得すれば十分
const hashThumbnailContent = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: THUMBNAIL_HASH_CACHE_SECONDS },
  });

  if (!response.ok) {
    return url;
  }

  const buffer = await response.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return Buffer.from(digest).toString("hex");
};

const selectCollageSongs = async (
  songs: PlaylistSong[],
): Promise<PlaylistSong[]> => {
  const usedHashes = new Set<string>();
  const collageSongs: PlaylistSong[] = [];

  for (
    let offset = 0;
    offset < songs.length && collageSongs.length < COLLAGE_THUMBNAIL_COUNT;
    offset += COLLAGE_THUMBNAIL_BATCH_SIZE
  ) {
    const batch = songs.slice(offset, offset + COLLAGE_THUMBNAIL_BATCH_SIZE);
    const hashes = await Promise.all(
      batch.map((song) => hashThumbnailContent(song.thumbnailUrlSmall)),
    );

    batch.forEach((song, index) => {
      if (collageSongs.length >= COLLAGE_THUMBNAIL_COUNT) {
        return;
      }

      const hash = hashes[index];

      if (usedHashes.has(hash)) {
        return;
      }

      usedHashes.add(hash);
      collageSongs.push(song);
    });
  }

  return collageSongs;
};

const getPlaylistSummaries = async (
  accessToken: string,
): Promise<PlaylistSummary[]> => {
  const data = await fetchApi<gapi.client.youtube.PlaylistListResponse>(
    accessToken,
    "/playlists",
    { part: "snippet", mine: "true", maxResults: "50" },
  );

  return (data.items ?? [])
    .flatMap(toPlaylistSummary)
    .sort((a, b) => a.title.localeCompare(b.title, "ja"));
};

// NOTE: 再生の開始に必要なのは最初の曲だけで、残りの曲は再生先が自分で取得するため、先頭の数件だけ取得する
const PLAYLIST_FIRST_SONG_CANDIDATE_COUNT = 5;

// NOTE: 削除・非公開になった動画は videos.list で返らないため、先頭から順に再生できる曲を探す
const getPlaylistFirstSong = async (
  accessToken: string,
  playlistId: string,
): Promise<Song | null> => {
  const data = await fetchApi<gapi.client.youtube.PlaylistItemListResponse>(
    accessToken,
    "/playlistItems",
    {
      part: "snippet",
      playlistId,
      maxResults: String(PLAYLIST_FIRST_SONG_CANDIDATE_COUNT),
    },
  );
  const videoIds = (data.items ?? []).flatMap((item) => {
    const videoId = item.snippet?.resourceId?.videoId;

    return videoId ? [videoId] : [];
  });
  const songs = await getSongsByIds(accessToken, videoIds);

  return (
    videoIds
      .map((videoId) => songs.find(({ id }) => id === videoId))
      .find((song) => !!song) ?? null
  );
};

const fetchPlaylists = async (accessToken: string): Promise<Playlist[]> => {
  const summaries = await getPlaylistSummaries(accessToken);

  return Promise.all(
    summaries.map(async (summary) => {
      const songs = await getPlaylistSongs(accessToken, summary.id);

      return {
        ...summary,
        songs,
        collageSongs: await selectCollageSongs(songs),
      };
    }),
  );
};

const getPlaylists = async (): Promise<Playlist[]> => {
  const { accessToken, userCacheKey } = await getAccessTokenContext();

  // NOTE: accessToken はトークンリフレッシュのたびに変化しキャッシュキーとして
  // 不安定なため、クロージャで渡しキーには含めない（userCacheKey のみをキーにする）
  return unstable_cache(
    async (_cacheKey: string) => fetchPlaylists(accessToken),
    ["youtube-playlists"],
    { tags: [PLAYLISTS_CACHE_TAG] },
  )(userCacheKey);
};

const fetchPlaylistById = async (
  accessToken: string,
  playlistId: string,
): Promise<Playlist | null> => {
  const data = await fetchApi<gapi.client.youtube.PlaylistListResponse>(
    accessToken,
    "/playlists",
    { part: "snippet", id: playlistId },
  );

  const item = data.items?.[0];
  const summary = item ? toPlaylistSummary(item)[0] : undefined;

  if (!summary) {
    return null;
  }

  const songs = await getPlaylistSongs(accessToken, summary.id);

  return {
    ...summary,
    songs,
    collageSongs: await selectCollageSongs(songs),
  };
};

const getPlaylistById = cache(
  async (playlistId: string): Promise<Playlist | null> => {
    const { accessToken, userCacheKey } = await getAccessTokenContext();

    return unstable_cache(
      async (_cacheKey: string, playlistIdArg: string) =>
        fetchPlaylistById(accessToken, playlistIdArg),
      ["youtube-playlist-by-id"],
      { tags: [PLAYLISTS_CACHE_TAG] },
    )(userCacheKey, playlistId);
  },
);

const registerPlaylistSong = async (
  playlistId: string,
  songId: string,
): Promise<string> => {
  const { accessToken } = await getAccessTokenContext();
  const result = await postApi<gapi.client.youtube.PlaylistItem>(
    accessToken,
    "/playlistItems",
    { part: "snippet" },
    {
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId: songId,
        },
      },
    },
  );

  updateTag(PLAYLISTS_CACHE_TAG);
  revalidatePath("/");
  revalidatePath(`/playlists/${playlistId}`);

  if (!result.id) {
    throw new Error("プレイリストへの追加に失敗しました");
  }

  return result.id;
};

const updatePlaylist = async (
  playlistId: string,
  title: string,
): Promise<void> => {
  const { accessToken } = await getAccessTokenContext();

  await putApi<gapi.client.youtube.Playlist>(
    accessToken,
    "/playlists",
    { part: "snippet" },
    {
      id: playlistId,
      snippet: { title },
    },
  );

  updateTag(PLAYLISTS_CACHE_TAG);
  revalidatePath("/");
  revalidatePath(`/playlists/${playlistId}`);
};

const deletePlaylistSong = async (
  playlistId: string,
  playlistItemId: string,
): Promise<void> => {
  const { accessToken } = await getAccessTokenContext();

  await deleteApi(accessToken, "/playlistItems", { id: playlistItemId });

  updateTag(PLAYLISTS_CACHE_TAG);
  revalidatePath("/");
  revalidatePath(`/playlists/${playlistId}`);
};

const getSongsByIdsWithAuth = async (songIds: string[]): Promise<Song[]> => {
  const { accessToken } = await getAccessTokenContext();

  return getSongsByIds(accessToken, songIds);
};

const searchSongsWithAuth = async (query: string): Promise<Song[]> => {
  const { accessToken } = await getAccessTokenContext();

  return searchSongs(accessToken, query);
};

export const youtubeAdapter: ServiceAdapter = {
  authScope: YOUTUBE_AUTH_SCOPE,
  getPlaylists,
  getPlaylistById,
  registerPlaylistSong,
  updatePlaylist,
  deletePlaylistSong,
  getSongsByIds: getSongsByIdsWithAuth,
  searchSongs: searchSongsWithAuth,
  getPlaylistSummaries,
  getPlaylistFirstSong,
};
