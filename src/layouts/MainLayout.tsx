"use client";

import { ReactNode } from "react";
import { Header } from "@/components/Layout/Header";
import { PlayerMiniPlayer } from "@/features/player/components/PlayerMiniPlayer";
import { PlayerPlaybackRestore } from "@/features/player/components/PlayerPlaybackRestore";
import { PlayerSongDetailDrawer } from "@/features/player/components/PlayerSongDetailDrawer";
import { PlayerSongDetailPanel } from "@/features/player/components/PlayerSongDetailPanel";
import { PlayerProvider } from "@/features/player/providers/PlayerProvider";
import { User } from "@/features/user/entity";

interface Props {
  children: ReactNode;
  user: User;
  isEmbedded: boolean;
  remotePlaybackChannelName: string;
  remotePlaybackDeviceId: string | null;
}

export function MainLayout({
  children,
  user,
  isEmbedded,
  remotePlaybackChannelName,
  remotePlaybackDeviceId,
}: Props) {
  return (
    <PlayerProvider
      userEmail={user.email}
      remotePlaybackChannelName={remotePlaybackChannelName}
      remotePlaybackDeviceId={remotePlaybackDeviceId}
    >
      <Header user={user} isEmbedded={isEmbedded} />
      <main className="mx-auto w-full max-w-300 px-4 pt-6 pb-20">
        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1">{children}</div>
          <PlayerSongDetailPanel />
        </div>
      </main>
      <PlayerMiniPlayer />
      <PlayerSongDetailDrawer />
      <PlayerPlaybackRestore />
    </PlayerProvider>
  );
}
