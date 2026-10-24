import { NextRequest, NextResponse } from "next/server";
import {
  EMBED_COOKIE_NAME,
  EMBED_COOKIE_OPTIONS,
  EMBED_SESSION_MAX_AGE_SECONDS,
  decryptEmbedSession,
  encryptEmbedSession,
} from "@/features/embed/library";

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

  return response;
};

export const config = {
  matcher: ["/((?!api/auth|embed|_next/static|_next/image|favicon.ico).*)"],
};
