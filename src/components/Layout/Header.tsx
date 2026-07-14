import Image from "next/image";
import Link from "next/link";
import { Music, Search } from "lucide-react";
import { QuotaRing } from "@/components/QuotaRing";
import { QuotaUsage, User } from "@/features/user/entity";
import { SERVICE_NAME } from "@/library";

interface Props {
  quota: QuotaUsage;
  user: User;
}

export function Header({ quota, user }: Props) {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-300 items-center justify-between gap-3 p-4">
        <h1 className="shrink-0 text-lg font-bold">
          <Link
            href="/"
            className="text-foreground hidden items-center gap-2 transition-colors hover:text-zinc-300 active:text-zinc-400 md:flex"
          >
            <Music className="size-6" />
            <span>{SERVICE_NAME}</span>
          </Link>
          <Link
            href="/"
            aria-label={SERVICE_NAME}
            className="text-foreground flex items-center transition-colors hover:text-zinc-300 active:text-zinc-400 md:hidden"
          >
            <Music className="size-6" />
          </Link>
        </h1>
        <nav className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-foreground flex size-9 shrink-0 items-center justify-center rounded active:bg-white/10"
            aria-label="検索"
          >
            <Search className="size-6" />
          </Link>
          <Link
            href="/account"
            aria-label="アカウント"
            className="shrink-0 active:opacity-70"
          >
            <QuotaRing
              size={44}
              totalUnits={quota.totalUnits}
              usedUnits={quota.usedUnits}
            >
              <div className="relative size-9 overflow-hidden rounded-full">
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
        </nav>
      </div>
    </header>
  );
}
