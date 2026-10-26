import type { Metadata } from "next";
import {
  getEmbedBaseColor,
  getEmbedBrandColor,
  getEmbedDeviceId,
} from "@/features/embed/api";
import { EmbedColorStyle } from "@/features/embed/components/EmbedColorStyle";
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
  const embedBaseColor = await getEmbedBaseColor();
  const embedBrandColor = await getEmbedBrandColor();

  return (
    <>
      <EmbedColorStyle
        baseColor={embedBaseColor}
        brandColor={embedBrandColor}
      />
      <PlayerComponent
        userEmail={user.email}
        remotePlaybackChannelName={remotePlaybackChannelName}
        remotePlaybackDeviceId={remotePlaybackDeviceId}
      />
    </>
  );
}
