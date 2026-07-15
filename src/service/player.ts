import { createPlaybackController as createYoutubePlaybackController } from "@/service/vendors/youtube/player";

export const PLAYBACK_STATES = ["cued", "playing", "paused", "ended"] as const;
export type PlaybackState = (typeof PLAYBACK_STATES)[number];

export interface PlaybackController {
  play: () => void;
  pause: () => void;
  loadTrack: (trackId: string) => void;
  cueTrack: (trackId: string, startSeconds?: number) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

export interface CreatePlaybackControllerOptions {
  containerId: string;
  trackId: string;
  autoplay: boolean;
  onStateChange: (state: PlaybackState) => void;
}

// NOTE: 別のサービスに差し替える場合はここを新しい vendor の再生コントローラに変更する
export const createPlaybackController: (
  options: CreatePlaybackControllerOptions,
) => Promise<PlaybackController> = createYoutubePlaybackController;
