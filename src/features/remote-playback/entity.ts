import { RepeatMode } from "@/features/player/hook";
import { Song } from "@/features/song/entity";

export interface RemotePlaybackDevice {
  id: string;
  name: string;
}

export const REMOTE_PLAYBACK_TOKEN_PATH = "/api/remote-playback/token";
export const REMOTE_PLAYBACK_COMMAND_MESSAGE_NAME = "command";
export const REMOTE_PLAYBACK_STATE_MESSAGE_NAME = "state";

export interface RemotePlaybackPlayCommand {
  type: "play";
  song: Song;
  playlistId: string | null;
  playlistTitle: string;
  startSeconds: number;
}

export interface RemotePlaybackSeekCommand {
  type: "seek";
  seconds: number;
}

export interface RemotePlaybackVolumeCommand {
  type: "volume";
  volume: number;
}

export const REMOTE_PLAYBACK_SIMPLE_COMMAND_TYPES = [
  "toggle-playback",
  "next",
  "previous",
  "shuffle",
  "repeat",
  "request-state",
] as const;
export type RemotePlaybackSimpleCommandType =
  (typeof REMOTE_PLAYBACK_SIMPLE_COMMAND_TYPES)[number];

export interface RemotePlaybackSimpleCommand {
  type: RemotePlaybackSimpleCommandType;
}

export type RemotePlaybackCommand =
  | RemotePlaybackPlayCommand
  | RemotePlaybackSeekCommand
  | RemotePlaybackVolumeCommand
  | RemotePlaybackSimpleCommand;

export interface RemotePlaybackCommandMessage {
  deviceId: string;
  command: RemotePlaybackCommand;
}

export interface RemotePlaybackState {
  song: Song | null;
  playlistId: string | null;
  playlistTitle: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
}

export interface RemotePlaybackStateMessage {
  deviceId: string;
  state: RemotePlaybackState;
}
