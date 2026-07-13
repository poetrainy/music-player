"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { usePlayer } from "@/features/player/hook";
import { SongDetailComponent } from "@/features/player/pages/SongDetail";
import { cn } from "@/library";

interface Props {
  children: ReactNode;
}

export function PlayerLayout({ children }: Props) {
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

  return (
    <div className="flex items-start gap-6">
      <div
        className={cn(
          "min-w-0 flex-1 md:block",
          isOnExactSongPage ? "hidden" : "block",
        )}
      >
        {children}
      </div>
      {hasPlayer && (
        <div
          className={cn(
            "md:bg-surface-elevated w-full overflow-hidden md:sticky md:top-24 md:max-w-sm md:shrink-0 md:rounded-xl",
            isOnExactSongPage ? "block" : "hidden",
            activeMobileView === "player" ? "md:block" : "md:hidden",
          )}
        >
          <SongDetailComponent />
        </div>
      )}
    </div>
  );
}
