"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { PlayerVolumeControl } from "@/features/player/components/PlayerVolumeControl";
import { usePlayer } from "@/features/player/hook";
import { SongThumbnail } from "@/features/song/components/SongThumbnail";
import { cn } from "@/library";

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
    seekTo,
    setActiveMobileView,
    songs,
    togglePlayback,
  } = usePlayer();
  const pathname = usePathname();

  const hasAdjacentSong = songs.length > 1;

  if (!currentSong) {
    return null;
  }

  const hasSidebar =
    !!playlistId && pathname.startsWith(`/playlists/${playlistId}`);
  const isSidebarShowing = hasSidebar && activeMobileView === "player";
  const songInfo = (
    <div className="flex min-w-0 flex-col">
      <p className="text-foreground truncate text-sm font-medium">
        {currentSong.title}
      </p>
      <p className="truncate text-xs text-zinc-400">
        {playlistId
          ? `${currentSong.artist}・${playlistTitle}`
          : currentSong.artist}
      </p>
    </div>
  );

  return (
    <div className="bg-surface-elevated fixed inset-x-0 bottom-0 z-50">
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={(event) => seekTo(Number(event.target.value))}
        aria-label="再生位置"
        className="accent-brand m-0 block h-0.5 w-full cursor-pointer"
      />
      <div className="mx-auto flex max-w-300 items-center gap-4 px-4 py-2">
        <div className="relative size-10 shrink-0 overflow-hidden rounded">
          <SongThumbnail
            key={currentSong.id}
            songId={currentSong.id}
            alt={currentSong.title}
            size="small"
          />
        </div>
        <PlayerMiniPlayerSongInfoLink
          playlistId={playlistId}
          songId={currentSong.id}
          onClick={() => setActiveMobileView("player")}
        >
          {songInfo}
        </PlayerMiniPlayerSongInfoLink>
        <button
          type="button"
          onClick={() => setActiveMobileView("player")}
          className="flex max-w-40 min-w-0 items-center gap-3 text-left active:opacity-70 md:hidden"
        >
          {songInfo}
        </button>
        <PlayerVolumeControl />
        {!isSidebarShowing && (
          <div className="ml-auto flex items-center gap-3">
            {hasAdjacentSong && (
              <IconButton
                type="button"
                onClick={playPrevious}
                aria-label="前の曲"
                className="text-foreground"
              >
                <SkipBack className="size-5" fill="currentColor" />
              </IconButton>
            )}
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "一時停止" : "再生"}
              className="bg-brand active:bg-brand/80 flex size-9 shrink-0 items-center justify-center rounded-full text-black"
            >
              {isPlaying ? (
                <Pause className="size-4" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 size-4" fill="currentColor" />
              )}
            </button>
            {hasAdjacentSong && (
              <IconButton
                type="button"
                onClick={playNext}
                aria-label="次の曲"
                className="text-foreground"
              >
                <SkipForward className="size-5" fill="currentColor" />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const PLAYER_MINI_PLAYER_SONG_INFO_LINK_CLASS_NAME =
  "hidden max-w-169 min-w-0 items-center gap-3 text-left md:flex";

interface PlayerMiniPlayerSongInfoLinkProps {
  playlistId: string | null;
  songId: string;
  onClick: () => void;
  children: ReactNode;
}

function PlayerMiniPlayerSongInfoLink({
  playlistId,
  songId,
  onClick,
  children,
}: PlayerMiniPlayerSongInfoLinkProps) {
  if (!playlistId) {
    return (
      <div className={PLAYER_MINI_PLAYER_SONG_INFO_LINK_CLASS_NAME}>
        {children}
      </div>
    );
  }

  return (
    <Link
      href={`/playlists/${playlistId}/${songId}`}
      onClick={onClick}
      scroll={false}
      className={cn(
        PLAYER_MINI_PLAYER_SONG_INFO_LINK_CLASS_NAME,
        "active:opacity-70",
      )}
    >
      {children}
    </Link>
  );
}
