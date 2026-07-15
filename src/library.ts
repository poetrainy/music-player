import { ClassValue, clsx } from "clsx";

export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

export const SERVICE_NAME = "Music Player";

// NOTE: app/globals.css の --brand（var(--color-purple-500)）と同じ値。CSS変数はメタデータ設定から参照できないため直接指定している
export const SERVICE_THEME_COLOR = "#a855f7";
