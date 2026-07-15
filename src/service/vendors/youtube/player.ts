import type {
  CreatePlaybackControllerOptions,
  PlaybackController,
  PlaybackState,
} from "@/service/player";

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
    PAUSED: number;
    PLAYING: number;
  };
}

declare global {
  interface Window {
    YT?: YoutubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

let iframeApiPromise: Promise<YoutubeIframeApi> | null = null;

const loadIframeApi = (): Promise<YoutubeIframeApi> => {
  if (iframeApiPromise) {
    return iframeApiPromise;
  }

  iframeApiPromise = new Promise((resolve) => {
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
    script.src = IFRAME_API_SRC;
    document.body.appendChild(script);
  });

  return iframeApiPromise;
};

const mapPlayerState = (
  YT: YoutubeIframeApi,
  data: number,
): PlaybackState | null => {
  if (data === YT.PlayerState.CUED) {
    return "cued";
  }

  if (data === YT.PlayerState.PLAYING) {
    return "playing";
  }

  if (data === YT.PlayerState.PAUSED) {
    return "paused";
  }

  if (data === YT.PlayerState.ENDED) {
    return "ended";
  }

  // NOTE: 起動中(UNSTARTED)・バッファリング中は再生/一時停止の見た目上のちらつきを避けるため通知しない
  return null;
};

export const createPlaybackController = (
  options: CreatePlaybackControllerOptions,
): Promise<PlaybackController> =>
  loadIframeApi().then(
    (YT) =>
      new Promise<PlaybackController>((resolve, reject) => {
        const container = document.getElementById(options.containerId);

        if (!container) {
          reject(new Error("Player container not found"));
          return;
        }

        const target = document.createElement("div");
        container.appendChild(target);

        const player = new YT.Player(target, {
          videoId: options.trackId,
          playerVars: {
            autoplay: options.autoplay ? 1 : 0,
            controls: 0,
          },
          events: {
            onReady: () => {
              resolve({
                play: () => player.playVideo(),
                pause: () => player.pauseVideo(),
                loadTrack: (trackId) => player.loadVideoById(trackId),
                cueTrack: (trackId, startSeconds) =>
                  player.cueVideoById(trackId, startSeconds),
                seekTo: (seconds, allowSeekAhead) =>
                  player.seekTo(seconds, allowSeekAhead),
                setVolume: (volume) => player.setVolume(volume),
                getCurrentTime: () => player.getCurrentTime(),
                getDuration: () => player.getDuration(),
                destroy: () => player.destroy(),
              });
            },
            onStateChange: (event) => {
              const state = mapPlayerState(YT, event.data);

              if (state) {
                options.onStateChange(state);
              }
            },
          },
        });
      }),
  );
