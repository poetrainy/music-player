import type { Metadata } from "next";
import { EmbedColorStyle } from "@/features/embed/components/EmbedColorStyle";
import { parseEmbedColor } from "@/features/embed/library";
import { PlayerComponent } from "@/features/player/pages/Player";
import {
  createRemotePlaybackChannelName,
  parseRemotePlaybackDeviceId,
} from "@/features/remote-playback/libraries/device";
import { getCurrentUser } from "@/features/user/api";

export const metadata: Metadata = {
  title: "プレイヤー",
};

interface Props {
  searchParams: Promise<{ device?: string; base?: string; brand?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { device, base, brand } = await searchParams;
  const remotePlaybackDeviceId = parseRemotePlaybackDeviceId(device);

  // NOTE: サイト本体の再生と混ざらないよう、再生するデバイスの指定がない場合は何も表示しない
  if (!remotePlaybackDeviceId) {
    return null;
  }

  const user = await getCurrentUser();
  const remotePlaybackChannelName = await createRemotePlaybackChannelName(
    user.email,
  );

  return (
    <>
      <EmbedColorStyle
        baseColor={parseEmbedColor(base)}
        brandColor={parseEmbedColor(brand)}
      />
      <PlayerComponent
        userEmail={user.email}
        remotePlaybackChannelName={remotePlaybackChannelName}
        remotePlaybackDeviceId={remotePlaybackDeviceId}
      />
    </>
  );
}
