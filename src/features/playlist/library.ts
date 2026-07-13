import { PlaylistCardViewMode } from "@/features/playlist/components/PlaylistCard";

const VIEW_MODE_STORAGE_KEY = "playlist-view-mode";

export const savePlaylistViewMode = (viewMode: PlaylistCardViewMode): void => {
  localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
};

export const loadPlaylistViewMode = (): PlaylistCardViewMode | null => {
  const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);

  if (stored !== "grid" && stored !== "list") {
    return null;
  }

  return stored;
};
