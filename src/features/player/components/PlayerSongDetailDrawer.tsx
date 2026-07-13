"use client";

import { cva } from "class-variance-authority";
import { PlayerSongDetail } from "@/features/player/components/PlayerSongDetail";
import { usePlayer } from "@/features/player/hook";

const cvaPlayerSongDetailDrawerOverlay = cva(
  "fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 md:hidden",
  {
    variants: {
      open: {
        true: "opacity-100",
        false: "pointer-events-none opacity-0",
      },
    },
  },
);

const cvaPlayerSongDetailDrawerContainer = cva(
  "bg-surface fixed inset-x-0 top-16 bottom-0 z-50 rounded-t-2xl px-4 py-6 transition-transform duration-300 md:hidden",
  {
    variants: {
      open: {
        true: "translate-y-0",
        false: "translate-y-full",
      },
    },
  },
);

export function PlayerSongDetailDrawer() {
  const { activeMobileView, currentSong, setActiveMobileView } = usePlayer();

  if (!currentSong) {
    return null;
  }

  const open = activeMobileView === "player";

  return (
    <>
      <button
        type="button"
        aria-label="閉じる"
        onClick={() => setActiveMobileView("list")}
        className={cvaPlayerSongDetailDrawerOverlay({ open })}
      />
      <div className={cvaPlayerSongDetailDrawerContainer({ open })}>
        <PlayerSongDetail />
      </div>
    </>
  );
}
