"use client";

import { ReactNode } from "react";
import {
  PLAYER_CONTAINER_ID,
  PlayerContext,
  usePlayerController,
} from "@/features/player/hook";

interface Props {
  children: ReactNode;
  userEmail: string;
}

export function PlayerProvider({ children, userEmail }: Props) {
  const player = usePlayerController(userEmail);

  return (
    <PlayerContext.Provider value={player}>
      {children}
      <div
        id={PLAYER_CONTAINER_ID}
        className="pointer-events-none fixed top-0 left-0 h-px w-px -translate-x-full overflow-hidden opacity-0"
      />
    </PlayerContext.Provider>
  );
}
