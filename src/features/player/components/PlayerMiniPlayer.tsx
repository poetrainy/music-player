"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { YoutubeThumbnail } from "@/components/YoutubeThumbnail";
import { usePlayer } from "@/features/player/hook";

export function PlayerMiniPlayer() {
  const {
    activeMobileView,
    currentSong,
    currentTime,
    duration,
    isPlaying,
    playlistId,
    playlistTitle,
    playNext,
    playPrevious,
    setActiveMobileView,
    songs,
    togglePlayback,
  } = usePlayer();
  const pathname = usePathname();
  const hasAdjacentSong = songs.length > 1;

  if (!currentSong || !playlistId) {
    return null;
  }

  const isOnExactSongPage =
    pathname === `/playlists/${playlistId}/${currentSong.id}`;
  const isPanelShowing = activeMobileView === "player" && isOnExactSongPage;
  const progressRatio = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div className="bg-surface-elevated fixed inset-x-0 bottom-0 z-50">
      <div className="bg-foreground/10 h-0.5 w-full">
        <div
          className="bg-brand h-full transition-[width] duration-500"
          style={{ width: `${progressRatio * 100}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-300 items-center gap-3 px-4 py-2">
        <Link
          href={`/playlists/${playlistId}/${currentSong.id}`}
          onClick={() => setActiveMobileView("player")}
          className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70"
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
            <YoutubeThumbnail
              key={currentSong.id}
              videoId={currentSong.id}
              alt={currentSong.title}
              size="small"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="text-foreground truncate text-sm font-medium">
              {currentSong.title}
            </p>
            <p className="truncate text-xs text-zinc-400">
              {currentSong.artist}・{playlistTitle}
            </p>
          </div>
        </Link>
        {isPanelShowing ? null : (
          <>
            {hasAdjacentSong && (
              <IconButton
                type="button"
                onClick={playPrevious}
                aria-label="前の曲"
                className="text-foreground"
              >
                <SkipBack className="h-5 w-5" fill="currentColor" />
              </IconButton>
            )}
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "一時停止" : "再生"}
              className="bg-brand active:bg-brand/80 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-black"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
              )}
            </button>
            {hasAdjacentSong && (
              <IconButton
                type="button"
                onClick={playNext}
                aria-label="次の曲"
                className="text-foreground"
              >
                <SkipForward className="h-5 w-5" fill="currentColor" />
              </IconButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}
