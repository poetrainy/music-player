"use client";

import { PlayerPlaybackRestore } from "@/features/player/components/PlayerPlaybackRestore";
import { PlayerSongInfo } from "@/features/player/components/PlayerSongInfo";
import { PlayerSongThumbnail } from "@/features/player/components/PlayerSongThumbnail";
import { usePlayer } from "@/features/player/hook";
import { PlayerProvider } from "@/features/player/providers/PlayerProvider";
import { formatDuration } from "@/library";

interface Props {
  userEmail: string;
  remotePlaybackChannelName: string;
  remotePlaybackDeviceId: string | null;
}

// NOTE: 操作できない常時表示の端末で使うため、再生はリモート再生の命令で行い、画面には再生中の曲だけを出す
export function PlayerComponent({
  userEmail,
  remotePlaybackChannelName,
  remotePlaybackDeviceId,
}: Props) {
  return (
    <PlayerProvider
      userEmail={userEmail}
      remotePlaybackChannelName={remotePlaybackChannelName}
      remotePlaybackDeviceId={remotePlaybackDeviceId}
    >
      <PlayerNowPlaying />
      <PlayerPlaybackRestore />
    </PlayerProvider>
  );
}

function PlayerNowPlaying() {
  const { currentSong, currentTime, duration, playlistId, playlistTitle } =
    usePlayer();

  if (!currentSong) {
    return (
      <main className="h-dvh max-h-100">
        <section className="bg-solid flex h-full items-center justify-center rounded-xl p-4">
          <p className="text-muted text-sm">再生中の曲はありません</p>
        </section>
      </main>
    );
  }

  const totalSeconds = duration || currentSong.durationSeconds;

  return (
    <main className="h-dvh max-h-100">
      <section
        aria-label="再生中の曲"
        className="bg-solid flex h-full items-center gap-6 rounded-xl p-4"
      >
        <PlayerSongThumbnail song={currentSong} size="large" />
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 self-stretch">
          <PlayerSongInfo
            song={currentSong}
            playlistTitle={playlistId ? playlistTitle : null}
          />
          <div className="flex flex-col gap-1">
            <progress
              value={currentTime}
              max={totalSeconds || 1}
              aria-label="再生位置"
              className="bg-surface [&::-webkit-progress-bar]:bg-surface [&::-moz-progress-bar]:bg-brand [&::-webkit-progress-value]:bg-brand block h-1 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full"
            />
            <div className="text-muted flex justify-between text-xs tabular-nums">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(totalSeconds)}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
