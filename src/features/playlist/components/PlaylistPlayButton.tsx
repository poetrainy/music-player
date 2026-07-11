"use client";

import { Play } from "lucide-react";
import { Song } from "@/entity";
import { usePlayer } from "@/features/player/hook";

interface Props {
  playlistId: string;
  playlistTitle: string;
  songs: Song[];
}

export function PlaylistPlayButton({
  playlistId,
  playlistTitle,
  songs,
}: Props) {
  const { play } = usePlayer();
  const firstSong = songs[0];

  if (!firstSong) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => play(firstSong, playlistId, playlistTitle, songs)}
      aria-label="再生"
      className="bg-brand active:bg-brand/80 flex h-14 w-14 items-center justify-center rounded-full text-black shadow-lg shadow-black/40"
    >
      <Play className="ml-1 h-6 w-6" fill="currentColor" />
    </button>
  );
}
