import Image from "next/image";
import Link from "next/link";
import { Music, Search } from "lucide-react";
import { User } from "@/features/user/entity";
import { SERVICE_NAME } from "@/library";

interface Props {
  user: User;
  isEmbedded: boolean;
}

export function Header({ user, isEmbedded }: Props) {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-300 items-center justify-between gap-3 px-4 py-3">
        <h1 className="shrink-0 text-lg font-bold">
          <Link
            href="/"
            className="text-contrast hover:text-muted active:text-muted hidden items-center gap-2 transition-colors md:flex"
          >
            <Music className="size-6" />
            <span>{SERVICE_NAME}</span>
          </Link>
          <Link
            href="/"
            aria-label={SERVICE_NAME}
            className="text-contrast hover:text-muted active:text-muted flex items-center transition-colors md:hidden"
          >
            <Music className="size-6" />
          </Link>
        </h1>
        <nav className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-contrast active:bg-contrast/10 flex size-9 shrink-0 items-center justify-center rounded"
            aria-label="検索"
          >
            <Search className="size-6" />
          </Link>
          {/* NOTE: 埋め込み表示ではアカウントの操作を埋め込み元で行うため、アカウントへの導線を出さない */}
          {!isEmbedded && (
            <Link
              href="/account"
              aria-label="アカウント"
              className="shrink-0 active:opacity-70"
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
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
