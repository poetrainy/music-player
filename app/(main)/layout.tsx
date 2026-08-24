import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/features/user/api";
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

  const user = await getCurrentUser();

  return <MainLayout user={user}>{children}</MainLayout>;
}
