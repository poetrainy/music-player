import { cookies } from "next/headers";
import { EmbedSession, EmbedTheme } from "@/features/embed/entity";
import {
  EMBED_COOKIE_NAME,
  EMBED_THEME_COOKIE_NAME,
  decryptEmbedSession,
  isRecord,
  parseEmbedTheme,
} from "@/features/embed/library";

// NOTE: Google への更新は OAuth クライアントのシークレットを持つ auth に任せる
const EMBED_TOKEN_URL = "https://auth.poetrainy.com/api/embed-token";
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

  const { EMBED_SECRET: secret } = process.env;

  if (!secret) {
    return null;
  }

  const response = await fetch(EMBED_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) {
    accessTokenCache.delete(refreshToken);

    return null;
  }

  const body: unknown = await response.json().catch(() => null);

  if (
    !isRecord(body) ||
    typeof body.accessToken !== "string" ||
    typeof body.expiresAtSeconds !== "number"
  ) {
    return null;
  }

  accessTokenCache.set(refreshToken, {
    accessToken: body.accessToken,
    expiresAt: body.expiresAtSeconds * 1000,
  });

  return body.accessToken;
};
