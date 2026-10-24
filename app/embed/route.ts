import { NextRequest, NextResponse } from "next/server";
import {
  EMBED_COOKIE_OPTIONS,
  EMBED_SESSION_MAX_AGE_SECONDS,
  decryptEmbedSession,
  encryptEmbedSession,
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

  return response;
};
