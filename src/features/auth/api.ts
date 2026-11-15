"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getHomeSignInUrl } from "@/features/auth/library";

export const logout = async (): Promise<void> => {
  // NOTE: セッションの Cookie は home・recipes と共有しているため、サインアウトすると全アプリから外れる。callback 付きで home に戻すと自動で再サインインしてしまうため、callback なしの URL に戻す
  await signOut({ redirect: false });
  redirect(getHomeSignInUrl(false));
};
