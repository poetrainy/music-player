import { loginWithGoogle } from "@/features/auth/api";
import { SERVICE_NAME } from "@/library";

export function SignInComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-2xl font-extrabold tracking-tight">
          {SERVICE_NAME}
        </h1>
        <p className="text-sm text-zinc-400">
          Googleアカウントでログインしてください
        </p>
      </div>
      <form action={loginWithGoogle}>
        <button
          type="submit"
          className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black active:bg-zinc-300"
        >
          <svg viewBox="0 0 24 24" className="size-5">
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3a7.4 7.4 0 0 1-4.07 1.14c-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74l4-3.1Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.1C6.22 6.87 8.87 4.75 12 4.75Z"
            />
          </svg>
          Googleでログイン
        </button>
      </form>
    </div>
  );
}
