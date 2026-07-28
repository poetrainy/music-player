import { ClassValue, clsx } from "clsx";

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
