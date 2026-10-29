import { RemotePlaybackSimpleCommandType } from "@/features/remote-playback/entity";

// NOTE: Discord の API が数値で区別する値のため、名前を付けて使う
export const DISCORD_INTERACTION_TYPES = {
  ping: 1,
  applicationCommand: 2,
  messageComponent: 3,
} as const;

export const DISCORD_INTERACTION_RESPONSE_TYPES = {
  pong: 1,
  channelMessage: 4,
  deferredChannelMessage: 5,
  deferredUpdateMessage: 6,
} as const;

export const DISCORD_COMPONENT_TYPES = {
  actionRow: 1,
  button: 2,
} as const;

export const DISCORD_BUTTON_STYLES = {
  primary: 1,
  secondary: 2,
  success: 3,
} as const;

// NOTE: 実行したユーザーにだけ表示するメッセージにするフラグ
export const DISCORD_EPHEMERAL_MESSAGE_FLAG = 64;

export const DISCORD_PLAYBACK_COMMAND_NAME = "p";

export const DISCORD_PLAYBACK_CONTROL_COMMAND_TYPES = [
  "repeat",
  "previous",
  "toggle-playback",
  "next",
  "shuffle",
] as const satisfies readonly RemotePlaybackSimpleCommandType[];
export type DiscordPlaybackControlCommandType =
  (typeof DISCORD_PLAYBACK_CONTROL_COMMAND_TYPES)[number];

export interface DiscordInteraction {
  type: number;
  applicationId: string;
  token: string;
  // NOTE: サーバー内ではメンバー、DM ではユーザーとして届くため、どちらからも取り出せない場合は null
  userId: string | null;
  commandName: string | null;
  customId: string | null;
}

export interface DiscordPlaylistSelectAction {
  type: "playlist";
  playlistId: string;
}

export interface DiscordPlaybackControlAction {
  type: "control";
  command: DiscordPlaybackControlCommandType;
}

export type DiscordComponentAction =
  DiscordPlaylistSelectAction | DiscordPlaybackControlAction;

interface DiscordButtonBase {
  type: typeof DISCORD_COMPONENT_TYPES.button;
  style: number;
  custom_id: string;
}

export interface DiscordLabelButton extends DiscordButtonBase {
  label: string;
}

// NOTE: 絵文字は label に入れると文字と同じ大きさになるため、emoji に入れてボタンいっぱいに表示する
export interface DiscordEmojiButton extends DiscordButtonBase {
  emoji: { name: string };
}

export type DiscordButton = DiscordLabelButton | DiscordEmojiButton;

export interface DiscordActionRow {
  type: typeof DISCORD_COMPONENT_TYPES.actionRow;
  components: DiscordButton[];
}

export interface DiscordMessage {
  content: string;
  components: DiscordActionRow[];
}

// NOTE: ボタンを残したまま文言だけを差し替える場合に使う
export type DiscordMessageContent = Pick<DiscordMessage, "content">;

export interface DiscordPlaybackSetting {
  email: string;
  refreshToken: string;
  deviceId: string;
  deviceName: string;
}
