import { NextRequest, NextResponse } from "next/server";
import {
  EMBED_BASE_COLOR_COOKIE_OPTIONS,
  EMBED_BRAND_COLOR_COOKIE_OPTIONS,
  EMBED_COOKIE_OPTIONS,
  EMBED_SESSION_MAX_AGE_SECONDS,
  EMBED_THEME_COOKIE_OPTIONS,
  decryptEmbedSession,
  encryptEmbedSession,
  parseEmbedColor,
  parseEmbedTheme,
} from "@/features/embed/library";

export const GET = async (request: NextRequest) => {
  const { EMBED_SECRET: secret } = process.env;
  const ticket = request.nextUrl.searchParams.get("ticket");
  const session =
    secret && ticket ? await decryptEmbedSession(ticket, secret) : null;

  if (!secret || !session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.set({
    ...EMBED_COOKIE_OPTIONS,
    value: await encryptEmbedSession(
      session,
      secret,
      EMBED_SESSION_MAX_AGE_SECONDS,
    ),
  });

  const baseColor = parseEmbedColor(request.nextUrl.searchParams.get("base"));
  const brandColor = parseEmbedColor(request.nextUrl.searchParams.get("brand"));
  const theme = parseEmbedTheme(request.nextUrl.searchParams.get("theme"));

  // NOTE: 指定がない・不正な値の場合は以前の指定を残さず、既定の表示に戻す
  if (baseColor) {
    response.cookies.set({
      ...EMBED_BASE_COLOR_COOKIE_OPTIONS,
      value: baseColor,
    });
  } else {
    response.cookies.delete(EMBED_BASE_COLOR_COOKIE_OPTIONS);
  }

  if (brandColor) {
    response.cookies.set({
      ...EMBED_BRAND_COLOR_COOKIE_OPTIONS,
      value: brandColor,
    });
  } else {
    response.cookies.delete(EMBED_BRAND_COLOR_COOKIE_OPTIONS);
  }

  if (theme) {
    response.cookies.set({ ...EMBED_THEME_COOKIE_OPTIONS, value: theme });
  } else {
    response.cookies.delete(EMBED_THEME_COOKIE_OPTIONS);
  }

  return response;
};
