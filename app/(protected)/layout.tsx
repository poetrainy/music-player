import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { PlayerLayout } from "@/features/player/components/PlayerLayout";
import { PlayerMiniPlayer } from "@/features/player/components/PlayerMiniPlayer";
import { PlayerProvider } from "@/features/player/components/PlayerProvider";
import { getCurrentUser, getQuotaUsage } from "@/features/user/api";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const [user, quota] = await Promise.all([getCurrentUser(), getQuotaUsage()]);

  return (
    <PlayerProvider>
      <AppHeader quota={quota} user={user} />
      <PlayerLayout>{children}</PlayerLayout>
      <PlayerMiniPlayer />
    </PlayerProvider>
  );
}
