"use client";

import { ReactNode } from "react";
import { Header } from "@/components/Layout/Header";
import { useIsEmbedded } from "@/features/embed/hook";
import { PlayerMiniPlayer } from "@/features/player/components/PlayerMiniPlayer";
import { PlayerPlaybackRestore } from "@/features/player/components/PlayerPlaybackRestore";
import { PlayerSongDetailDrawer } from "@/features/player/components/PlayerSongDetailDrawer";
import { PlayerSongDetailPanel } from "@/features/player/components/PlayerSongDetailPanel";
import { PlayerProvider } from "@/features/player/providers/PlayerProvider";
import { User } from "@/features/user/entity";

interface Props {
  children: ReactNode;
  user: User;
  hasEmbedSession: boolean;
  remotePlaybackChannelName: string;
}

export function MainLayout({
  children,
  user,
  hasEmbedSession,
  remotePlaybackChannelName,
}: Props) {
  const isEmbedded = useIsEmbedded(hasEmbedSession);

  return (
    <PlayerProvider
      userEmail={user.email}
      remotePlaybackChannelName={remotePlaybackChannelName}
      // NOTE: 再生するデバイスはプレーヤー画面だけが担い、サイト本体の画面は iframe 内で開かれても操作側として振る舞う
      remotePlaybackDeviceId={null}
      isPlaybackStatePersistent
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
