"use server";

import { signIn, signOut } from "@/auth";

export const loginWithGoogle = async (): Promise<void> => {
  await signIn("google", { redirectTo: "/" });
};

export const logout = async (): Promise<void> => {
  await signOut({ redirectTo: "/signin" });
};
