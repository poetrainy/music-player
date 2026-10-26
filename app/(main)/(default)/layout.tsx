import { getEmbedDeviceId, getEmbedSession } from "@/features/embed/api";
import { createRemotePlaybackChannelName } from "@/features/remote-playback/libraries/device";
import { getCurrentUser } from "@/features/user/api";
import { MainLayout } from "@/layouts/MainLayout";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const hasEmbedSession = !!(await getEmbedSession());
  const remotePlaybackChannelName = await createRemotePlaybackChannelName(
    user.email,
  );
  const remotePlaybackDeviceId = await getEmbedDeviceId();

  return (
    <MainLayout
      user={user}
      hasEmbedSession={hasEmbedSession}
      remotePlaybackChannelName={remotePlaybackChannelName}
      remotePlaybackDeviceId={remotePlaybackDeviceId}
    >
      {children}
    </MainLayout>
  );
}
