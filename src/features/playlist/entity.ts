import { Song } from "@/features/song/entity";

export interface PlaylistSong extends Song {
  playlistItemId: string;
}

export interface Playlist {
  id: string;
  title: string;
  songs: PlaylistSong[];
}
