"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
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
const DRAWER_DISMISS_TRANSITION_MILLISECONDS = 300;

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

export const DRAWER_STATES = ["closed", "minimized", "open"] as const;
export type DrawerState = (typeof DRAWER_STATES)[number];

interface PlayerContextValue {
  closeDrawer: () => void;
  currentSong: Song | null;
  currentTime: number;
  drawerState: DrawerState;
  duration: number;
  isDrawerPanelVisible: boolean;
  isLooping: boolean;
  isPlaying: boolean;
  isShuffled: boolean;
  maximizeDrawer: () => void;
  minimizeDrawer: () => void;
  play: (song: Song, playlistId: string, songs: Song[]) => void;
  playlistId: string | null;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (seconds: number) => void;
  setDrawerPanelVisible: (isVisible: boolean) => void;
  songs: Song[];
  toggleLoop: () => void;
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
  const router = useRouter();
  const playerRef = useRef<YoutubePlayer | null>(null);
  const songsRef = useRef<Song[]>([]);
  const isLoopingRef = useRef(false);
  const isShuffledRef = useRef(false);
  const goToSongOnEndRef = useRef<(song: Song) => void>(() => {});
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [drawerState, setDrawerState] = useState<DrawerState>("closed");
  const [isDrawerPanelVisible, setDrawerPanelVisible] = useState(false);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    isShuffledRef.current = isShuffled;
  }, [isShuffled]);

  const goToSong = (song: Song) => {
    if (isDrawerPanelVisible && playlistId) {
      router.replace(`/playlists/${playlistId}/${song.id}`);
      return;
    }

    setCurrentSong(song);
  };

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
            setIsPlaying(event.data === YT.PlayerState.PLAYING);

            if (event.data !== YT.PlayerState.ENDED) {
              return;
            }

            const queue = songsRef.current;
            const currentIndex = queue.findIndex(
              (song) => song.id === currentSong.id,
            );
            const isLastSong = currentIndex === queue.length - 1;

            if (!isShuffledRef.current && isLastSong && !isLoopingRef.current) {
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

  const play = (song: Song, nextPlaylistId: string, nextSongs: Song[]) => {
    setDrawerState("open");
    setPlaylistId(nextPlaylistId);
    setSongs(nextSongs);
    setCurrentSong((previous) => (previous?.id === song.id ? previous : song));
  };

  const playNext = () => {
    const queue = songsRef.current;

    if (!currentSong || queue.length === 0) {
      return;
    }

    const nextSong = getAdjacentSong(queue, currentSong.id, 1, isShuffled);

    if (nextSong) {
      goToSong(nextSong);
    }
  };

  const playPrevious = () => {
    const queue = songsRef.current;

    if (!currentSong || queue.length === 0) {
      return;
    }

    const previousSong = getAdjacentSong(queue, currentSong.id, -1, isShuffled);

    if (previousSong) {
      goToSong(previousSong);
    }
  };

  const togglePlayback = () => {
    if (!playerRef.current) {
      return;
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleLoop = () => {
    setIsLooping((previous) => !previous);
  };

  const toggleShuffle = () => {
    setIsShuffled((previous) => !previous);
  };

  const seekTo = (seconds: number) => {
    if (!playerRef.current) {
      return;
    }

    playerRef.current.seekTo(seconds, true);
    setCurrentTime(seconds);
  };

  const minimizeDrawer = () => {
    setDrawerPanelVisible(false);
    setTimeout(() => {
      setDrawerState("minimized");

      if (playlistId) {
        router.replace(`/playlists/${playlistId}`);
      }
    }, DRAWER_DISMISS_TRANSITION_MILLISECONDS);
  };

  const maximizeDrawer = () => {
    if (!currentSong || !playlistId) {
      return;
    }

    router.push(`/playlists/${playlistId}/${currentSong.id}`);
    setDrawerState("open");
  };

  const closeDrawer = () => {
    const wasOpen = drawerState === "open";

    setDrawerPanelVisible(false);
    setTimeout(() => {
      setDrawerState("closed");

      if (wasOpen && playlistId) {
        router.replace(`/playlists/${playlistId}`);
      }
    }, DRAWER_DISMISS_TRANSITION_MILLISECONDS);
  };

  return {
    closeDrawer,
    currentSong,
    currentTime,
    drawerState,
    duration,
    isDrawerPanelVisible,
    isLooping,
    isPlaying,
    isShuffled,
    maximizeDrawer,
    minimizeDrawer,
    play,
    playlistId,
    playNext,
    playPrevious,
    seekTo,
    setDrawerPanelVisible,
    songs,
    toggleLoop,
    togglePlayback,
    toggleShuffle,
  };
};
