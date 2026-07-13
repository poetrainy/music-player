"use client";

import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";
import { PlayerSongDetail } from "@/features/player/components/PlayerSongDetail";
import { usePlayer } from "@/features/player/hook";

const cvaPlayerSongDetailPanelContainer = cva(
  "md:bg-surface-elevated hidden w-full overflow-hidden md:sticky md:top-28 md:max-w-sm md:shrink-0 md:rounded-xl",
  {
    variants: {
      isActive: {
        true: "md:block",
        false: "md:hidden",
      },
    },
  },
);

export function PlayerSongDetailPanel() {
  const { activeMobileView, currentSong, playlistId } = usePlayer();
  const pathname = usePathname();

  const hasPlayer =
    !!currentSong &&
    !!playlistId &&
    pathname.startsWith(`/playlists/${playlistId}`);

  if (!hasPlayer) {
    return null;
  }

  return (
    <div
      className={cvaPlayerSongDetailPanelContainer({
        isActive: activeMobileView === "player",
      })}
    >
      <PlayerSongDetail />
    </div>
  );
}
