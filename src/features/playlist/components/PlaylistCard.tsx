import Link from "next/link";
import { PlaylistThumbnailCollage } from "@/features/playlist/components/PlaylistThumbnailCollage";
import { Playlist } from "@/features/playlist/entity";

interface Props {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: Props) {
  return (
    <Link href={`/playlists/${playlist.id}`}>
      <div className="hover:bg-surface-elevated active:bg-surface-elevated flex items-center gap-3 rounded-md px-2 py-2 sm:hidden">
        <PlaylistThumbnailCollage songs={playlist.songs} size="sm" />
        <div className="flex min-w-0 flex-col">
          <p className="text-foreground truncate text-sm font-medium">
            {playlist.title}
          </p>
          <p className="truncate text-xs text-zinc-400">
            プレイリスト・{playlist.songs.length}曲
          </p>
        </div>
      </div>
      <div className="hover:bg-surface-elevated active:bg-surface-elevated hidden rounded-lg p-3 transition-colors sm:flex sm:flex-col sm:gap-3">
        <PlaylistThumbnailCollage songs={playlist.songs} size="lg" />
        <div className="flex flex-col">
          <p className="text-foreground truncate text-sm font-semibold">
            {playlist.title}
          </p>
          <p className="truncate text-xs text-zinc-400">
            プレイリスト・{playlist.songs.length}曲
          </p>
        </div>
      </div>
    </Link>
  );
}
