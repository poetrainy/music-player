const AUTH_APP_URL = "https://auth.poetrainy.com";

// NOTE: auth の許可リストにある Music Player のキー。サインイン後にこのアプリへ戻すために `/signin?callback=` などへ渡す
const AUTH_CALLBACK_KEY = "krzzl14";

// NOTE: 期限ちょうどに API を呼ぶと失効したトークンで 401 になりうるため、少し手前で更新する
const EXPIRY_MARGIN_SECONDS = 60;

export const isTokenExpired = (expiresAtSeconds: unknown, now: Date): boolean =>
  typeof expiresAtSeconds !== "number" ||
  now.getTime() >= (expiresAtSeconds - EXPIRY_MARGIN_SECONDS) * 1000;

// NOTE: auth・home・recipes と同じセッションを読むため、Cookie の名前を揃える。Auth.js は Cookie 名を暗号化の salt に使うため、名前と AUTH_SECRET が違うと復号できない
export const getSessionCookieName = (): string =>
  `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}poetrainy.session-token`;

// NOTE: ログイン・トークンの更新・サインアウトは auth が行うため、必要なときにそちらへ移す。終わると callback のキーに対応するこのアプリへ戻る
const getAuthAppUrl = (pathname: string): string => {
  const url = new URL(pathname, AUTH_APP_URL);

  url.searchParams.set("callback", AUTH_CALLBACK_KEY);

  return url.toString();
};

export const getSignInUrl = (): string => getAuthAppUrl("/signin");

export const getRefreshUrl = (): string => getAuthAppUrl("/refresh");

export const getSignOutUrl = (): string => getAuthAppUrl("/signout");
