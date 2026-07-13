"use client";

import Link from "next/link";
import {
  ArrowLeft,
  PanelRightClose,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { YoutubeThumbnail } from "@/components/YoutubeThumbnail";
import { usePlayer } from "@/features/player/hook";
import { formatPlaybackTime } from "@/features/player/library";

export function SongDetailComponent() {
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

  if (!currentSong || !playlistId) {
    return null;
  }

  return (
    <div className="text-foreground md:from-surface-elevated md:to-surface flex h-full min-h-0 flex-col md:bg-linear-to-b md:p-6">
      <div className="mb-2 flex items-center justify-start md:hidden">
        <Link
          href={`/playlists/${playlistId}`}
          aria-label="リストに戻る"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-white/10 active:bg-white/15"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>
      <div className="mb-2 hidden items-center justify-end md:flex">
        <IconButton
          type="button"
          onClick={() => setActiveMobileView("list")}
          aria-label="プレイヤーを閉じる"
          className="text-zinc-400"
        >
          <PanelRightClose className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <div className="relative aspect-square w-full max-w-80 overflow-hidden rounded-xl shadow-2xl shadow-black/60">
          <YoutubeThumbnail
            key={currentSong.id}
            videoId={currentSong.id}
            alt={currentSong.title}
            size="large"
            preload
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <Link
            href={`/playlists/${playlistId}`}
            className="text-xs font-semibold text-zinc-400 active:text-zinc-300"
          >
            {playlistTitle}
          </Link>
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
            <span>{formatPlaybackTime(currentTime)}</span>
            <span>{formatPlaybackTime(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <IconButton
            type="button"
            onClick={toggleShuffle}
            aria-label={isShuffled ? "シャッフル: オン" : "シャッフル: オフ"}
            className={isShuffled ? "text-brand" : "text-zinc-400"}
          >
            <Shuffle className="h-5 w-5" />
          </IconButton>
          {hasAdjacentSong && (
            <IconButton
              type="button"
              onClick={playPrevious}
              aria-label="前の曲"
              className="text-foreground"
            >
              <SkipBack className="h-6 w-6" fill="currentColor" />
            </IconButton>
          )}
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "一時停止" : "再生"}
            className="bg-brand active:bg-brand/80 flex h-16 w-16 items-center justify-center rounded-full text-black shadow-lg shadow-black/40"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" fill="currentColor" />
            ) : (
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            )}
          </button>
          {hasAdjacentSong && (
            <IconButton
              type="button"
              onClick={playNext}
              aria-label="次の曲"
              className="text-foreground"
            >
              <SkipForward className="h-6 w-6" fill="currentColor" />
            </IconButton>
          )}
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
            className={repeatMode === "off" ? "text-zinc-400" : "text-brand"}
          >
            {repeatMode === "one" ? (
              <Repeat1 className="h-5 w-5" />
            ) : (
              <Repeat className="h-5 w-5" />
            )}
          </IconButton>
        </div>
      </div>
    </div>
  );
}
