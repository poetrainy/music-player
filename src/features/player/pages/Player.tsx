"use client";

import { PlayerSongInfo } from "@/features/player/components/PlayerSongInfo";
import { PlayerSongThumbnail } from "@/features/player/components/PlayerSongThumbnail";
import { useStoredPlaybackState } from "@/features/player/hook";
import { formatDuration } from "@/library";

interface Props {
  userEmail: string;
}

export function PlayerComponent({ userEmail }: Props) {
  const playbackState = useStoredPlaybackState();

  if (!playbackState || playbackState.userEmail !== userEmail) {
    return (
      <main className="h-dvh max-h-100">
        <section className="bg-solid flex h-full items-center justify-center rounded-xl p-4">
          <p className="text-muted text-sm">再生中の曲はありません</p>
        </section>
      </main>
    );
  }

  const { currentTime, playlistTitle, song } = playbackState;

  return (
    <main className="h-dvh max-h-100">
      <section
        aria-label="再生中の曲"
        className="bg-solid flex h-full items-center gap-6 rounded-xl p-4"
      >
        <PlayerSongThumbnail song={song} size="large" />
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 self-stretch">
          <PlayerSongInfo song={song} playlistTitle={playlistTitle} />
          <div className="flex flex-col gap-1">
            <progress
              value={currentTime}
              max={song.durationSeconds || 1}
              aria-label="再生位置"
              className="bg-surface [&::-webkit-progress-bar]:bg-surface [&::-moz-progress-bar]:bg-brand [&::-webkit-progress-value]:bg-brand block h-1 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full"
            />
            <div className="text-muted flex justify-between text-xs tabular-nums">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(song.durationSeconds)}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
