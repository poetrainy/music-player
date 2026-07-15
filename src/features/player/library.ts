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

export const loadPlaybackState = (): StoredPlaybackState | null => {
  const raw = localStorage.getItem(PLAYBACK_STATE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  const parsed: unknown = JSON.parse(raw);

  return parsed as StoredPlaybackState;
};

export const formatPlaybackTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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
