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
