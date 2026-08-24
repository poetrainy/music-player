import Image from "next/image";
import { logout } from "@/features/auth/api";
import { User } from "@/features/user/entity";

interface Props {
  user: User;
}

export function AccountComponent({ user }: Props) {
  return (
    <div className="flex min-h-[calc(100dvh-11.25rem)] flex-col gap-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="relative size-28 overflow-hidden rounded-full shadow-lg shadow-black/40">
          <Image
            src={user.avatarUrl}
            alt={user.name}
            fill
            sizes="7rem"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-xl font-bold">{user.name}</p>
          <p className="text-sm text-zinc-400">{user.email}</p>
        </div>
      </div>
      <form action={logout} className="flex justify-center">
        <button
          type="submit"
          className="text-foreground hover:bg-surface-elevated active:bg-surface-elevated/70 rounded-full border border-white/10 px-8 py-3 text-sm font-semibold"
        >
          ログアウト
        </button>
      </form>
    </div>
  );
}
