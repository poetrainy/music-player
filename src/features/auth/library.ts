// NOTE: Google アカウントは独自ドメインのメールアドレスでも作成できるため、@ 以前のみの一致では第三者がログインできてしまう。ドメインを固定して完全一致で判定する
const ALLOWED_EMAIL_DOMAIN = "gmail.com";

export const parseAllowedEmails = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((localPart) => localPart.trim().toLowerCase())
    .filter((localPart) => !!localPart)
    .map((localPart) => `${localPart}@${ALLOWED_EMAIL_DOMAIN}`);

export const isAllowedEmail = (
  email: unknown,
  allowedEmails: string[],
): boolean =>
  typeof email === "string" && allowedEmails.includes(email.toLowerCase());

const DEFAULT_HOME_URL = "https://poetrainy.com";

// NOTE: home の /signin?callback=<キー> は、サインイン後にこのアプリへ戻すためのキー。値は home の AUTH_CALLBACK_KEYS.music と同じにする
export const HOME_CALLBACK_KEY = "krzzl14";

export const getHomeSignInUrl = (hasCallback: boolean) => {
  const url = new URL("/signin", process.env.HOME_URL || DEFAULT_HOME_URL);

  if (hasCallback) {
    url.searchParams.set("callback", HOME_CALLBACK_KEY);
  }

  return url.toString();
};

// NOTE: home・recipes と同じセッションを読めるよう、Cookie の名前を固定し、AUTH_COOKIE_DOMAIN（例: .poetrainy.vercel.app）を親ドメインに指定する。Auth.js は Cookie 名を暗号化の salt に使うため、3 アプリで名前と AUTH_SECRET を揃える必要がある
export const getSessionCookie = () => {
  const secure = process.env.NODE_ENV === "production";

  return {
    name: `${secure ? "__Secure-" : ""}poetrainy.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure,
      domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    },
  };
};
