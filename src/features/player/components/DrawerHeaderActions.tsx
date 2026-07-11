"use client";

import { ChevronDown } from "lucide-react";
import { usePlayer } from "@/features/player/hook";

export function DrawerHeaderActions() {
  const { minimizeDrawer } = usePlayer();

  return (
    <button
      type="button"
      onClick={minimizeDrawer}
      aria-label="最小化"
      className="text-zinc-400"
    >
      <ChevronDown className="h-5 w-5" />
    </button>
  );
}
