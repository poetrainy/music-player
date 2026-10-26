"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_THEME, Theme } from "@/entity";
import { parseTheme, saveTheme } from "@/library";

// NOTE: 埋め込み元からのメッセージなど、このフック以外での切り替えにも追従するよう data-theme 属性の変化を監視する
const subscribeTheme = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
};

const getThemeSnapshot = (): Theme =>
  parseTheme(document.documentElement.dataset.theme) ?? DEFAULT_THEME;

export const useTheme = () => {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => DEFAULT_THEME,
  );

  const toggleTheme = useCallback(() => {
    saveTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return { theme, toggleTheme };
};
