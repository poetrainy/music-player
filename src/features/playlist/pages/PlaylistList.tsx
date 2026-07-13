"use client";

import { useEffect, useState } from "react";
import { cva } from "class-variance-authority";
import { Spinner } from "@/components/Spinner";
import {
  PlaylistCard,
  PlaylistCardViewMode,
} from "@/features/playlist/components/PlaylistCard";
import { PlaylistViewModeToggle } from "@/features/playlist/components/PlaylistViewModeToggle";
import { Playlist } from "@/features/playlist/entity";
import {
  loadPlaylistViewMode,
  savePlaylistViewMode,
} from "@/features/playlist/library";

interface Props {
  playlists: Playlist[];
}

const DEFAULT_VIEW_MODE: PlaylistCardViewMode = "grid";

const cvaPlaylistListComponent = cva("", {
  variants: {
    viewMode: {
      grid: "grid grid-cols-2 gap-2 md:gap-4 sm:grid-cols-3 md:grid-cols-4",
      list: "flex flex-col gap-1",
    },
  },
});

export function PlaylistListComponent({ playlists }: Props) {
  const [viewMode, setViewMode] =
    useState<PlaylistCardViewMode>(DEFAULT_VIEW_MODE);
  const [isViewModeLoaded, setIsViewModeLoaded] = useState(false);

  useEffect(() => {
    const stored = loadPlaylistViewMode();

    // NOTE: localStorage はクライアントでしか参照できないため、マウント後に同期してSSRとのハイドレーション不整合を避けている
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewMode(stored);
    }

    setIsViewModeLoaded(true);
  }, []);

  const handleViewModeChange = (nextViewMode: PlaylistCardViewMode) => {
    setViewMode(nextViewMode);
    savePlaylistViewMode(nextViewMode);
  };

  if (!isViewModeLoaded) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-extrabold tracking-tight">
          プレイリスト
        </h1>
        <PlaylistViewModeToggle
          viewMode={viewMode}
          onChange={handleViewModeChange}
        />
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
