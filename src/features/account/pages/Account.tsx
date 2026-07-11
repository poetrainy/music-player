import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QuotaUsage, User } from "@/entity";
import { logout } from "@/features/auth/api";

interface Props {
  quota: QuotaUsage;
  user: User;
}

export function AccountComponent({ quota, user }: Props) {
  const ratio =
    quota.totalUnits > 0 ? Math.min(quota.usedUnits / quota.totalUnits, 1) : 0;
  const ratioPercent = Math.round(ratio * 100);
  const fillColorClassName =
    ratio >= 0.9 ? "bg-red-500" : ratio >= 0.7 ? "bg-amber-500" : "bg-brand";
  const resetAtLabel = new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(quota.resetAt));

  return (
    <div className="flex min-h-dvh flex-col gap-8 p-6">
      <Link
        href="/"
        className="flex items-center gap-1 self-start text-sm text-zinc-400"
      >
        <ChevronLeft className="h-5 w-5" />
        戻る
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-full shadow-lg shadow-black/40">
          <Image
            src={user.avatarUrl}
            alt={user.name}
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-xl font-bold">{user.name}</p>
          <p className="text-sm text-zinc-400">{user.email}</p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2 text-left">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>APIリクエスト使用量</span>
            <span>
              {quota.usedUnits.toLocaleString()} /{" "}
              {quota.totalUnits.toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${fillColorClassName}`}
              style={{ width: `${ratioPercent}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">{resetAtLabel} にリセット</p>
        </div>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="text-foreground hover:bg-surface-elevated w-full rounded-full border border-white/10 py-3 text-sm font-semibold"
        >
          ログアウト
        </button>
      </form>
    </div>
  );
}
