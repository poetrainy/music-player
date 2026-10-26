import { NextRequest, NextResponse } from "next/server";
import {
  EMBED_BASE_COLOR_QUERY_NAME,
  EMBED_BRAND_COLOR_QUERY_NAME,
  EMBED_COOKIE_OPTIONS,
  EMBED_SESSION_MAX_AGE_SECONDS,
  EMBED_THEME_COOKIE_OPTIONS,
  EMBED_THEME_QUERY_NAME,
  buildEmbedPlayerUrl,
  decryptEmbedSession,
  encryptEmbedSession,
  parseEmbedColor,
  parseEmbedTheme,
} from "@/features/embed/library";
import {
  REMOTE_PLAYBACK_DEVICE_QUERY_NAME,
  parseRemotePlaybackDeviceId,
} from "@/features/remote-playback/libraries/device";

export const GET = async (request: NextRequest) => {
  const { EMBED_SECRET: secret } = process.env;
  const { searchParams } = request.nextUrl;
  const ticket = searchParams.get("ticket");
  const session =
    secret && ticket ? await decryptEmbedSession(ticket, secret) : null;

  if (!secret || !session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // NOTE: 埋め込みは常時表示する端末での再生画面として使うため、操作 UI のないプレーヤー画面を開く
  const response = NextResponse.redirect(
    buildEmbedPlayerUrl(
      request.url,
      parseRemotePlaybackDeviceId(
        searchParams.get(REMOTE_PLAYBACK_DEVICE_QUERY_NAME),
      ),
      parseEmbedColor(searchParams.get(EMBED_BASE_COLOR_QUERY_NAME)),
      parseEmbedColor(searchParams.get(EMBED_BRAND_COLOR_QUERY_NAME)),
    ),
  );

  response.cookies.set({
    ...EMBED_COOKIE_OPTIONS,
    value: await encryptEmbedSession(
      session,
      secret,
      EMBED_SESSION_MAX_AGE_SECONDS,
    ),
  });

  const theme = parseEmbedTheme(searchParams.get(EMBED_THEME_QUERY_NAME));

  // NOTE: テーマはルートレイアウトで描画前に決めるためクエリでは渡せず、Cookie に残す。指定がない・不正な値の場合は以前の指定を残さず、既定の表示に戻す
  if (theme) {
    response.cookies.set({ ...EMBED_THEME_COOKIE_OPTIONS, value: theme });
  } else {
    response.cookies.delete(EMBED_THEME_COOKIE_OPTIONS);
  }

  return response;
};
