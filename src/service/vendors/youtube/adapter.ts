import { revalidatePath } from "next/cache";
import { cache } from "react";
import { ServiceAdapter } from "@/service/adapter";
import { YOUTUBE_AUTH_SCOPE } from "@/service/vendors/youtube/authScope";
import {
  deleteApi,
  fetchApi,
  getQuotaUsage,
  postApi,
  putApi,
} from "@/service/vendors/youtube/api";
import { Playlist, PlaylistSong } from "@/features/playlist/entity";
import { Song } from "@/features/song/entity";

const CHANNEL_TITLE_TOPIC_SUFFIX_PATTERN = / - Topic$/;

const trimChannelTopicSuffix = (channelTitle: string): string =>
  channelTitle.replace(CHANNEL_TITLE_TOPIC_SUFFIX_PATTERN, "");

// NOTE: 優先度順。maxresdefault は未存在の動画も多いため、実際に取得できる画質を上から順にサーバー側で確認する
const LARGE_THUMBNAIL_QUALITIES = [
  "maxresdefault",
  "sddefault",
  "hqdefault",
] as const;

const buildThumbnailUrl = (videoId: string, quality: string): string =>
  `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;

const ISO8601_DURATION_PATTERN = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

const parseDurationSeconds = (duration: string | undefined): number => {
  const match = duration ? ISO8601_DURATION_PATTERN.exec(duration) : null;

  if (!match) {
    return 0;
  }

  const [, hours, minutes, seconds] = match;

  return Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0);
};

const isThumbnailAvailable = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: "HEAD" });

    return response.ok;
  } catch {
    return false;
  }
};

const resolveLargeThumbnailUrl = async (videoId: string): Promise<string> => {
  for (const quality of LARGE_THUMBNAIL_QUALITIES) {
    const url = buildThumbnailUrl(videoId, quality);

    if (await isThumbnailAvailable(url)) {
      return url;
    }
  }

  return buildThumbnailUrl(videoId, "default");
};

const toSong = async (item: gapi.client.youtube.Video): Promise<Song[]> => {
  if (!item.id || !item.snippet?.title) {
    return [];
  }

  return [
    {
      id: item.id,
      title: item.snippet.title,
      artist: trimChannelTopicSuffix(item.snippet.channelTitle ?? ""),
      durationSeconds: parseDurationSeconds(item.contentDetails?.duration),
      thumbnailUrlSmall: buildThumbnailUrl(item.id, "mqdefault"),
      thumbnailUrlLarge: await resolveLargeThumbnailUrl(item.id),
    },
  ];
};

const getSongsByIds = async (songIds: string[]): Promise<Song[]> => {
  if (!songIds.length) {
    return [];
  }

  const data = await fetchApi<gapi.client.youtube.VideoListResponse>(
    "/videos",
    { part: "snippet,contentDetails", id: songIds.join(","), hl: "ja" },
  );

  const songs = await Promise.all((data.items ?? []).map(toSong));

  return songs.flat();
};

// NOTE: search.list は contentDetails（再生時間）を返さないため、videos.list（getSongsByIds）を再利用して取得する。検索結果の順序は videoIds の並びで復元する
const searchSongs = async (query: string): Promise<Song[]> => {
  if (!query.trim()) {
    return [];
  }

  const data = await fetchApi<gapi.client.youtube.SearchListResponse>(
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
  const songs = await getSongsByIds(videoIds);
  const songsById = new Map(songs.map((song) => [song.id, song]));

  return videoIds.flatMap((videoId) => {
    const song = songsById.get(videoId);

    return song ? [song] : [];
  });
};

const getPlaylistSongs = async (
  playlistId: string,
): Promise<PlaylistSong[]> => {
  const data = await fetchApi<gapi.client.youtube.PlaylistItemListResponse>(
    "/playlistItems",
    { part: "snippet", playlistId, maxResults: "50" },
  );

  const videoIds = (data.items ?? []).flatMap((item) => {
    const videoId = item.snippet?.resourceId?.videoId;

    return videoId ? [videoId] : [];
  });
  const songs = await getSongsByIds(videoIds);
  const songsById = new Map(songs.map((song) => [song.id, song]));

  return (data.items ?? []).flatMap((item) => {
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
): { id: string; title: string }[] => {
  if (!item.id || !item.snippet?.title) {
    return [];
  }

  return [{ id: item.id, title: item.snippet.title }];
};

const getPlaylists = async (): Promise<Playlist[]> => {
  const data = await fetchApi<gapi.client.youtube.PlaylistListResponse>(
    "/playlists",
    { part: "snippet", mine: "true", maxResults: "50" },
  );

  const summaries = (data.items ?? [])
    .flatMap(toPlaylistSummary)
    .sort((a, b) => a.title.localeCompare(b.title, "ja"));

  return Promise.all(
    summaries.map(async (summary) => ({
      ...summary,
      songs: await getPlaylistSongs(summary.id),
    })),
  );
};

const getPlaylistById = cache(
  async (playlistId: string): Promise<Playlist | null> => {
    const data = await fetchApi<gapi.client.youtube.PlaylistListResponse>(
      "/playlists",
      { part: "snippet", id: playlistId },
    );

    const item = data.items?.[0];
    const summary = item ? toPlaylistSummary(item)[0] : undefined;

    if (!summary) {
      return null;
    }

    return {
      ...summary,
      songs: await getPlaylistSongs(summary.id),
    };
  },
);

const registerPlaylistSong = async (
  playlistId: string,
  songId: string,
): Promise<string> => {
  const result = await postApi<gapi.client.youtube.PlaylistItem>(
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
  await putApi<gapi.client.youtube.Playlist>(
    "/playlists",
    { part: "snippet" },
    {
      id: playlistId,
      snippet: { title },
    },
  );

  revalidatePath("/");
  revalidatePath(`/playlists/${playlistId}`);
};

const deletePlaylistSong = async (
  playlistId: string,
  playlistItemId: string,
): Promise<void> => {
  await deleteApi("/playlistItems", { id: playlistItemId });

  revalidatePath("/");
  revalidatePath(`/playlists/${playlistId}`);
};

export const youtubeAdapter: ServiceAdapter = {
  authScope: YOUTUBE_AUTH_SCOPE,
  getPlaylists,
  getPlaylistById,
  registerPlaylistSong,
  updatePlaylist,
  deletePlaylistSong,
  getSongsByIds,
  searchSongs,
  getQuotaUsage: async () => getQuotaUsage(),
};
