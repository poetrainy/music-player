import { ClassValue, clsx } from "clsx";
import { THEMES, Theme } from "@/entity";

export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

export const SERVICE_NAME = "Music Player";

// NOTE: app/globals.css の --brand（var(--color-purple-500)）と同じ値。CSS変数はメタデータ設定から参照できないため直接指定している
export const SERVICE_THEME_COLOR = "#a855f7";

export const chunkArray = <Item>(items: Item[], size: number): Item[][] => {
  const chunks: Item[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const THEME_STORAGE_KEY = "music-player-theme";

export const parseTheme = (value: string | null | undefined): Theme | null =>
  THEMES.find((theme) => theme === value) ?? null;

export const saveTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
};

// NOTE: 描画前に適用して初期表示のちらつきを避けるため、hydration より前に実行するスクリプトとして埋め込む。iframe 内では埋め込み元の指定を優先するため適用しない
export const THEME_RESTORE_SCRIPT = `try{if(window.self===window.top){var theme=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(THEMES)}.indexOf(theme)!==-1){document.documentElement.dataset.theme=theme}}}catch(error){}`;
