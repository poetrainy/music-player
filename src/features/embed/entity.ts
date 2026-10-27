import colors from "tailwindcss/colors";
import { User } from "@/features/user/entity";

export interface EmbedSession {
  refreshToken: string;
  user: User;
}

type TailwindColors = typeof colors;

type EmbedColorShade = keyof TailwindColors["purple"];

// NOTE: inherit・black など段階を持たない値は --base-* の各段階に割り当てられないため除外する
export type EmbedColor = {
  [Name in keyof TailwindColors]: TailwindColors[Name] extends Record<
    EmbedColorShade,
    string
  >
    ? Name
    : never;
}[keyof TailwindColors];

export const EMBED_THEMES = ["dark", "light"] as const;
export type EmbedTheme = (typeof EMBED_THEMES)[number];

// NOTE: 埋め込み元がテーマを切り替えるときに送るメッセージの種類。埋め込み元と同じ値を使う
export const EMBED_THEME_MESSAGE_TYPE = "music-player:theme";

// NOTE: 同じ再生先が別の場所で開かれたかどうかを埋め込み元に知らせるメッセージの種類。埋め込み元と同じ値を使う
export const EMBED_REPLACED_MESSAGE_TYPE = "music-player:replaced";

// NOTE: 埋め込み元で再生が許可されたときに、止められていた再生をやり直すよう送られるメッセージの種類。埋め込み元と同じ値を使う
export const EMBED_RESUME_MESSAGE_TYPE = "music-player:resume";

export interface EmbedReplacedMessage {
  type: typeof EMBED_REPLACED_MESSAGE_TYPE;
  isReplaced: boolean;
}
