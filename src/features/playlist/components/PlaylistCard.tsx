"use client";

import Link from "next/link";
import { cva } from "class-variance-authority";
import { usePlayer } from "@/features/player/hook";
import { PlaylistThumbnailCollage } from "@/features/playlist/components/PlaylistThumbnailCollage";
import { Playlist } from "@/features/playlist/entity";

export const PLAYLIST_CARD_VIEW_MODES = ["list", "grid"] as const;
export type PlaylistCardViewMode = (typeof PLAYLIST_CARD_VIEW_MODES)[number];

interface Props {
  playlist: Playlist;
  viewMode: PlaylistCardViewMode;
}

const cvaPlaylistCardLink = cva("flex transition-colors", {
  variants: {
    viewMode: {
      grid: "flex-col gap-3 rounded-lg p-3",
      list: "items-center gap-3 rounded-md p-2 md:p-2.5",
    },
    isCurrentPlaylist: {
      true: "bg-surface-elevated",
      false: "hover:bg-surface-elevated active:bg-surface-elevated",
    },
  },
});

const cvaPlaylistCardTitle = cva("truncate text-sm font-bold", {
  variants: {
    isCurrentPlaylist: {
      true: "text-brand",
      false: "text-foreground",
    },
  },
});

export function PlaylistCard({ playlist, viewMode }: Props) {
  const { currentSong, playlistId } = usePlayer();

  const isCurrentPlaylist = !!currentSong && playlistId === playlist.id;

  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className={cvaPlaylistCardLink({ viewMode, isCurrentPlaylist })}
    >
      <PlaylistThumbnailCollage
        songs={playlist.songs}
        size={viewMode === "grid" ? "large" : "small"}
      />
      <div className="flex min-w-0 flex-col">
        <p className={cvaPlaylistCardTitle({ isCurrentPlaylist })}>
          {playlist.title}
        </p>
        <p className="truncate text-xs text-zinc-400">
          プレイリスト・{playlist.songs.length}曲
        </p>
      </div>
    </Link>
  );
}
