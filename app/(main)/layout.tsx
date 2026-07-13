import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader";
import { PlayerLayout } from "@/features/player/components/PlayerLayout";
import { PlayerMiniPlayer } from "@/features/player/components/PlayerMiniPlayer";
import { PlayerProvider } from "@/features/player/components/PlayerProvider";
import { getCurrentUser, getQuotaUsage } from "@/features/user/api";

export default async function MainLayout({
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
    <PlayerProvider userEmail={user.email}>
      <AppHeader quota={quota} user={user} />
      <main className="mx-auto w-full max-w-300 px-4 pt-6 pb-20">
        <PlayerLayout>{children}</PlayerLayout>
      </main>
      <PlayerMiniPlayer />
    </PlayerProvider>
  );
}
