"use client";

import Link from "next/link";
import { usePlayer } from "@/features/player/hook";
import { PlaylistThumbnailCollage } from "@/features/playlist/components/PlaylistThumbnailCollage";
import { Playlist } from "@/features/playlist/entity";

interface Props {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: Props) {
  const { currentSong, playlistId } = usePlayer();
  const isCurrentPlaylist = !!currentSong && playlistId === playlist.id;

  return (
    <Link href={`/playlists/${playlist.id}`}>
      <div
        className={`flex items-center gap-3 rounded-md px-2 py-2 sm:hidden ${isCurrentPlaylist ? "bg-surface-elevated" : "hover:bg-surface-elevated active:bg-surface-elevated"}`}
      >
        <PlaylistThumbnailCollage songs={playlist.songs} size="sm" />
        <div className="flex min-w-0 flex-col">
          <p
            className={`truncate text-sm font-medium ${isCurrentPlaylist ? "text-brand" : "text-foreground"}`}
          >
            {playlist.title}
          </p>
          <p className="truncate text-xs text-zinc-400">
            プレイリスト・{playlist.songs.length}曲
          </p>
        </div>
      </div>
      <div
        className={`hidden rounded-lg p-3 transition-colors sm:flex sm:flex-col sm:gap-3 ${isCurrentPlaylist ? "bg-surface-elevated" : "hover:bg-surface-elevated active:bg-surface-elevated"}`}
      >
        <PlaylistThumbnailCollage songs={playlist.songs} size="lg" />
        <div className="flex flex-col">
          <p
            className={`truncate text-sm font-semibold ${isCurrentPlaylist ? "text-brand" : "text-foreground"}`}
          >
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
