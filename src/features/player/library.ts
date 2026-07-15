import { Song } from "@/features/song/entity";

export const DEFAULT_VOLUME = 100;

const VOLUME_STORAGE_KEY = "player-volume";

export const saveVolume = (volume: number): void => {
  localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
};

export const loadVolume = (): number | null => {
  const raw = localStorage.getItem(VOLUME_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : null;
};

const PLAYBACK_STATE_STORAGE_KEY = "player-playback-state";

export interface StoredPlaybackState {
  currentTime: number;
  playlistId: string;
  playlistTitle: string;
  song: Song;
  songs: Song[];
  userEmail: string;
}

export const savePlaybackState = (state: StoredPlaybackState): void => {
  localStorage.setItem(PLAYBACK_STATE_STORAGE_KEY, JSON.stringify(state));
};

export const clearPlaybackState = (): void => {
  localStorage.removeItem(PLAYBACK_STATE_STORAGE_KEY);
};

const isStoredSong = (value: unknown): value is Song => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const song = value as Record<string, unknown>;

  return (
    typeof song.id === "string" &&
    typeof song.title === "string" &&
    typeof song.artist === "string" &&
    typeof song.durationSeconds === "number" &&
    typeof song.thumbnailUrlSmall === "string" &&
    typeof song.thumbnailUrlLarge === "string"
  );
};

// NOTE: Song・StoredPlaybackState のスキーマ変更後も、localStorage に残った旧スキーマのデータをそのまま信用しないよう形を検証する
const isStoredPlaybackState = (
  value: unknown,
): value is StoredPlaybackState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Record<string, unknown>;

  return (
    typeof state.currentTime === "number" &&
    typeof state.playlistId === "string" &&
    typeof state.playlistTitle === "string" &&
    isStoredSong(state.song) &&
    Array.isArray(state.songs) &&
    state.songs.every(isStoredSong) &&
    typeof state.userEmail === "string"
  );
};

export const loadPlaybackState = (): StoredPlaybackState | null => {
  const raw = localStorage.getItem(PLAYBACK_STATE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  const parsed: unknown = JSON.parse(raw);

  return isStoredPlaybackState(parsed) ? parsed : null;
};

export const getAdjacentSong = (
  songs: Song[],
  currentSongId: string,
  direction: 1 | -1,
): Song | null => {
  if (!songs.length) {
    return null;
  }

  const currentIndex = songs.findIndex((song) => song.id === currentSongId);

  if (currentIndex === -1) {
    return songs[0];
  }

  const targetIndex = (currentIndex + direction + songs.length) % songs.length;

  return songs[targetIndex];
};

export const createShuffleOrder = (
  songs: Song[],
  currentSongId: string,
): Song[] => {
  const rest = songs.filter((song) => song.id !== currentSongId);
  const current = songs.find((song) => song.id === currentSongId);

  for (let index = rest.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [rest[index], rest[swapIndex]] = [rest[swapIndex], rest[index]];
  }

  return current ? [current, ...rest] : rest;
};
