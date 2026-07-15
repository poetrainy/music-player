"use client";

import Link from "next/link";
import { cva } from "class-variance-authority";
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { usePlayer } from "@/features/player/hook";
import { SongThumbnail } from "@/features/song/components/SongThumbnail";
import { formatDuration } from "@/library";

const cvaPlayerSongDetailToggleIcon = cva("", {
  variants: {
    isActive: {
      true: "text-brand",
      false: "text-zinc-400",
    },
  },
});

export function PlayerSongDetail() {
  const {
    currentSong,
    currentTime,
    cycleRepeatMode,
    duration,
    isPlaying,
    isShuffled,
    playlistId,
    playlistTitle,
    playNext,
    playPrevious,
    repeatMode,
    seekTo,
    setActiveMobileView,
    songs,
    togglePlayback,
    toggleShuffle,
  } = usePlayer();

  const hasAdjacentSong = songs.length > 1;

  if (!currentSong) {
    return null;
  }

  return (
    <div className="text-foreground md:from-surface-elevated md:to-surface flex h-full min-h-0 flex-col md:bg-linear-to-b md:p-6">
      <div className="mb-2 flex items-center justify-end md:hidden">
        <IconButton
          type="button"
          onClick={() => setActiveMobileView("list")}
          aria-label="閉じる"
          className="text-zinc-400"
        >
          <X className="size-5" />
        </IconButton>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 pb-11 md:p-0">
        <div className="relative aspect-square w-full max-w-80 overflow-hidden rounded-xl shadow-2xl shadow-black/60 md:max-w-full">
          <SongThumbnail
            key={currentSong.id}
            thumbnailUrl={currentSong.thumbnailUrlLarge}
            alt={currentSong.title}
            size="large"
            preload
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          {!!playlistId && (
            <Link
              href={`/playlists/${playlistId}`}
              onClick={() => setActiveMobileView("list")}
              className="text-xs font-semibold text-zinc-400 active:text-zinc-300"
            >
              {playlistTitle}
            </Link>
          )}
          <p className="text-xl font-bold">{currentSong.title}</p>
          <p className="text-sm text-zinc-400">{currentSong.artist}</p>
        </div>
        <div className="flex w-full flex-col gap-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(event) => seekTo(Number(event.target.value))}
            aria-label="再生位置"
            className="accent-brand w-full"
          />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          {!!playlistId && (
            <IconButton
              type="button"
              onClick={toggleShuffle}
              aria-label={isShuffled ? "シャッフル: オン" : "シャッフル: オフ"}
              className={cvaPlayerSongDetailToggleIcon({
                isActive: isShuffled,
              })}
            >
              <Shuffle className="size-5" />
            </IconButton>
          )}
          {hasAdjacentSong && (
            <IconButton
              type="button"
              onClick={playPrevious}
              aria-label="前の曲"
              className="text-foreground"
            >
              <SkipBack className="size-6" fill="currentColor" />
            </IconButton>
          )}
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "一時停止" : "再生"}
            className="bg-brand active:bg-brand/80 flex size-16 items-center justify-center rounded-full text-black shadow-lg shadow-black/40"
          >
            {isPlaying ? (
              <Pause className="size-7" fill="currentColor" />
            ) : (
              <Play className="ml-1 size-7" fill="currentColor" />
            )}
          </button>
          {hasAdjacentSong && (
            <IconButton
              type="button"
              onClick={playNext}
              aria-label="次の曲"
              className="text-foreground"
            >
              <SkipForward className="size-6" fill="currentColor" />
            </IconButton>
          )}
          {!!playlistId && (
            <IconButton
              type="button"
              onClick={cycleRepeatMode}
              aria-label={
                repeatMode === "off"
                  ? "リピート: オフ"
                  : repeatMode === "all"
                    ? "リピート: 全曲"
                    : "リピート: 1曲"
              }
              className={cvaPlayerSongDetailToggleIcon({
                isActive: repeatMode !== "off",
              })}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="size-5" />
              ) : (
                <Repeat className="size-5" />
              )}
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
