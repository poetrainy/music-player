"use client";

import { useEffect } from "react";
import { Song } from "@/entity";
import { usePlayer } from "@/features/player/hook";

interface Props {
  playlistId: string;
  playlistTitle: string;
  song: Song;
  songs: Song[];
}

export function SongAutoPlay({
  playlistId,
  playlistTitle,
  song,
  songs,
}: Props) {
  const { play } = usePlayer();

  useEffect(() => {
    play(song, playlistId, playlistTitle, songs);
  }, [play, playlistId, playlistTitle, song, songs]);

  return null;
}
