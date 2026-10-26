import type { Metadata } from "next";
import { getEmbedDeviceId } from "@/features/embed/api";
import { PlayerComponent } from "@/features/player/pages/Player";
import { createRemotePlaybackChannelName } from "@/features/remote-playback/libraries/device";
import { getCurrentUser } from "@/features/user/api";

export const metadata: Metadata = {
  title: "プレイヤー",
};

export default async function Page() {
  const user = await getCurrentUser();
  const remotePlaybackChannelName = await createRemotePlaybackChannelName(
    user.email,
  );
  const remotePlaybackDeviceId = await getEmbedDeviceId();

  return (
    <PlayerComponent
      userEmail={user.email}
      remotePlaybackChannelName={remotePlaybackChannelName}
      remotePlaybackDeviceId={remotePlaybackDeviceId}
    />
  );
}
