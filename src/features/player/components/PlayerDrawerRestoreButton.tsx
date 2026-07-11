"use client";

import { ChevronUp } from "lucide-react";
import { usePlayer } from "@/features/player/hook";

export function PlayerDrawerRestoreButton() {
  const { drawerState, maximizeDrawer } = usePlayer();

  if (drawerState !== "minimized") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={maximizeDrawer}
      aria-label="ドロワーを元に戻す"
      className="bg-brand fixed right-6 bottom-24 z-50 hidden h-12 w-12 items-center justify-center rounded-full text-black shadow-lg shadow-black/40 sm:flex"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
