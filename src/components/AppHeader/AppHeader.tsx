import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { QuotaRing } from "@/components/QuotaRing/QuotaRing";
import { QuotaUsage, User } from "@/entity";

interface Props {
  quota: QuotaUsage;
  user: User;
}

export function AppHeader({ quota, user }: Props) {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-end gap-3 p-4">
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
  );
}
