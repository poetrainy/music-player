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
      className={`mx-auto w-full max-w-200 transition-transform duration-300 ease-out ${
        isDrawerPanelVisible ? "sm:-translate-x-50" : "translate-x-0"
      }`}
    >
      {children}
    </div>
  );
}
