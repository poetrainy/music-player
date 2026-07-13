import { Song } from "@/entity";
import { fetchYoutubeApi, trimChannelTopicSuffix } from "@/library";

interface YoutubeVideoListResponse {
  items: {
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
    };
  }[];
}

interface YoutubeSearchListResponse {
  items: {
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
    };
  }[];
}

const toSong = (item: YoutubeVideoListResponse["items"][number]): Song => ({
  id: item.id,
  title: item.snippet.title,
  artist: trimChannelTopicSuffix(item.snippet.channelTitle),
});

export const getSongsByIds = async (songIds: string[]): Promise<Song[]> => {
  if (!songIds.length) {
    return [];
  }

  const data = await fetchYoutubeApi<YoutubeVideoListResponse>("/videos", {
    part: "snippet",
    id: songIds.join(","),
  });

  return data.items.map(toSong);
};

export const searchSongs = async (query: string): Promise<Song[]> => {
  if (!query.trim()) {
    return [];
  }

  const data = await fetchYoutubeApi<YoutubeSearchListResponse>("/search", {
    part: "snippet",
    q: query,
    type: "video",
    videoCategoryId: "10",
    maxResults: "25",
  });

  return data.items.map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    artist: trimChannelTopicSuffix(item.snippet.channelTitle),
  }));
};
