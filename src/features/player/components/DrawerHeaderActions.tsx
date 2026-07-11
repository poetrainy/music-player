"use client";

import { ChevronDown, X } from "lucide-react";
import { usePlayer } from "@/features/player/hook";

export function DrawerHeaderActions() {
  const { closeDrawer, minimizeDrawer } = usePlayer();

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={minimizeDrawer}
        aria-label="最小化"
        className="text-zinc-400"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={closeDrawer}
        aria-label="閉じる"
        className="text-zinc-400"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
