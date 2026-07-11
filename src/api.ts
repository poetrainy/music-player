import { auth } from "@/auth";
import { QuotaUsage, Song, User } from "@/entity";
import {
  fetchYoutubeApi,
  getYoutubeQuotaUsage,
  trimChannelTopicSuffix,
} from "@/library";

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
  if (songIds.length === 0) {
    return [];
  }

  const data = await fetchYoutubeApi<YoutubeVideoListResponse>("/videos", {
    part: "snippet",
    id: songIds.join(","),
  });

  return data.items.map(toSong);
};

export const getCurrentUser = async (): Promise<User> => {
  const session = await auth();

  return {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatarUrl: session?.user?.image ?? "",
  };
};

export const getQuotaUsage = async (): Promise<QuotaUsage> =>
  getYoutubeQuotaUsage();

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
