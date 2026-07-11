"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { YoutubeThumbnail } from "@/components/YoutubeThumbnail/YoutubeThumbnail";
import { usePlayer } from "@/features/player/hook";

export function PlayerMiniPlayer() {
  const pathname = usePathname();
  const {
    currentSong,
    isDrawerPanelVisible,
    isPlaying,
    playlistId,
    playNext,
    playPrevious,
    songs,
    togglePlayback,
  } = usePlayer();
  const hasAdjacentSong = songs.length > 1;

  if (!currentSong || !playlistId) {
    return null;
  }

  const isFullSongPage =
    pathname === `/playlists/${playlistId}/${currentSong.id}` &&
    !isDrawerPanelVisible;

  if (isFullSongPage) {
    return null;
  }

  return (
    <div className="bg-surface-elevated border-foreground/10 fixed inset-x-0 bottom-0 z-50 border-t">
      <div className="mx-auto flex max-w-300 items-center gap-3 px-4 py-2">
        <Link
          href={`/playlists/${playlistId}/${currentSong.id}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
            <YoutubeThumbnail
              videoId={currentSong.id}
              alt={currentSong.title}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="text-foreground truncate text-sm font-medium">
              {currentSong.title}
            </p>
            <p className="truncate text-xs text-zinc-400">
              {currentSong.artist}
            </p>
          </div>
        </Link>
        {hasAdjacentSong ? (
          <button
            type="button"
            onClick={playPrevious}
            aria-label="前の曲"
            className="text-foreground"
          >
            <SkipBack className="h-5 w-5" fill="currentColor" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? "一時停止" : "再生"}
          className="bg-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-black"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
          )}
        </button>
        {hasAdjacentSong ? (
          <button
            type="button"
            onClick={playNext}
            aria-label="次の曲"
            className="text-foreground"
          >
            <SkipForward className="h-5 w-5" fill="currentColor" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
