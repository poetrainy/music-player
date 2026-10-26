import type { Metadata } from "next";
import { PlayerComponent } from "@/features/player/pages/Player";
import { getCurrentUser } from "@/features/user/api";

export const metadata: Metadata = {
  title: "プレイヤー",
};

export default async function Page() {
  const user = await getCurrentUser();

  return <PlayerComponent userEmail={user.email} />;
}
