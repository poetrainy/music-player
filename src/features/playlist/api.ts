"use server";

import { revalidatePath } from "next/cache";
import { cache } from "react";
import { Playlist, PlaylistSong } from "@/features/playlist/entity";
import { getSongsByIds } from "@/features/song/api";
import {
  deleteYoutubeApi,
  fetchYoutubeApi,
  postYoutubeApi,
  putYoutubeApi,
} from "@/library";

const getPlaylistSongs = async (
  playlistId: string,
): Promise<PlaylistSong[]> => {
  const data =
    await fetchYoutubeApi<gapi.client.youtube.PlaylistItemListResponse>(
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

export const getPlaylists = async (): Promise<Playlist[]> => {
  const data = await fetchYoutubeApi<gapi.client.youtube.PlaylistListResponse>(
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

export const getPlaylistById = cache(
  async (playlistId: string): Promise<Playlist | null> => {
    const data =
      await fetchYoutubeApi<gapi.client.youtube.PlaylistListResponse>(
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

export const registerPlaylistSong = async (
  formData: FormData,
): Promise<string> => {
  const playlistId = String(formData.get("playlistId"));
  const songId = String(formData.get("songId"));

  const result = await postYoutubeApi<gapi.client.youtube.PlaylistItem>(
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

export const updatePlaylist = async (formData: FormData): Promise<void> => {
  const playlistId = String(formData.get("playlistId"));
  const title = String(formData.get("title"));

  await putYoutubeApi<gapi.client.youtube.Playlist>(
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
