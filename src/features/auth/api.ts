"use server";

import { redirect } from "next/navigation";
import { getSignOutUrl } from "@/features/auth/library";

export const logout = async (): Promise<void> => {
  // NOTE: セッションの Cookie は全アプリで共有しているため、サインアウトすると全アプリから外れる。確認画面を持つ auth に移す
  redirect(getSignOutUrl());
};
