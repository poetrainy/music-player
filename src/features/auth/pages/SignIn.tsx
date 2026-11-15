import { getHomeSignInUrl } from "@/features/auth/library";
import { SERVICE_NAME } from "@/library";

export function SignInComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-contrast text-2xl font-extrabold tracking-tight">
          {SERVICE_NAME}
        </h1>
        <p className="text-muted text-sm">
          Googleアカウントでログインしてください
        </p>
      </div>
      {/* NOTE: サインインは home に集約しているため、callback 付きで home に移す。home で認証が済むと自動でこのアプリに戻る */}
      <a
        href={getHomeSignInUrl(true)}
        className="bg-contrast text-surface active:bg-contrast/80 flex items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold"
      >
        Googleでログイン
      </a>
    </div>
  );
}
