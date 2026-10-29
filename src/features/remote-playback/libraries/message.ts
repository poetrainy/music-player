import { isRecord } from "@/features/embed/library";
import { REPEAT_MODES, RepeatMode } from "@/features/player/entity";
import {
  REMOTE_PLAYBACK_SIMPLE_COMMAND_TYPES,
  RemotePlaybackCommand,
  RemotePlaybackCommandMessage,
  RemotePlaybackPresenceData,
  RemotePlaybackSimpleCommandType,
  RemotePlaybackState,
  RemotePlaybackStateMessage,
} from "@/features/remote-playback/entity";
import { Song } from "@/features/song/entity";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isSong = (value: unknown): value is Song =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.artist === "string" &&
  isNumber(value.durationSeconds) &&
  typeof value.thumbnailUrlSmall === "string" &&
  typeof value.thumbnailUrlLarge === "string";

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isRepeatMode = (value: unknown): value is RepeatMode =>
  REPEAT_MODES.some((mode) => mode === value);

const isSimpleCommandType = (
  value: unknown,
): value is RemotePlaybackSimpleCommandType =>
  REMOTE_PLAYBACK_SIMPLE_COMMAND_TYPES.some((type) => type === value);

const parseCommand = (value: unknown): RemotePlaybackCommand | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (value.type === "play") {
    if (
      !isSong(value.song) ||
      !isNullableString(value.playlistId) ||
      typeof value.playlistTitle !== "string" ||
      !isNumber(value.startSeconds)
    ) {
      return null;
    }

    return {
      type: "play",
      song: value.song,
      playlistId: value.playlistId,
      playlistTitle: value.playlistTitle,
      startSeconds: value.startSeconds,
    };
  }

  if (value.type === "seek") {
    return isNumber(value.seconds)
      ? { type: "seek", seconds: value.seconds }
      : null;
  }

  if (value.type === "volume") {
    return isNumber(value.volume)
      ? { type: "volume", volume: value.volume }
      : null;
  }

  return isSimpleCommandType(value.type) ? { type: value.type } : null;
};

const parseState = (value: unknown): RemotePlaybackState | null => {
  if (
    !isRecord(value) ||
    !(value.song === null || isSong(value.song)) ||
    !isNullableString(value.playlistId) ||
    typeof value.playlistTitle !== "string" ||
    typeof value.isPlaying !== "boolean" ||
    !isNumber(value.currentTime) ||
    !isNumber(value.duration) ||
    !isNumber(value.volume) ||
    typeof value.isShuffled !== "boolean" ||
    !isRepeatMode(value.repeatMode)
  ) {
    return null;
  }

  return {
    song: value.song,
    playlistId: value.playlistId,
    playlistTitle: value.playlistTitle,
    isPlaying: value.isPlaying,
    currentTime: value.currentTime,
    duration: value.duration,
    volume: value.volume,
    isShuffled: value.isShuffled,
    repeatMode: value.repeatMode,
  };
};

// NOTE: メッセージは同じチャンネルの別のデバイスから届く任意の値のため、形を確かめてから使う
export const parseRemotePlaybackCommandMessage = (
  value: unknown,
): RemotePlaybackCommandMessage | null => {
  if (!isRecord(value) || typeof value.deviceId !== "string") {
    return null;
  }

  const command = parseCommand(value.command);

  return command && { deviceId: value.deviceId, command };
};

export const parseRemotePlaybackStateMessage = (
  value: unknown,
): RemotePlaybackStateMessage | null => {
  if (!isRecord(value) || typeof value.deviceId !== "string") {
    return null;
  }

  const state = parseState(value.state);

  return state && { deviceId: value.deviceId, state };
};

export const parseRemotePlaybackPresenceData = (
  value: unknown,
): RemotePlaybackPresenceData | null =>
  isRecord(value) &&
  typeof value.deviceId === "string" &&
  isNumber(value.enteredAt)
    ? { deviceId: value.deviceId, enteredAt: value.enteredAt }
    : null;
