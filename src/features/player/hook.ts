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

interface YoutubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YoutubePlayerStateChangeEvent {
  data: number;
}

interface YoutubePlayerConstructorOptions {
  videoId: string;
  playerVars: {
    autoplay: 0 | 1;
    controls: 0 | 1;
  };
  events: {
    onReady: () => void;
    onStateChange: (event: YoutubePlayerStateChangeEvent) => void;
  };
}

interface YoutubeIframeApi {
  Player: new (
    element: HTMLElement,
    options: YoutubePlayerConstructorOptions,
  ) => YoutubePlayer;
  PlayerState: {
    CUED: number;
    ENDED: number;
    PLAYING: number;
  };
}

declare global {
  interface Window {
    YT?: YoutubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const PLAYER_CONTAINER_ID = "player-youtube-container";

const SONG_DETAIL_PATHNAME_PATTERN = /^\/playlists\/[^/]+\/[^/]+$/;

const YOUTUBE_IFRAME_API_SRC = "https://www.youtube.com/iframe_api";
const PLAYBACK_TIME_POLLING_INTERVAL_MILLISECONDS = 500;

let youtubeIframeApiPromise: Promise<YoutubeIframeApi> | null = null;

const loadYoutubeIframeApi = (): Promise<YoutubeIframeApi> => {
  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise;
  }

  youtubeIframeApiPromise = new Promise((resolve) => {
    if (window.YT) {
      resolve(window.YT);
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();

      if (window.YT) {
        resolve(window.YT);
      }
    };

    const script = document.createElement("script");
    script.src = YOUTUBE_IFRAME_API_SRC;
    document.body.appendChild(script);
  });

  return youtubeIframeApiPromise;
};

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
  const playerRef = useRef<YoutubePlayer | null>(null);
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
        playerRef.current.cueVideoById(currentSong.id, restoreTime);
        pendingRestoreTimeRef.current = null;
      } else {
        playerRef.current.loadVideoById(currentSong.id);
      }

      return;
    }

    let isCancelled = false;

    loadYoutubeIframeApi().then((YT) => {
      const container = document.getElementById(PLAYER_CONTAINER_ID);

      if (isCancelled || !container) {
        return;
      }

      setCurrentTime(0);
      setDuration(0);

      const target = document.createElement("div");
      container.appendChild(target);

      const restoreTime = pendingRestoreTimeRef.current;

      isPlayerReadyRef.current = false;

      playerRef.current = new YT.Player(target, {
        videoId: currentSong.id,
        playerVars: {
          autoplay: restoreTime === null ? 1 : 0,
          controls: 0,
        },
        events: {
          onReady: () => {
            isPlayerReadyRef.current = true;

            const player = playerRef.current;

            player?.setVolume(volumeRef.current);

            // 起動時の YouTube API 読み込み待ちの間に曲が切り替わっていた場合、生成直後のプレイヤーを最新の曲に合わせる
            const latestSong = currentSongRef.current;

            if (latestSong && latestSong.id !== currentSong.id) {
              const latestRestoreTime = pendingRestoreTimeRef.current;

              if (latestRestoreTime !== null) {
                player?.cueVideoById(latestSong.id, latestRestoreTime);
                pendingRestoreTimeRef.current = null;
              } else {
                player?.loadVideoById(latestSong.id);
              }

              return;
            }

            if (restoreTime !== null) {
              player?.seekTo(restoreTime, true);
              setCurrentTime(restoreTime);
              setDuration(player?.getDuration() ?? 0);
              pendingRestoreTimeRef.current = null;
            }

            if (pendingPlayIntentRef.current) {
              pendingPlayIntentRef.current = false;
              player?.playVideo();
              setIsPlaying(true);
              return;
            }

            if (restoreTime === null) {
              setIsPlaying(true);
              return;
            }

            player?.pauseVideo();
            setIsPlaying(false);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.CUED) {
              setDuration(playerRef.current?.getDuration() ?? 0);
              setIsPlaying(false);
              return;
            }

            if (event.data !== YT.PlayerState.ENDED) {
              setIsPlaying(event.data === YT.PlayerState.PLAYING);
              return;
            }

            const endedSong = currentSongRef.current;

            if (!endedSong) {
              return;
            }

            if (repeatModeRef.current === "one") {
              playerRef.current?.seekTo(0, true);
              playerRef.current?.playVideo();
              return;
            }

            const queue = songsRef.current;
            const currentIndex = queue.findIndex(
              (song) => song.id === endedSong.id,
            );
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
          },
        },
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [currentSong]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const intervalId = setInterval(() => {
      const player = playerRef.current;

      if (!player || typeof player.getCurrentTime !== "function") {
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
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
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
