"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createPlaybackController,
  PlaybackController,
} from "@/service/player";
import {
  createShuffleOrder,
  DEFAULT_VOLUME,
  getAdjacentSong,
  loadPlaybackState,
  loadVolume,
  savePlaybackState,
  saveVolume,
} from "@/features/player/library";
import { Song } from "@/features/song/entity";
import { SERVICE_NAME } from "@/library";

export const PLAYER_CONTAINER_ID = "player-embed-container";

const SONG_DETAIL_PATHNAME_PATTERN = /^\/playlists\/[^/]+\/[^/]+$/;

const PLAYBACK_TIME_POLLING_INTERVAL_MILLISECONDS = 500;

export const MOBILE_VIEWS = ["list", "player"] as const;
export type MobileView = (typeof MOBILE_VIEWS)[number];

export const REPEAT_MODES = ["off", "all", "one"] as const;
export type RepeatMode = (typeof REPEAT_MODES)[number];

interface PlayerContextValue {
  activeMobileView: MobileView;
  currentSong: Song | null;
  currentTime: number;
  cycleRepeatMode: () => void;
  duration: number;
  isPlaying: boolean;
  isShuffled: boolean;
  loadSong: (
    song: Song,
    playlistId: string,
    playlistTitle: string,
    songs: Song[],
  ) => void;
  play: (
    song: Song,
    playlistId: string | null,
    playlistTitle: string,
    songs: Song[],
  ) => void;
  playlistId: string | null;
  playlistTitle: string;
  playNext: () => void;
  playPrevious: () => void;
  repeatMode: RepeatMode;
  restorePlayback: () => void;
  restoreVolume: () => void;
  seekTo: (seconds: number) => void;
  setActiveMobileView: (view: MobileView) => void;
  setVolume: (volume: number) => void;
  songs: Song[];
  togglePlayback: () => void;
  toggleShuffle: () => void;
  volume: number;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayer = (): PlayerContextValue => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }

  return context;
};

export const usePlayerController = (userEmail: string): PlayerContextValue => {
  const playerRef = useRef<PlaybackController | null>(null);
  const songsRef = useRef<Song[]>([]);
  const repeatModeRef = useRef<RepeatMode>("off");
  const isShuffledRef = useRef(false);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const goToSongOnEndRef = useRef<(song: Song) => void>(() => {});
  const pendingRestoreTimeRef = useRef<number | null>(null);
  const pendingPlayIntentRef = useRef(false);
  const isPlayerReadyRef = useRef(false);
  const currentSongRef = useRef<Song | null>(null);
  const shuffleOrderRef = useRef<Song[]>([]);
  const isPlayingRef = useRef(false);
  const pathname = usePathname();
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeMobileView, setActiveMobileView] = useState<MobileView>("list");
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);

    if (!SONG_DETAIL_PATHNAME_PATTERN.test(pathname)) {
      setActiveMobileView("list");
    }
  }

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!currentSong) {
      return;
    }

    document.title = `♩${currentSong.title}｜${SERVICE_NAME}`;
  }, [currentSong]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isShuffledRef.current = isShuffled;
  }, [isShuffled]);

  const resetShuffleOrder = useCallback(
    (song: Song | null, songsList: Song[]) => {
      shuffleOrderRef.current = song
        ? createShuffleOrder(songsList, song.id)
        : [];
    },
    [],
  );

  const goToSong = useCallback(
    (song: Song) => {
      setCurrentSong(song);

      if (playlistId && pathname.startsWith(`/playlists/${playlistId}`)) {
        window.history.replaceState(
          null,
          "",
          `/playlists/${playlistId}/${song.id}`,
        );
      }
    },
    [pathname, playlistId],
  );

  useEffect(() => {
    goToSongOnEndRef.current = goToSong;
  });

  useEffect(() => {
    return () => {
      isPlayerReadyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const handlePlaybackEnded = useCallback(() => {
    const endedSong = currentSongRef.current;

    if (!endedSong) {
      return;
    }

    if (repeatModeRef.current === "one") {
      playerRef.current?.seekTo(0, true);
      playerRef.current?.play();
      return;
    }

    const queue = songsRef.current;
    const currentIndex = queue.findIndex((song) => song.id === endedSong.id);
    const isLastSong = currentIndex === queue.length - 1;

    if (
      repeatModeRef.current !== "all" &&
      !isShuffledRef.current &&
      isLastSong
    ) {
      setIsPlaying(false);
      return;
    }

    if (isShuffledRef.current) {
      const nextShuffledSong = getAdjacentSong(
        shuffleOrderRef.current,
        endedSong.id,
        1,
      );

      if (nextShuffledSong) {
        goToSongOnEndRef.current(nextShuffledSong);
      } else {
        setIsPlaying(false);
      }

      return;
    }

    const nextSong = getAdjacentSong(queue, endedSong.id, 1);

    if (nextSong) {
      goToSongOnEndRef.current(nextSong);
    } else {
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (!currentSong) {
      return;
    }

    if (playerRef.current) {
      if (!isPlayerReadyRef.current) {
        return;
      }

      const restoreTime = pendingRestoreTimeRef.current;

      setCurrentTime(restoreTime ?? 0);
      setDuration(0);

      if (restoreTime !== null) {
        playerRef.current.cueTrack(currentSong.id, restoreTime);
        pendingRestoreTimeRef.current = null;
      } else if (isPlayingRef.current) {
        playerRef.current.loadTrack(currentSong.id);
      } else {
        playerRef.current.cueTrack(currentSong.id);
      }

      return;
    }

    let isCancelled = false;

    setCurrentTime(0);
    setDuration(0);

    const restoreTime = pendingRestoreTimeRef.current;

    isPlayerReadyRef.current = false;

    createPlaybackController({
      containerId: PLAYER_CONTAINER_ID,
      trackId: currentSong.id,
      autoplay: restoreTime === null,
      onStateChange: (state) => {
        if (state === "cued") {
          setDuration(playerRef.current?.getDuration() ?? 0);
          setIsPlaying(false);
          return;
        }

        if (state === "playing") {
          setIsPlaying(true);
          return;
        }

        if (state === "paused") {
          setIsPlaying(false);
          return;
        }

        handlePlaybackEnded();
      },
    })
      .then((controller) => {
        if (isCancelled) {
          controller.destroy();
          return;
        }

        playerRef.current = controller;
        isPlayerReadyRef.current = true;

        controller.setVolume(volumeRef.current);

        // 起動時の再生エンジン読み込み待ちの間に曲が切り替わっていた場合、生成直後のコントローラーを最新の曲に合わせる
        const latestSong = currentSongRef.current;

        if (latestSong && latestSong.id !== currentSong.id) {
          const latestRestoreTime = pendingRestoreTimeRef.current;

          if (latestRestoreTime !== null) {
            controller.cueTrack(latestSong.id, latestRestoreTime);
            pendingRestoreTimeRef.current = null;
          } else {
            controller.loadTrack(latestSong.id);
          }

          return;
        }

        if (restoreTime !== null) {
          controller.seekTo(restoreTime, true);
          setCurrentTime(restoreTime);
          setDuration(controller.getDuration());
          pendingRestoreTimeRef.current = null;
        }

        if (pendingPlayIntentRef.current) {
          pendingPlayIntentRef.current = false;
          controller.play();
          setIsPlaying(true);
          return;
        }

        if (restoreTime === null) {
          setIsPlaying(true);
          return;
        }

        controller.pause();
        setIsPlaying(false);
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [currentSong, handlePlaybackEnded]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const intervalId = setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      setCurrentTime(player.getCurrentTime());
      setDuration(player.getDuration());
    }, PLAYBACK_TIME_POLLING_INTERVAL_MILLISECONDS);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentSong, isPlaying]);

  const play = useCallback(
    (
      song: Song,
      nextPlaylistId: string | null,
      nextPlaylistTitle: string,
      nextSongs: Song[],
    ) => {
      setPlaylistId(nextPlaylistId);
      setPlaylistTitle(nextPlaylistTitle);
      setSongs(nextSongs);
      setCurrentSong((previous) =>
        previous?.id === song.id ? previous : song,
      );
      resetShuffleOrder(song, nextSongs);
      setActiveMobileView("player");

      if (nextPlaylistId) {
        window.history.replaceState(
          null,
          "",
          `/playlists/${nextPlaylistId}/${song.id}`,
        );
      }
    },
    [resetShuffleOrder],
  );

  const playNext = useCallback(() => {
    const queue = songsRef.current;

    if (!currentSong || !queue.length) {
      return;
    }

    const nextSong = isShuffled
      ? getAdjacentSong(shuffleOrderRef.current, currentSong.id, 1)
      : getAdjacentSong(queue, currentSong.id, 1);

    if (nextSong) {
      goToSong(nextSong);
    }
  }, [currentSong, goToSong, isShuffled]);

  const playPrevious = useCallback(() => {
    const queue = songsRef.current;

    if (!currentSong || !queue.length) {
      return;
    }

    const previousSong = isShuffled
      ? getAdjacentSong(shuffleOrderRef.current, currentSong.id, -1)
      : getAdjacentSong(queue, currentSong.id, -1);

    if (previousSong) {
      goToSong(previousSong);
    }
  }, [currentSong, goToSong, isShuffled]);

  const togglePlayback = useCallback(() => {
    if (!playerRef.current || !isPlayerReadyRef.current) {
      pendingPlayIntentRef.current = true;
      return;
    }

    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, [isPlaying]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((previous) => {
      if (previous === "off") {
        return "all";
      }

      if (previous === "all") {
        return "one";
      }

      return "off";
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((previous) => {
      const next = !previous;

      if (next) {
        resetShuffleOrder(currentSongRef.current, songsRef.current);
      }

      return next;
    });
  }, [resetShuffleOrder]);

  const seekTo = useCallback((seconds: number) => {
    if (!playerRef.current || !isPlayerReadyRef.current) {
      return;
    }

    playerRef.current.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    volumeRef.current = nextVolume;
    setVolumeState(nextVolume);
    saveVolume(nextVolume);
    playerRef.current?.setVolume(nextVolume);
  }, []);

  const loadPaused = useCallback(
    (
      song: Song,
      nextPlaylistId: string,
      nextPlaylistTitle: string,
      nextSongs: Song[],
      time: number,
      openPlayer: boolean,
    ) => {
      pendingRestoreTimeRef.current = time;
      setPlaylistId(nextPlaylistId);
      setPlaylistTitle(nextPlaylistTitle);
      setSongs(nextSongs);
      setCurrentSong(song);
      resetShuffleOrder(song, nextSongs);

      if (openPlayer) {
        setActiveMobileView("player");
      }
    },
    [resetShuffleOrder],
  );

  const restorePlayback = useCallback(() => {
    if (currentSongRef.current || !userEmail) {
      return;
    }

    const stored = loadPlaybackState();

    if (!stored || stored.userEmail !== userEmail) {
      return;
    }

    loadPaused(
      stored.song,
      stored.playlistId,
      stored.playlistTitle,
      stored.songs,
      stored.currentTime,
      false,
    );
  }, [loadPaused, userEmail]);

  const restoreVolume = useCallback(() => {
    const stored = loadVolume();

    if (stored === null) {
      return;
    }

    volumeRef.current = stored;
    setVolumeState(stored);
  }, []);

  const loadSong = useCallback(
    (
      song: Song,
      nextPlaylistId: string,
      nextPlaylistTitle: string,
      nextSongs: Song[],
    ) => {
      if (currentSongRef.current?.id === song.id) {
        setActiveMobileView("player");
        return;
      }

      const stored = loadPlaybackState();
      const time =
        stored && stored.userEmail === userEmail && stored.song.id === song.id
          ? stored.currentTime
          : 0;

      loadPaused(
        song,
        nextPlaylistId,
        nextPlaylistTitle,
        nextSongs,
        time,
        true,
      );
    },
    [loadPaused, userEmail],
  );

  useEffect(() => {
    if (!currentSong || !playlistId || !userEmail) {
      return;
    }

    savePlaybackState({
      currentTime,
      playlistId,
      playlistTitle,
      song: currentSong,
      songs,
      userEmail,
    });
  }, [currentSong, currentTime, playlistId, playlistTitle, songs, userEmail]);

  return {
    activeMobileView,
    currentSong,
    currentTime,
    cycleRepeatMode,
    duration,
    isPlaying,
    isShuffled,
    loadSong,
    play,
    playlistId,
    playlistTitle,
    playNext,
    playPrevious,
    repeatMode,
    restorePlayback,
    restoreVolume,
    seekTo,
    setActiveMobileView,
    setVolume,
    songs,
    togglePlayback,
    toggleShuffle,
    volume,
  };
};
