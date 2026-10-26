import { getEmbedSession } from "@/features/embed/api";
import { getCurrentUser } from "@/features/user/api";
import { MainLayout } from "@/layouts/MainLayout";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const isEmbedded = !!(await getEmbedSession());

  return (
    <MainLayout user={user} isEmbedded={isEmbedded}>
      {children}
    </MainLayout>
  );
}
