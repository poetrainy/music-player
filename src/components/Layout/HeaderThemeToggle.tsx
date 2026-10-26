"use client";

import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { useTheme } from "@/hook";

export function HeaderThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  if (theme === "dark") {
    return (
      <IconButton
        type="button"
        onClick={toggleTheme}
        aria-label="ライトモードに切り替え"
        className="text-contrast"
      >
        <Sun className="size-6" />
      </IconButton>
    );
  }

  return (
    <IconButton
      type="button"
      onClick={toggleTheme}
      aria-label="ダークモードに切り替え"
      className="text-contrast"
    >
      <Moon className="size-6" />
    </IconButton>
  );
}
