"use client";

import Link from "next/link";
import { ReactNode, useEffect } from "react";
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { YoutubeThumbnail } from "@/components/YoutubeThumbnail/YoutubeThumbnail";
import { Song } from "@/entity";
import { usePlayer } from "@/features/player/hook";
import { formatPlaybackTime } from "@/features/player/library";

interface Props {
  headerEndActions: ReactNode;
  playlistId: string;
  playlistTitle: string;
  song: Song;
  songs: Song[];
}

export function SongDetailComponent({
  headerEndActions,
  playlistId,
  playlistTitle,
  song,
  songs,
}: Props) {
  const {
    currentSong,
    currentTime,
    cycleRepeatMode,
    duration,
    isPlaying,
    isShuffled,
    play,
    playNext,
    playPrevious,
    repeatMode,
    seekTo,
    togglePlayback,
    toggleShuffle,
  } = usePlayer();
  const displaySong = currentSong ?? song;
  const isCurrentSongPlaying = isPlaying && !!currentSong;
  const hasAdjacentSong = songs.length > 1;

  useEffect(() => {
    play(song, playlistId, songs);
  }, [play, playlistId, song, songs]);

  return (
    <div className="from-surface-elevated to-surface text-foreground flex h-full min-h-0 flex-col bg-linear-to-b p-6">
      <div className="flex items-center justify-end">{headerEndActions}</div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl shadow-2xl shadow-black/60">
          <YoutubeThumbnail
            videoId={displaySong.id}
            alt={displaySong.title}
            fill
            sizes="384px"
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <Link
            href={`/playlists/${playlistId}`}
            className="text-xs font-semibold text-zinc-400"
          >
            {playlistTitle}
          </Link>
          <p className="text-xl font-bold">{displaySong.title}</p>
          <p className="text-sm text-zinc-400">{displaySong.artist}</p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-1">
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
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label={isShuffled ? "シャッフル: オン" : "シャッフル: オフ"}
            className={isShuffled ? "text-brand" : "text-zinc-400"}
          >
            <Shuffle className="h-5 w-5" />
          </button>
          {hasAdjacentSong ? (
            <button
              type="button"
              onClick={playPrevious}
              aria-label="前の曲"
              className="text-foreground"
            >
              <SkipBack className="h-6 w-6" fill="currentColor" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isCurrentSongPlaying ? "一時停止" : "再生"}
            className="bg-brand flex h-16 w-16 items-center justify-center rounded-full text-black shadow-lg shadow-black/40"
          >
            {isCurrentSongPlaying ? (
              <Pause className="h-7 w-7" fill="currentColor" />
            ) : (
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            )}
          </button>
          {hasAdjacentSong ? (
            <button
              type="button"
              onClick={playNext}
              aria-label="次の曲"
              className="text-foreground"
            >
              <SkipForward className="h-6 w-6" fill="currentColor" />
            </button>
          ) : null}
          <button
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
          </button>
        </div>
      </div>
    </div>
  );
}
