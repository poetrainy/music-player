"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Header } from "@/components/Layout/Header";
import { PlayerMiniPlayer } from "@/features/player/components/PlayerMiniPlayer";
import { PlayerSongDetailPanel } from "@/features/player/components/PlayerSongDetailPanel";
import { usePlayer } from "@/features/player/hook";
import { PlayerProvider } from "@/features/player/providers/PlayerProvider";
import { QuotaUsage, User } from "@/features/user/entity";
import { cn } from "@/library";

interface Props {
  children: ReactNode;
  quota: QuotaUsage;
  user: User;
}

export function MainLayout({ children, quota, user }: Props) {
  return (
    <PlayerProvider userEmail={user.email}>
      <Header quota={quota} user={user} />
      <main className="mx-auto w-full max-w-300 px-4 pt-6 pb-20">
        <MainLayoutContent>{children}</MainLayoutContent>
      </main>
      <PlayerMiniPlayer />
    </PlayerProvider>
  );
}

interface MainLayoutContentProps {
  children: ReactNode;
}

function MainLayoutContent({ children }: MainLayoutContentProps) {
  const { currentSong, playlistId } = usePlayer();
  const pathname = usePathname();

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
      <PlayerSongDetailPanel />
    </div>
  );
}
