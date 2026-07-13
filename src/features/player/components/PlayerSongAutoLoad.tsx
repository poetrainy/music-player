"use client";

import { useEffect } from "react";
import { usePlayer } from "@/features/player/hook";
import { Song } from "@/features/song/entity";

interface Props {
  playlistId: string;
  playlistTitle: string;
  song: Song;
  songs: Song[];
}

export function PlayerSongAutoLoad({
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
