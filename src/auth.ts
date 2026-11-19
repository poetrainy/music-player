import { headers } from "next/headers";
import { cache } from "react";
import { getToken } from "next-auth/jwt";
import {
  getRefreshUrl,
  getSessionCookieName,
  getSignInUrl,
  isTokenExpired,
} from "@/features/auth/library";

export interface Session {
  user: { name: string; email: string; image: string };
  accessToken: string;
}

type AuthState =
  | { status: "authenticated"; session: Session }
  | { status: "signin" | "refresh" };

// NOTE: セッションは auth が発行した Cookie を読むだけで、このアプリでは発行・更新しない。サインインの可否は auth が Cookie の isAllowed に入れた結果に従い、許可リストはこのアプリでは持たない
const fetchAuthState = cache(async (): Promise<AuthState> => {
  const cookieName = getSessionCookieName();
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    cookieName,
    salt: cookieName,
  });

  // NOTE: refresh token が失効している場合は更新しても成功しないため、サインインし直してもらう
  if (
    !token ||
    token.isAllowed !== true ||
    token.isRefreshFailed === true ||
    typeof token.accessToken !== "string" ||
    typeof token.email !== "string"
  ) {
    return { status: "signin" };
  }

  // NOTE: アクセストークンの更新は auth しか行えないため、期限切れなら auth で更新してから戻ってもらう
  if (isTokenExpired(token.expiresAtSeconds, new Date())) {
    return { status: "refresh" };
  }

  return {
    status: "authenticated",
    session: {
      user: {
        name: token.name ?? "",
        email: token.email,
        image: token.picture ?? "",
      },
      accessToken: token.accessToken,
    },
  };
});

export const auth = async (): Promise<Session | null> => {
  const state = await fetchAuthState();

  return state.status === "authenticated" ? state.session : null;
};

// NOTE: 未サインインなら auth のサインインへ、トークンが期限切れなら auth の更新へ移す
export const getAuthRedirectUrl = async (): Promise<string> =>
  (await fetchAuthState()).status === "refresh"
    ? getRefreshUrl()
    : getSignInUrl();
