"use client";

import { useState } from "react";
import { cva } from "class-variance-authority";
import {
  PlaylistCard,
  PlaylistCardViewMode,
} from "@/features/playlist/components/PlaylistCard";
import { PlaylistViewModeToggle } from "@/features/playlist/components/PlaylistViewModeToggle";
import { Playlist } from "@/features/playlist/entity";

interface Props {
  playlists: Playlist[];
}

const cvaPlaylistListComponent = cva("", {
  variants: {
    viewMode: {
      grid: "grid grid-cols-2 gap-2 md:gap-4 sm:grid-cols-3 md:grid-cols-4",
      list: "flex flex-col gap-1",
    },
  },
});

export function PlaylistListComponent({ playlists }: Props) {
  const [viewMode, setViewMode] = useState<PlaylistCardViewMode>("grid");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-extrabold tracking-tight">
          プレイリスト
        </h1>
        <PlaylistViewModeToggle onChange={setViewMode} />
      </div>
      <ul className={cvaPlaylistListComponent({ viewMode })}>
        {playlists.map((playlist) => (
          <li key={playlist.id}>
            <PlaylistCard playlist={playlist} viewMode={viewMode} />
          </li>
        ))}
      </ul>
    </div>
  );
}
