"use client";

import { ReactNode, useMemo } from "react";
import {
  PLAYER_CONTAINER_ID,
  PlayerContext,
  usePlayerController,
} from "@/features/player/hook";
import {
  RemotePlaybackContext,
  useRemotePlayback,
} from "@/features/remote-playback/hook";

interface Props {
  children: ReactNode;
  userEmail: string;
  remotePlaybackChannelName: string;
  remotePlaybackDeviceId: string | null;
}

export function PlayerProvider({
  children,
  userEmail,
  remotePlaybackChannelName,
  remotePlaybackDeviceId,
}: Props) {
  const player = usePlayerController(userEmail);
  const { connectedPlayer, targetDeviceId, selectTargetDevice } =
    useRemotePlayback(
      player,
      remotePlaybackChannelName,
      remotePlaybackDeviceId,
    );

  const remotePlayback = useMemo(
    () => ({ targetDeviceId, selectTargetDevice }),
    [selectTargetDevice, targetDeviceId],
  );

  return (
    <RemotePlaybackContext.Provider value={remotePlayback}>
      <PlayerContext.Provider value={connectedPlayer}>
        {children}
        <div
          id={PLAYER_CONTAINER_ID}
          className="pointer-events-none fixed top-0 left-0 size-px -translate-x-full overflow-hidden opacity-0"
        />
      </PlayerContext.Provider>
    </RemotePlaybackContext.Provider>
  );
}
