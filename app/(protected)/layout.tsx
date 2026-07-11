import { redirect } from "next/navigation";
import { getCurrentUser, getQuotaUsage } from "@/api";
import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { PlayerContentArea } from "@/features/player/components/PlayerContentArea";
import { PlayerDrawerRestoreButton } from "@/features/player/components/PlayerDrawerRestoreButton";
import { PlayerMiniPlayer } from "@/features/player/components/PlayerMiniPlayer";
import { PlayerProvider } from "@/features/player/components/PlayerProvider";

export default async function ProtectedLayout({
  children,
  drawer,
}: Readonly<{
  children: React.ReactNode;
  drawer: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const [user, quota] = await Promise.all([getCurrentUser(), getQuotaUsage()]);

  return (
    <PlayerProvider>
      <AppHeader quota={quota} user={user} />
      <PlayerContentArea>{children}</PlayerContentArea>
      {drawer}
      <PlayerMiniPlayer />
      <PlayerDrawerRestoreButton />
    </PlayerProvider>
  );
}
