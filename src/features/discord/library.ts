import { createPublicKey, verify } from "node:crypto";
import {
  DISCORD_BUTTON_STYLES,
  DISCORD_COMPONENT_TYPES,
  DISCORD_PLAYBACK_CONTROL_COMMAND_TYPES,
  DiscordActionRow,
  DiscordButton,
  DiscordComponentAction,
  DiscordInteraction,
  DiscordMessage,
  DiscordMessageContent,
  DiscordPlaybackControlCommandType,
  DiscordPlaybackSetting,
} from "@/features/discord/entity";
import { isRecord } from "@/features/embed/library";
import { PlaylistSummary } from "@/features/playlist/entity";
import {
  RemotePlaybackCommandResult,
  RemotePlaybackState,
} from "@/features/remote-playback/entity";
import {
  REMOTE_PLAYBACK_DEVICES,
  parseRemotePlaybackDeviceId,
} from "@/features/remote-playback/libraries/device";

// NOTE: Discord は 1 つのメッセージに付けられるボタンを 5 個 × 5 行までに制限している
const DISCORD_BUTTONS_PER_ROW = 5;
const DISCORD_MAX_ROWS = 5;
const DISCORD_MAX_BUTTONS = DISCORD_BUTTONS_PER_ROW * DISCORD_MAX_ROWS;
const DISCORD_BUTTON_LABEL_MAX_LENGTH = 80;
const DISCORD_TRUNCATED_SUFFIX = "…";
const DISCORD_CUSTOM_ID_SEPARATOR = ":";
const DISCORD_PLAYLIST_CUSTOM_ID_PREFIX = "playlist";
const DISCORD_CONTROL_CUSTOM_ID_PREFIX = "control";
const DISCORD_MARKDOWN_PATTERN = /[\\*_~`|>#-]/g;

// NOTE: Discord 以外から届いたリクエストで再生を操作されないよう、Discord の公開鍵で署名を検証する
export const verifyDiscordSignature = (
  publicKey: string,
  signature: string | null,
  timestamp: string | null,
  body: string,
): boolean => {
  if (!signature || !timestamp) {
    return false;
  }

  try {
    const key = createPublicKey({
      key: {
        kty: "OKP",
        crv: "Ed25519",
        x: Buffer.from(publicKey, "hex").toString("base64url"),
      },
      format: "jwk",
    });

    return verify(
      null,
      Buffer.from(`${timestamp}${body}`),
      key,
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
};

const getString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

export const parseDiscordInteraction = (
  value: unknown,
): DiscordInteraction | null => {
  if (
    !isRecord(value) ||
    typeof value.type !== "number" ||
    typeof value.application_id !== "string" ||
    typeof value.token !== "string"
  ) {
    return null;
  }

  const data = isRecord(value.data) ? value.data : {};
  const user = isRecord(value.member) ? value.member.user : value.user;

  return {
    type: value.type,
    applicationId: value.application_id,
    token: value.token,
    userId: isRecord(user) ? getString(user.id) : null,
    commandName: getString(data.name),
    customId: getString(data.custom_id),
  };
};

export const parseDiscordAllowedUserIds = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((userId) => userId.trim())
    .filter((userId) => !!userId);

// NOTE: 再生先の端末を家族以外から操作されないよう、許可したユーザーだけに操作させる
export const isDiscordUserAllowed = (
  userId: string | null,
  allowedUserIds: string[],
) => !!userId && allowedUserIds.includes(userId);

export const parseDiscordPlaybackSetting = (
  email: string | undefined,
  refreshToken: string | undefined,
  deviceIdValue: string | undefined,
): DiscordPlaybackSetting | null => {
  const deviceId = parseRemotePlaybackDeviceId(deviceIdValue);
  const deviceName = REMOTE_PLAYBACK_DEVICES.find(
    ({ id }) => id === deviceId,
  )?.name;

  if (!email || !refreshToken || !deviceId || !deviceName) {
    return null;
  }

  return { email, refreshToken, deviceId, deviceName };
};

const isDiscordPlaybackControlCommandType = (
  value: string,
): value is DiscordPlaybackControlCommandType =>
  DISCORD_PLAYBACK_CONTROL_COMMAND_TYPES.some((type) => type === value);

export const parseDiscordComponentAction = (
  customId: string | null,
): DiscordComponentAction | null => {
  if (!customId) {
    return null;
  }

  const separatorIndex = customId.indexOf(DISCORD_CUSTOM_ID_SEPARATOR);
  const prefix = customId.slice(0, separatorIndex);
  const value = customId.slice(separatorIndex + 1);

  if (separatorIndex === -1 || !value) {
    return null;
  }

  if (prefix === DISCORD_PLAYLIST_CUSTOM_ID_PREFIX) {
    return { type: "playlist", playlistId: value };
  }

  if (
    prefix === DISCORD_CONTROL_CUSTOM_ID_PREFIX &&
    isDiscordPlaybackControlCommandType(value)
  ) {
    return { type: "control", command: value };
  }

  return null;
};

const buildCustomId = (prefix: string, value: string) =>
  [prefix, value].join(DISCORD_CUSTOM_ID_SEPARATOR);

const truncateLabel = (label: string) =>
  label.length > DISCORD_BUTTON_LABEL_MAX_LENGTH
    ? `${label.slice(0, DISCORD_BUTTON_LABEL_MAX_LENGTH - DISCORD_TRUNCATED_SUFFIX.length)}${DISCORD_TRUNCATED_SUFFIX}`
    : label;

// NOTE: 曲名などに含まれる記号が Discord の装飾として解釈されないよう、記号の前にバックスラッシュを付ける
const escapeMarkdown = (text: string) =>
  text.replace(DISCORD_MARKDOWN_PATTERN, (character) => `\\${character}`);

const toActionRows = (buttons: DiscordButton[]): DiscordActionRow[] =>
  Array.from(
    { length: Math.ceil(buttons.length / DISCORD_BUTTONS_PER_ROW) },
    (_, index) => ({
      type: DISCORD_COMPONENT_TYPES.actionRow,
      components: buttons.slice(
        index * DISCORD_BUTTONS_PER_ROW,
        (index + 1) * DISCORD_BUTTONS_PER_ROW,
      ),
    }),
  );

export const buildDiscordPlaylistMessage = (
  playlists: PlaylistSummary[],
): DiscordMessage => {
  if (!playlists.length) {
    return { content: "プレイリストがありません", components: [] };
  }

  const buttons = playlists
    .slice(0, DISCORD_MAX_BUTTONS)
    .map(({ id, title }) => ({
      type: DISCORD_COMPONENT_TYPES.button,
      style: DISCORD_BUTTON_STYLES.secondary,
      label: truncateLabel(title),
      custom_id: buildCustomId(DISCORD_PLAYLIST_CUSTOM_ID_PREFIX, id),
    }));
  const content =
    playlists.length > DISCORD_MAX_BUTTONS
      ? `再生するプレイリストを選んでください（${DISCORD_MAX_BUTTONS} 件まで表示）`
      : "再生するプレイリストを選んでください";

  return { content, components: toActionRows(buttons) };
};

const buildControlButton = (
  command: DiscordPlaybackControlCommandType,
  emoji: string,
  style: number,
): DiscordButton => ({
  type: DISCORD_COMPONENT_TYPES.button,
  style,
  emoji: { name: emoji },
  custom_id: buildCustomId(DISCORD_CONTROL_CUSTOM_ID_PREFIX, command),
});

const getToggleButtonStyle = (isActive: boolean) =>
  isActive ? DISCORD_BUTTON_STYLES.success : DISCORD_BUTTON_STYLES.secondary;

const buildPlaybackContent = (
  { song, playlistTitle, isPlaying }: RemotePlaybackState,
  deviceName: string,
) => {
  if (!song) {
    return `${deviceName}：再生していません`;
  }

  return [
    `${isPlaying ? "▶ 再生中" : "⏸ 一時停止中"}（${deviceName}）`,
    `**${escapeMarkdown(song.title)}** / ${escapeMarkdown(song.artist)}`,
    ...(playlistTitle
      ? [`プレイリスト：${escapeMarkdown(playlistTitle)}`]
      : []),
  ].join("\n");
};

// NOTE: 押したボタンに応じて再生先で何が起きたかが分かるよう、再生・リピート・シャッフルの状態をボタンの表示に反映する
export const buildDiscordPlaybackMessage = (
  state: RemotePlaybackState,
  deviceName: string,
): DiscordMessage => {
  const { isPlaying, isShuffled, repeatMode } = state;

  return {
    content: buildPlaybackContent(state, deviceName),
    components: toActionRows([
      buildControlButton(
        "repeat",
        repeatMode === "one" ? "🔂" : "🔁",
        getToggleButtonStyle(repeatMode !== "off"),
      ),
      buildControlButton("previous", "◀️", DISCORD_BUTTON_STYLES.secondary),
      // NOTE: 前後の曲の ◀️・▶️ と見分けられるよう、再生は丸・停止は四角で表す
      buildControlButton(
        "toggle-playback",
        isPlaying ? "⏹️" : "⏺️",
        DISCORD_BUTTON_STYLES.primary,
      ),
      buildControlButton("next", "▶️", DISCORD_BUTTON_STYLES.secondary),
      buildControlButton("shuffle", "🔀", getToggleButtonStyle(isShuffled)),
    ]),
  };
};

// NOTE: 再生先に届かなかった場合は、もう一度押せるようボタンを残したまま文言だけを差し替える
export const buildDiscordPlaybackResultMessage = (
  { isDeviceOnline, state }: RemotePlaybackCommandResult,
  deviceName: string,
): DiscordMessage | DiscordMessageContent => {
  if (!isDeviceOnline) {
    return {
      content: `${deviceName}がオフラインのため操作できませんでした。再生先の画面を開いてからもう一度押してください`,
    };
  }

  if (!state) {
    return {
      content: `${deviceName}から応答がありませんでした。もう一度押してください`,
    };
  }

  return buildDiscordPlaybackMessage(state, deviceName);
};
