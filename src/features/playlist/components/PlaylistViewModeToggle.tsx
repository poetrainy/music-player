"use client";

import { LayoutGrid, List } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { PlaylistCardViewMode } from "@/features/playlist/components/PlaylistCard";

interface Props {
  onChange: (viewMode: PlaylistCardViewMode) => void;
  viewMode: PlaylistCardViewMode;
}

export function PlaylistViewModeToggle({ onChange, viewMode }: Props) {
  const toggleViewMode = () => {
    onChange(viewMode === "grid" ? "list" : "grid");
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
