"use client";

import { Play } from "lucide-react";
import { usePlayer } from "@/features/player/hook";
import { Song } from "@/features/song/entity";

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
      className="bg-brand active:bg-brand/80 flex size-14 items-center justify-center rounded-full text-black shadow-lg shadow-black/40"
    >
      <Play className="ml-1 size-6" fill="currentColor" />
    </button>
  );
}
