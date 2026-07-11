"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Song } from "@/entity";
import { getAdjacentSong } from "@/features/player/library";

interface YoutubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
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
  play: (
    song: Song,
    playlistId: string,
    playlistTitle: string,
    songs: Song[],
  ) => void;
  playlistId: string | null;
  playlistTitle: string;
  playNext: () => void;
  playPrevious: () => void;
  repeatMode: RepeatMode;
  seekTo: (seconds: number) => void;
  setActiveMobileView: (view: MobileView) => void;
  songs: Song[];
  togglePlayback: () => void;
  toggleShuffle: () => void;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayer = (): PlayerContextValue => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }

  return context;
};

export const usePlayerController = (): PlayerContextValue => {
  const playerRef = useRef<YoutubePlayer | null>(null);
  const songsRef = useRef<Song[]>([]);
  const repeatModeRef = useRef<RepeatMode>("off");
  const isShuffledRef = useRef(false);
  const goToSongOnEndRef = useRef<(song: Song) => void>(() => {});
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

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isShuffledRef.current = isShuffled;
  }, [isShuffled]);

  const goToSong = useCallback(
    (song: Song) => {
      setCurrentSong(song);

      if (playlistId) {
        window.history.replaceState(
          null,
          "",
          `/playlists/${playlistId}/${song.id}`,
        );
      }
    },
    [playlistId],
  );

  useEffect(() => {
    goToSongOnEndRef.current = goToSong;
  });

  useEffect(() => {
    if (!currentSong) {
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

      playerRef.current = new YT.Player(target, {
        videoId: currentSong.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: () => {
            setIsPlaying(true);
          },
          onStateChange: (event) => {
            if (event.data !== YT.PlayerState.ENDED) {
              setIsPlaying(event.data === YT.PlayerState.PLAYING);
              return;
            }

            if (repeatModeRef.current === "one") {
              playerRef.current?.seekTo(0, true);
              playerRef.current?.playVideo();
              return;
            }

            const queue = songsRef.current;
            const currentIndex = queue.findIndex(
              (song) => song.id === currentSong.id,
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

            const nextSong = getAdjacentSong(
              queue,
              currentSong.id,
              1,
              isShuffledRef.current,
            );

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
      playerRef.current?.destroy();
      playerRef.current = null;
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
      nextPlaylistId: string,
      nextPlaylistTitle: string,
      nextSongs: Song[],
    ) => {
      setPlaylistId(nextPlaylistId);
      setPlaylistTitle(nextPlaylistTitle);
      setSongs(nextSongs);
      setCurrentSong((previous) =>
        previous?.id === song.id ? previous : song,
      );
      setActiveMobileView("player");
      window.history.replaceState(
        null,
        "",
        `/playlists/${nextPlaylistId}/${song.id}`,
      );
    },
    [],
  );

  const playNext = useCallback(() => {
    const queue = songsRef.current;

    if (!currentSong || queue.length === 0) {
      return;
    }

    const nextSong = getAdjacentSong(queue, currentSong.id, 1, isShuffled);

    if (nextSong) {
      goToSong(nextSong);
    }
  }, [currentSong, goToSong, isShuffled]);

  const playPrevious = useCallback(() => {
    const queue = songsRef.current;

    if (!currentSong || queue.length === 0) {
      return;
    }

    const previousSong = getAdjacentSong(queue, currentSong.id, -1, isShuffled);

    if (previousSong) {
      goToSong(previousSong);
    }
  }, [currentSong, goToSong, isShuffled]);

  const togglePlayback = useCallback(() => {
    if (!playerRef.current) {
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
    setIsShuffled((previous) => !previous);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (!playerRef.current) {
      return;
    }

    playerRef.current.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  return {
    activeMobileView,
    currentSong,
    currentTime,
    cycleRepeatMode,
    duration,
    isPlaying,
    isShuffled,
    play,
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
  };
};
