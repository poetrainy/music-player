import { EncryptJWT, jwtDecrypt } from "jose";
import colors from "tailwindcss/colors";
import {
  EMBED_RESUME_MESSAGE_TYPE,
  EMBED_THEMES,
  EMBED_THEME_MESSAGE_TYPE,
  EmbedColor,
  EmbedSession,
  EmbedTheme,
} from "@/features/embed/entity";
import { REMOTE_PLAYBACK_DEVICE_QUERY_NAME } from "@/features/remote-playback/libraries/device";

export const EMBED_COOKIE_NAME = "music-player-embed";
export const EMBED_THEME_COOKIE_NAME = "music-player-embed-theme";
export const EMBED_BASE_COLOR_QUERY_NAME = "base";
export const EMBED_BRAND_COLOR_QUERY_NAME = "brand";
export const EMBED_THEME_QUERY_NAME = "theme";
export const EMBED_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// NOTE: 別サイトの iframe 内でも Cookie を送れるよう SameSite=None にし、埋め込み元ごとに分離して保存されるよう Partitioned を付ける
export const EMBED_COOKIE_OPTIONS = {
  name: EMBED_COOKIE_NAME,
  httpOnly: true,
  secure: true,
  sameSite: "none",
  partitioned: true,
  path: "/",
  maxAge: EMBED_SESSION_MAX_AGE_SECONDS,
} as const;

export const EMBED_THEME_COOKIE_OPTIONS = {
  ...EMBED_COOKIE_OPTIONS,
  name: EMBED_THEME_COOKIE_NAME,
} as const;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// NOTE: 埋め込み元と同じ秘密鍵から同じ手順で鍵を作り、互いに暗号化・復号できるようにする
const createEmbedKey = async (secret: string): Promise<Uint8Array> =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)),
  );

export const encryptEmbedSession = async (
  { refreshToken, user }: EmbedSession,
  secret: string,
  expiresInSeconds: number,
): Promise<string> =>
  new EncryptJWT({ refreshToken, user })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .encrypt(await createEmbedKey(secret));

export const decryptEmbedSession = async (
  token: string,
  secret: string,
): Promise<EmbedSession | null> => {
  try {
    const {
      payload: { refreshToken, user },
    } = await jwtDecrypt(token, await createEmbedKey(secret));

    if (
      typeof refreshToken !== "string" ||
      !isRecord(user) ||
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      typeof user.avatarUrl !== "string"
    ) {
      return null;
    }

    return {
      refreshToken,
      user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    };
  } catch {
    return null;
  }
};

const isEmbedColor = (value: string): value is EmbedColor =>
  Object.entries(colors).some(
    ([name, palette]) => name === value && typeof palette !== "string",
  );

// NOTE: 値は CSS にそのまま埋め込むため、Tailwind のカラーパレットに存在する色名以外は受け付けない
export const parseEmbedColor = (
  value: string | null | undefined,
): EmbedColor | null => (value && isEmbedColor(value) ? value : null);

export const parseEmbedTheme = (
  value: string | null | undefined,
): EmbedTheme | null => EMBED_THEMES.find((theme) => theme === value) ?? null;

// NOTE: message イベントは任意の値を受け取りうるため、種類とテーマの値を確かめてから使う
export const parseEmbedThemeMessage = (data: unknown): EmbedTheme | null =>
  isRecord(data) &&
  data.type === EMBED_THEME_MESSAGE_TYPE &&
  typeof data.theme === "string"
    ? parseEmbedTheme(data.theme)
    : null;

export const isEmbedResumeMessage = (data: unknown): boolean =>
  isRecord(data) && data.type === EMBED_RESUME_MESSAGE_TYPE;

// NOTE: 再生先のデバイスと色は iframe の表示ごとに決まり、サイト本体の表示に残さないよう、Cookie ではなくプレーヤー画面のクエリで渡す
export const buildEmbedPlayerUrl = (
  requestUrl: string,
  deviceId: string | null,
  baseColor: EmbedColor | null,
  brandColor: EmbedColor | null,
): URL => {
  const url = new URL("/player", requestUrl);

  // NOTE: デバイスの指定がない場合、プレーヤー画面は何も表示しない
  if (deviceId) {
    url.searchParams.set(REMOTE_PLAYBACK_DEVICE_QUERY_NAME, deviceId);
  }

  if (baseColor) {
    url.searchParams.set(EMBED_BASE_COLOR_QUERY_NAME, baseColor);
  }

  if (brandColor) {
    url.searchParams.set(EMBED_BRAND_COLOR_QUERY_NAME, brandColor);
  }

  return url;
};
