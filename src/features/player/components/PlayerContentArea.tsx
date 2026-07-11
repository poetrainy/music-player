"use client";

import { ReactNode } from "react";
import { usePlayer } from "@/features/player/hook";

interface Props {
  children: ReactNode;
}

export function PlayerContentArea({ children }: Props) {
  const { isDrawerPanelVisible } = usePlayer();

  return (
    <div
      className={`transition-[margin-right] duration-300 ease-out ${
        isDrawerPanelVisible ? "sm:mr-[420px]" : "mr-0"
      }`}
    >
      {children}
    </div>
  );
}
