import Image from "next/image";
import Link from "next/link";
import { Music, Search } from "lucide-react";
import { QuotaRing } from "@/components/QuotaRing";
import { QuotaUsage, User } from "@/features/user/entity";

interface Props {
  quota: QuotaUsage;
  user: User;
}

export function AppHeader({ quota, user }: Props) {
  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-300 items-center justify-between gap-3 p-4">
        <h1 className="shrink-0 text-lg font-bold">
          <Link
            href="/"
            className="text-foreground hidden items-center gap-2 active:text-zinc-400 md:flex"
          >
            <Music className="h-6 w-6" />
            <span>YouTube Music Player</span>
          </Link>
          <Link
            href="/"
            aria-label="YouTube Music Player"
            className="text-foreground flex items-center active:text-zinc-400 md:hidden"
          >
            <Music className="h-6 w-6" />
          </Link>
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded active:bg-white/10"
            aria-label="検索"
          >
            <Search className="h-6 w-6" />
          </Link>
          <Link href="/account" className="shrink-0 active:opacity-70">
            <QuotaRing
              size={44}
              totalUnits={quota.totalUnits}
              usedUnits={quota.usedUnits}
            >
              <div className="relative h-9 w-9 overflow-hidden rounded-full">
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  fill
                  sizes="2.25rem"
                  className="object-cover"
                />
              </div>
            </QuotaRing>
          </Link>
        </div>
      </div>
    </div>
  );
}
