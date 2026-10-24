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
