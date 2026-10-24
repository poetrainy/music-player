import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEmbedSession } from "@/features/embed/api";
import { getCurrentUser } from "@/features/user/api";
import { MainLayout } from "@/layouts/MainLayout";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // NOTE: 埋め込み表示ではログイン画面を開けないため、埋め込み用のセッションでも表示を許可する
  if (!session && !(await getEmbedSession())) {
    redirect("/signin");
  }

  const user = await getCurrentUser();

  return <MainLayout user={user}>{children}</MainLayout>;
}
