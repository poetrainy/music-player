import { Song } from "@/features/song/entity";
import { serviceAdapter } from "@/service/adapter";

export const getSongsByIds = async (songIds: string[]): Promise<Song[]> =>
  serviceAdapter.getSongsByIds(songIds);

export const searchSongs = async (query: string): Promise<Song[]> =>
  serviceAdapter.searchSongs(query);
