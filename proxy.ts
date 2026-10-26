import { NextRequest, NextResponse } from "next/server";
import {
  EMBED_BASE_COLOR_COOKIE_NAME,
  EMBED_BASE_COLOR_COOKIE_OPTIONS,
  EMBED_BRAND_COLOR_COOKIE_NAME,
  EMBED_BRAND_COLOR_COOKIE_OPTIONS,
  EMBED_COOKIE_NAME,
  EMBED_COOKIE_OPTIONS,
  EMBED_DEVICE_COOKIE_NAME,
  EMBED_DEVICE_COOKIE_OPTIONS,
  EMBED_SESSION_MAX_AGE_SECONDS,
  EMBED_THEME_COOKIE_NAME,
  EMBED_THEME_COOKIE_OPTIONS,
  decryptEmbedSession,
  encryptEmbedSession,
  parseEmbedColor,
  parseEmbedTheme,
} from "@/features/embed/library";
import { parseRemotePlaybackDeviceId } from "@/features/remote-playback/libraries/device";

// NOTE: 埋め込み元はチケットを初回表示時にしか渡さないため、アクセスのたびに埋め込み用セッションの有効期限を延ばし、使われている限り切れないようにする
export const proxy = async (request: NextRequest) => {
  const response = NextResponse.next();
  const { EMBED_SECRET: secret } = process.env;
  const token = request.cookies.get(EMBED_COOKIE_NAME)?.value;

  if (!secret || !token) {
    return response;
  }

  const session = await decryptEmbedSession(token, secret);

  if (!session) {
    return response;
  }

  response.cookies.set({
    ...EMBED_COOKIE_OPTIONS,
    value: await encryptEmbedSession(
      session,
      secret,
      EMBED_SESSION_MAX_AGE_SECONDS,
    ),
  });

  const baseColor = parseEmbedColor(
    request.cookies.get(EMBED_BASE_COLOR_COOKIE_NAME)?.value,
  );
  const brandColor = parseEmbedColor(
    request.cookies.get(EMBED_BRAND_COLOR_COOKIE_NAME)?.value,
  );

  const theme = parseEmbedTheme(
    request.cookies.get(EMBED_THEME_COOKIE_NAME)?.value,
  );

  if (baseColor) {
    response.cookies.set({
      ...EMBED_BASE_COLOR_COOKIE_OPTIONS,
      value: baseColor,
    });
  }

  if (brandColor) {
    response.cookies.set({
      ...EMBED_BRAND_COLOR_COOKIE_OPTIONS,
      value: brandColor,
    });
  }

  if (theme) {
    response.cookies.set({ ...EMBED_THEME_COOKIE_OPTIONS, value: theme });
  }

  const deviceId = parseRemotePlaybackDeviceId(
    request.cookies.get(EMBED_DEVICE_COOKIE_NAME)?.value,
  );

  if (deviceId) {
    response.cookies.set({ ...EMBED_DEVICE_COOKIE_OPTIONS, value: deviceId });
  }

  return response;
};

export const config = {
  matcher: ["/((?!api/auth|embed|_next/static|_next/image|favicon.ico).*)"],
};
