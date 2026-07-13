"use server";

import { revalidatePath } from "next/cache";
import { cache } from "react";
import { getSongsByIds } from "@/api";
import { Playlist, PlaylistSong } from "@/features/playlist/entity";
import {
  deleteYoutubeApi,
  fetchYoutubeApi,
  postYoutubeApi,
  putYoutubeApi,
} from "@/library";

interface YoutubePlaylistListResponse {
  items: {
    id: string;
    snippet: {
      title: string;
    };
  }[];
}

interface YoutubePlaylistItemListResponse {
  items: {
    id: string;
    snippet: {
      resourceId: { videoId: string };
    };
  }[];
}

interface YoutubePlaylistItemInsertResponse {
  id: string;
}

const getPlaylistSongs = async (
  playlistId: string,
): Promise<PlaylistSong[]> => {
  const data = await fetchYoutubeApi<YoutubePlaylistItemListResponse>(
    "/playlistItems",
    { part: "snippet", playlistId, maxResults: "50" },
  );

  const videoIds = data.items.map((item) => item.snippet.resourceId.videoId);
  const songs = await getSongsByIds(videoIds);
  const songsById = new Map(songs.map((song) => [song.id, song]));

  return data.items.flatMap((item) => {
    const song = songsById.get(item.snippet.resourceId.videoId);

    if (!song) {
      return [];
    }

    return [{ ...song, playlistItemId: item.id }];
  });
};

export const getPlaylists = async (): Promise<Playlist[]> => {
  const data = await fetchYoutubeApi<YoutubePlaylistListResponse>(
    "/playlists",
    { part: "snippet", mine: "true", maxResults: "50" },
  );

  return Promise.all(
    data.items.map(async (item) => ({
      id: item.id,
      title: item.snippet.title,
      songs: await getPlaylistSongs(item.id),
    })),
  );
};

export const getPlaylistById = cache(
  async (playlistId: string): Promise<Playlist | null> => {
    const data = await fetchYoutubeApi<YoutubePlaylistListResponse>(
      "/playlists",
      { part: "snippet", id: playlistId },
    );

    const item = data.items[0];

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      title: item.snippet.title,
      songs: await getPlaylistSongs(item.id),
    };
  },
);

export const registerPlaylistSong = async (
  formData: FormData,
): Promise<string> => {
  const playlistId = String(formData.get("playlistId"));
  const songId = String(formData.get("songId"));

  const result = await postYoutubeApi<YoutubePlaylistItemInsertResponse>(
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

  return result.id;
};

interface YoutubePlaylistUpdateResponse {
  id: string;
}

export const updatePlaylist = async (formData: FormData): Promise<void> => {
  const playlistId = String(formData.get("playlistId"));
  const title = String(formData.get("title"));

  await putYoutubeApi<YoutubePlaylistUpdateResponse>(
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

export const deletePlaylistSong = async (formData: FormData): Promise<void> => {
  const playlistId = String(formData.get("playlistId"));
  const playlistItemId = String(formData.get("playlistItemId"));

  await deleteYoutubeApi("/playlistItems", { id: playlistItemId });

  revalidatePath("/");
  revalidatePath(`/playlists/${playlistId}`);
};
