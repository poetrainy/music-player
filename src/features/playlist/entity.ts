import { Song } from "@/entity";

export interface PlaylistSong extends Song {
  playlistItemId: string;
}

export interface Playlist {
  id: string;
  title: string;
  songs: PlaylistSong[];
}
