"use client";

import { useEffect } from "react";
import { usePlayer } from "@/features/player/hook";

export function PlayerPlaybackRestore() {
  const { restorePlayback } = usePlayer();

  useEffect(() => {
    restorePlayback();
  }, [restorePlayback]);

  return null;
}
