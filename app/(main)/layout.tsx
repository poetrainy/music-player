import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser, getQuotaUsage } from "@/features/user/api";
import { MainLayout } from "@/layouts/MainLayout";

export default async function Layout({
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
    <MainLayout quota={quota} user={user}>
      {children}
    </MainLayout>
  );
}
