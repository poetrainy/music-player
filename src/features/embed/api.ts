import { cookies } from "next/headers";
import { EmbedColor, EmbedSession, EmbedTheme } from "@/features/embed/entity";
import {
  EMBED_COLOR_COOKIE_NAME,
  EMBED_COOKIE_NAME,
  EMBED_THEME_COOKIE_NAME,
  decryptEmbedSession,
  isRecord,
  parseEmbedColor,
  parseEmbedTheme,
} from "@/features/embed/library";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
// NOTE: 期限ちょうどに API を呼ぶと失効したトークンで 401 になりうるため、少し手前で更新する
const EXPIRY_MARGIN_MILLISECONDS = 60 * 1000;

interface CachedAccessToken {
  accessToken: string;
  expiresAt: number;
}

// NOTE: 埋め込み時はアクセストークンを Cookie に持たないため、同じインスタンス内ではリクエストをまたいで使い回し、毎回の更新を避ける
const accessTokenCache = new Map<string, CachedAccessToken>();

export const getEmbedSession = async (): Promise<EmbedSession | null> => {
  const { EMBED_SECRET: secret } = process.env;
  const token = (await cookies()).get(EMBED_COOKIE_NAME)?.value;

  if (!secret || !token) {
    return null;
  }

  return decryptEmbedSession(token, secret);
};

export const getEmbedColor = async (): Promise<EmbedColor | null> =>
  parseEmbedColor((await cookies()).get(EMBED_COLOR_COOKIE_NAME)?.value);

// NOTE: 指定がない場合は通常表示と同じダークテーマで表示する
export const getEmbedTheme = async (): Promise<EmbedTheme> =>
  parseEmbedTheme((await cookies()).get(EMBED_THEME_COOKIE_NAME)?.value) ??
  "dark";

export const getEmbedAccessToken = async (
  refreshToken: string,
): Promise<string | null> => {
  const cached = accessTokenCache.get(refreshToken);

  if (cached && Date.now() < cached.expiresAt - EXPIRY_MARGIN_MILLISECONDS) {
    return cached.accessToken;
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  }).catch(() => null);

  if (!response?.ok) {
    accessTokenCache.delete(refreshToken);

    return null;
  }

  const body: unknown = await response.json();

  if (
    !isRecord(body) ||
    typeof body.access_token !== "string" ||
    typeof body.expires_in !== "number"
  ) {
    return null;
  }

  accessTokenCache.set(refreshToken, {
    accessToken: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  });

  return body.access_token;
};
