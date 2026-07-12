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

export function SongAutoLoad({
  playlistId,
  playlistTitle,
  song,
  songs,
}: Props) {
  const { loadSong } = usePlayer();

  useEffect(() => {
    loadSong(song, playlistId, playlistTitle, songs);
  }, [loadSong, playlistId, playlistTitle, song, songs]);

  return null;
}
