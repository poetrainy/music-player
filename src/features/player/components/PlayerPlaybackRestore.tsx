"use client";

import { useEffect } from "react";
import { usePlayer } from "@/features/player/hook";

export function PlayerPlaybackRestore() {
  const { restorePlayback, restoreVolume } = usePlayer();

  useEffect(() => {
    restorePlayback();
    restoreVolume();
  }, [restorePlayback, restoreVolume]);

  return null;
}
