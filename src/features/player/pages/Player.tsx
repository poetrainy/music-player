"use client";

import { ReactNode } from "react";
import { Pause } from "lucide-react";
import { EmbedPlaybackResumer } from "@/features/embed/components/EmbedPlaybackResumer";
import { EmbedReplacedNotifier } from "@/features/embed/components/EmbedReplacedNotifier";
import { PlayerPlaybackRestore } from "@/features/player/components/PlayerPlaybackRestore";
import { PlayerSongInfo } from "@/features/player/components/PlayerSongInfo";
import { PlayerSongThumbnail } from "@/features/player/components/PlayerSongThumbnail";
import { usePlayer } from "@/features/player/hook";
import { PlayerProvider } from "@/features/player/providers/PlayerProvider";
import { useRemotePlaybackTarget } from "@/features/remote-playback/hook";
import { buildRemotePlaybackTargetHref } from "@/features/remote-playback/libraries/device";
import { formatDuration } from "@/library";

interface Props {
  userEmail: string;
  remotePlaybackChannelName: string;
  remotePlaybackDeviceId: string;
}

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
      // NOTE: サイト本体で聴いていた曲を引き継いだり、ここでの再生をサイト本体に残したりしないよう、再生状態を保存・復元しない
      isPlaybackStatePersistent={false}
    >
      <PlayerNowPlaying remotePlaybackDeviceId={remotePlaybackDeviceId} />
      <PlayerPlaybackRestore />
      <EmbedReplacedNotifier />
      <EmbedPlaybackResumer />
    </PlayerProvider>
  );
}

interface PlayerNowPlayingProps {
  remotePlaybackDeviceId: string;
}

function PlayerNowPlaying({ remotePlaybackDeviceId }: PlayerNowPlayingProps) {
  const {
    currentSong,
    currentTime,
    duration,
    isPlaying,
    playlistId,
    playlistTitle,
  } = usePlayer();
  const { isReplacedDevice } = useRemotePlaybackTarget();

  if (isReplacedDevice) {
    return (
      <main className="h-dvh max-h-100">
        <section className="bg-surface flex h-full items-center justify-center rounded-xl p-4">
          <p className="text-muted text-center text-sm">
            同じ再生先が別の場所で開かれたため、ここでは再生しません
          </p>
        </section>
      </main>
    );
  }

  if (!currentSong) {
    return (
      <main className="h-dvh max-h-100">
        <PlayerTopLink deviceId={remotePlaybackDeviceId}>
          <section className="bg-surface flex h-full items-center justify-center p-4">
            <p className="text-muted text-sm">再生中の曲はありません</p>
          </section>
        </PlayerTopLink>
      </main>
    );
  }

  const totalSeconds = duration || currentSong.durationSeconds;

  return (
    <main className="h-dvh max-h-100">
      <PlayerTopLink deviceId={remotePlaybackDeviceId}>
        <section
          aria-label="再生中の曲"
          className="bg-surface flex h-full items-center gap-6 rounded-xl p-4"
        >
          <PlayerSongThumbnail song={currentSong} size="large" />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 self-stretch">
            <PlayerSongInfo
              song={currentSong}
              playlistTitle={playlistId ? playlistTitle : null}
              isFullTextVisible
            />
            <div className="flex flex-col gap-1">
              {!isPlaying && (
                <p className="text-muted flex items-center gap-1 text-xs">
                  <Pause aria-hidden className="size-3" />
                  一時停止中
                </p>
              )}
              <progress
                value={currentTime}
                max={totalSeconds || 1}
                aria-label="再生位置"
                className="bg-solid [&::-webkit-progress-bar]:bg-solid [&::-moz-progress-bar]:bg-brand [&::-webkit-progress-value]:bg-brand block h-1 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full"
              />
              <div className="text-muted flex justify-between text-xs tabular-nums">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(totalSeconds)}</span>
              </div>
            </div>
          </div>
        </section>
      </PlayerTopLink>
    </main>
  );
}

interface PlayerTopLinkProps {
  children: ReactNode;
  deviceId: string;
}

// NOTE: 埋め込み元の画面を残したまま本体を開けるよう、iframe 内で遷移させずに新しいタブで開く。next/link は iframe 内で遷移するため使わない
function PlayerTopLink({ children, deviceId }: PlayerTopLinkProps) {
  return (
    <a
      href={buildRemotePlaybackTargetHref("/", deviceId)}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-xl focus-visible:-outline-offset-2"
    >
      {children}
      <span className="sr-only">ミュージックプレーヤーを新しいタブで開く</span>
    </a>
  );
}
