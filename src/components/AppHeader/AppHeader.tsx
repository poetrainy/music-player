import Image from "next/image";
import Link from "next/link";
import { Music, Search } from "lucide-react";
import { QuotaRing } from "@/components/QuotaRing/QuotaRing";
import { QuotaUsage, User } from "@/entity";

interface Props {
  quota: QuotaUsage;
  user: User;
}

export function AppHeader({ quota, user }: Props) {
  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-300 items-center justify-between gap-3 p-4">
        <Link
          href="/"
          aria-label="YouTube Music Player"
          className="text-foreground flex shrink-0 items-center gap-2"
        >
          <Music className="h-6 w-6" />
          <h1 className="hidden text-lg font-bold sm:block">
            YouTube Music Player
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-foreground flex h-9 w-9 shrink-0 items-center justify-center"
            aria-label="検索"
          >
            <Search className="h-6 w-6" />
          </Link>
          <Link href="/account" className="shrink-0">
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
                  sizes="36px"
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
