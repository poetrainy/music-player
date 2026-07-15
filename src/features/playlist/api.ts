"use server";

import { serviceAdapter } from "@/service/adapter";
import { Playlist } from "@/features/playlist/entity";

export const getPlaylists = async (): Promise<Playlist[]> =>
  serviceAdapter.getPlaylists();

export const getPlaylistById = async (
  playlistId: string,
): Promise<Playlist | null> => serviceAdapter.getPlaylistById(playlistId);

export const registerPlaylistSong = async (
  formData: FormData,
): Promise<string> => {
  const playlistId = String(formData.get("playlistId"));
  const songId = String(formData.get("songId"));

  return serviceAdapter.registerPlaylistSong(playlistId, songId);
};

export const updatePlaylist = async (formData: FormData): Promise<void> => {
  const playlistId = String(formData.get("playlistId"));
  const title = String(formData.get("title"));

  await serviceAdapter.updatePlaylist(playlistId, title);
};

export const deletePlaylistSong = async (formData: FormData): Promise<void> => {
  const playlistId = String(formData.get("playlistId"));
  const playlistItemId = String(formData.get("playlistItemId"));

  await serviceAdapter.deletePlaylistSong(playlistId, playlistItemId);
};
