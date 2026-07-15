import { youtubeAdapter } from "@/service/vendors/youtube/adapter";
import { Playlist } from "@/features/playlist/entity";
import { Song } from "@/features/song/entity";
import { QuotaUsage } from "@/features/user/entity";

export interface ServiceAdapter {
  authScope: string;
  getPlaylists: () => Promise<Playlist[]>;
  getPlaylistById: (playlistId: string) => Promise<Playlist | null>;
  registerPlaylistSong: (
    playlistId: string,
    songId: string,
  ) => Promise<string>;
  updatePlaylist: (playlistId: string, title: string) => Promise<void>;
  deletePlaylistSong: (
    playlistId: string,
    playlistItemId: string,
  ) => Promise<void>;
  getSongsByIds: (songIds: string[]) => Promise<Song[]>;
  searchSongs: (query: string) => Promise<Song[]>;
  getQuotaUsage: () => Promise<QuotaUsage>;
}

// NOTE: 別のサービスに差し替える場合はここを新しい vendor の adapter に変更する。
// 再生コントローラはブラウザ専用処理のため src/service/player.ts 側で個別に選択する
export const serviceAdapter: ServiceAdapter = youtubeAdapter;
