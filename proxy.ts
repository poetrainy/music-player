import { NextRequest, NextResponse } from "next/server";
import {
  EMBED_COOKIE_NAME,
  EMBED_COOKIE_OPTIONS,
  EMBED_SESSION_MAX_AGE_SECONDS,
  EMBED_THEME_COOKIE_NAME,
  EMBED_THEME_COOKIE_OPTIONS,
  decryptEmbedSession,
  encryptEmbedSession,
  parseEmbedTheme,
} from "@/features/embed/library";
import {
  REMOTE_PLAYBACK_DEVICE_QUERY_NAME,
  REMOTE_PLAYBACK_TARGET_DEVICE_COOKIE_OPTIONS,
  parseRemotePlaybackDeviceId,
} from "@/features/remote-playback/libraries/device";

const PLAYER_PATHNAME = "/player";

// NOTE: 共有された URL を開くだけで再生先を切り替えられるよう、クエリの指定を Cookie に移し、クエリのない URL に戻す
const redirectWithRemotePlaybackTarget = (
  request: NextRequest,
  deviceQuery: string,
): NextResponse => {
  const url = request.nextUrl.clone();

  url.searchParams.delete(REMOTE_PLAYBACK_DEVICE_QUERY_NAME);

  const response = NextResponse.redirect(url);
  const deviceId = parseRemotePlaybackDeviceId(deviceQuery);

  // NOTE: 登録されていないデバイスが指定された場合は、自分で再生する設定に戻す
  if (deviceId) {
    response.cookies.set({
      ...REMOTE_PLAYBACK_TARGET_DEVICE_COOKIE_OPTIONS,
      value: deviceId,
    });
  } else {
    // NOTE: maxAge を渡すと削除ではなく空の値で保存されるため、名前とパスだけを指定する
    const { name, path } = REMOTE_PLAYBACK_TARGET_DEVICE_COOKIE_OPTIONS;

    response.cookies.delete({ name, path });
  }

  return response;
};

// NOTE: 埋め込み元はチケットを初回表示時にしか渡さないため、アクセスのたびに埋め込み用セッションの有効期限を延ばし、使われている限り切れないようにする
export const proxy = async (request: NextRequest) => {
  const deviceQuery = request.nextUrl.searchParams.get(
    REMOTE_PLAYBACK_DEVICE_QUERY_NAME,
  );

  // NOTE: プレーヤー画面のクエリは自分が再生するデバイスの指定で、操作側の再生先の指定ではないため切り替えない
  if (deviceQuery !== null && request.nextUrl.pathname !== PLAYER_PATHNAME) {
    return redirectWithRemotePlaybackTarget(request, deviceQuery);
  }

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

  const theme = parseEmbedTheme(
    request.cookies.get(EMBED_THEME_COOKIE_NAME)?.value,
  );

  if (theme) {
    response.cookies.set({ ...EMBED_THEME_COOKIE_OPTIONS, value: theme });
  }

  return response;
};

export const config = {
  matcher: ["/((?!api/auth|embed|_next/static|_next/image|favicon.ico).*)"],
};
