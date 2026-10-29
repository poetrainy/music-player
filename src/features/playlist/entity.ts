import { Song } from "@/features/song/entity";

export interface PlaylistSong extends Song {
  playlistItemId: string;
}

export interface PlaylistSummary {
  id: string;
  title: string;
}

export interface Playlist {
  id: string;
  title: string;
  songs: PlaylistSong[];
  // NOTE: コラージュ表示用に、サムネイル画像が重複しないよう選び出した曲（最大4件）
  collageSongs: PlaylistSong[];
}
