"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Song } from "@/entity";
import { usePlayer } from "@/features/player/hook";

interface Props {
  playlistId: string;
  songs: Song[];
}

export function PlaylistPlayButton({ playlistId, songs }: Props) {
  const { play } = usePlayer();
  const firstSong = songs[0];

  if (!firstSong) {
    return null;
  }

  return (
    <Link
      href={`/playlists/${playlistId}/${firstSong.id}`}
      onClick={() => play(firstSong, playlistId, songs)}
      className="bg-brand flex h-14 w-14 items-center justify-center rounded-full text-black shadow-lg shadow-black/40"
    >
      <Play className="ml-1 h-6 w-6" fill="currentColor" />
    </Link>
  );
}
