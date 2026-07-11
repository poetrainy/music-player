import { Song } from "@/entity";

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
  isShuffled: boolean,
): Song | null => {
  if (songs.length === 0) {
    return null;
  }

  if (isShuffled) {
    const candidates = songs.filter((song) => song.id !== currentSongId);
    const pool = candidates.length > 0 ? candidates : songs;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  const currentIndex = songs.findIndex((song) => song.id === currentSongId);

  if (currentIndex === -1) {
    return songs[0];
  }

  const targetIndex = (currentIndex + direction + songs.length) % songs.length;

  return songs[targetIndex];
};
