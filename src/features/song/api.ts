import { Song } from "@/features/song/entity";
import { fetchYoutubeApi, trimChannelTopicSuffix } from "@/library";

const toSong = (item: gapi.client.youtube.Video): Song[] => {
  if (!item.id || !item.snippet?.title) {
    return [];
  }

  return [
    {
      id: item.id,
      title: item.snippet.title,
      artist: trimChannelTopicSuffix(item.snippet.channelTitle ?? ""),
    },
  ];
};

export const getSongsByIds = async (songIds: string[]): Promise<Song[]> => {
  if (!songIds.length) {
    return [];
  }

  const data = await fetchYoutubeApi<gapi.client.youtube.VideoListResponse>(
    "/videos",
    { part: "snippet", id: songIds.join(",") },
  );

  return (data.items ?? []).flatMap(toSong);
};

export const searchSongs = async (query: string): Promise<Song[]> => {
  if (!query.trim()) {
    return [];
  }

  const data = await fetchYoutubeApi<gapi.client.youtube.SearchListResponse>(
    "/search",
    {
      part: "snippet",
      q: query,
      type: "video",
      videoCategoryId: "10",
      maxResults: "25",
    },
  );

  return (data.items ?? []).flatMap((item) => {
    const videoId = item.id?.videoId;
    const title = item.snippet?.title;

    if (!videoId || !title) {
      return [];
    }

    return [
      {
        id: videoId,
        title,
        artist: trimChannelTopicSuffix(item.snippet?.channelTitle ?? ""),
      },
    ];
  });
};
