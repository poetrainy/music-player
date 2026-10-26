"use client";

import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

// NOTE: 埋め込み用の Cookie は埋め込み元と同じサイトで直接開いた場合にも送られるため、実際に iframe 内で表示しているかも確かめる
export const useIsEmbedded = (hasEmbedSession: boolean): boolean =>
  useSyncExternalStore(
    subscribeNothing,
    () => hasEmbedSession && window.self !== window.top,
    () => hasEmbedSession,
  );
