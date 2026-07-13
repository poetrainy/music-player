"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { PlaylistCardViewMode } from "@/features/playlist/components/PlaylistCard";

const VIEW_MODE_STORAGE_KEY = "playlist-view-mode";
const DEFAULT_VIEW_MODE: PlaylistCardViewMode = "grid";

interface Props {
  onChange: (viewMode: PlaylistCardViewMode) => void;
}

export function PlaylistViewModeToggle({ onChange }: Props) {
  const [viewMode, setViewMode] =
    useState<PlaylistCardViewMode>(DEFAULT_VIEW_MODE);

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);

    if (stored !== "grid" && stored !== "list") {
      return;
    }

    // NOTE: localStorage はクライアントでしか参照できないため、マウント後に同期してSSRとのハイドレーション不整合を避けている
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewMode(stored);
    onChange(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleViewMode = () => {
    const nextMode = viewMode === "grid" ? "list" : "grid";

    setViewMode(nextMode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextMode);
    onChange(nextMode);
  };

  return (
    <IconButton
      type="button"
      onClick={toggleViewMode}
      aria-label={
        viewMode === "grid" ? "リスト表示に切り替え" : "グリッド表示に切り替え"
      }
      className="text-zinc-400"
    >
      {viewMode === "grid" ? (
        <LayoutGrid className="size-5" />
      ) : (
        <List className="size-5" />
      )}
    </IconButton>
  );
}
