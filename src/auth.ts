import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import { YOUTUBE_AUTH_SCOPE } from "@/service/vendors/youtube/authScope";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface GoogleRefreshedTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.AUTH_GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken ?? "",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token");
    }

    const refreshed: unknown = await response.json();
    const { access_token, expires_in, refresh_token } =
      refreshed as GoogleRefreshedTokenResponse;

    return {
      ...token,
      accessToken: access_token,
      expiresAt: Math.floor(Date.now() / 1000) + expires_in,
      refreshToken: refresh_token ?? token.refreshToken,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          // NOTE: 音楽サービスの vendor を差し替える場合、OAuth スコープもそのサービスに合わせて変更が必要
          scope: `openid email profile ${YOUTUBE_AUTH_SCOPE}`,
        },
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, account }) => {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }

      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    session: async ({ session, token }) => {
      session.accessToken = token.accessToken;
      session.error = token.error;

      return session;
    },
  },
});
