"use client";

import { ReactNode } from "react";
import { Header } from "@/components/Layout/Header";
import { PlayerMiniPlayer } from "@/features/player/components/PlayerMiniPlayer";
import { PlayerSongDetailDrawer } from "@/features/player/components/PlayerSongDetailDrawer";
import { PlayerSongDetailPanel } from "@/features/player/components/PlayerSongDetailPanel";
import { PlayerProvider } from "@/features/player/providers/PlayerProvider";
import { QuotaUsage, User } from "@/features/user/entity";

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
        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1">{children}</div>
          <PlayerSongDetailPanel />
        </div>
      </main>
      <PlayerMiniPlayer />
      <PlayerSongDetailDrawer />
    </PlayerProvider>
  );
}
