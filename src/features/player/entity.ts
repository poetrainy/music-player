// NOTE: サーバー側（Discord からの操作）でも再生先の状態を検証できるよう、"use client" の hook.ts ではなくここで定義する
export const REPEAT_MODES = ["off", "all", "one"] as const;
export type RepeatMode = (typeof REPEAT_MODES)[number];
