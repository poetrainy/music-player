"use client";

import { usePathname } from "next/navigation";
import { usePlayer } from "@/features/player/hook";
import { SongDetailComponent } from "@/features/player/pages/SongDetail";
import { cn } from "@/library";

export function PlayerSongDetailPanel() {
  const { activeMobileView, currentSong, playlistId } = usePlayer();
  const pathname = usePathname();

  const hasPlayer =
    !!currentSong &&
    !!playlistId &&
    pathname.startsWith(`/playlists/${playlistId}`);
  const isOnExactSongPage =
    !!currentSong &&
    !!playlistId &&
    pathname === `/playlists/${playlistId}/${currentSong.id}`;

  if (!hasPlayer) {
    return null;
  }

  return (
    <div
      className={cn(
        "md:bg-surface-elevated w-full overflow-hidden md:sticky md:top-24 md:max-w-sm md:shrink-0 md:rounded-xl",
        isOnExactSongPage ? "block" : "hidden",
        activeMobileView === "player" ? "md:block" : "md:hidden",
      )}
    >
      <SongDetailComponent />
    </div>
  );
}
