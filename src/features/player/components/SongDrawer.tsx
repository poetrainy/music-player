"use client";

import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePlayer } from "@/features/player/hook";

interface Props {
  children: ReactNode;
}

const subscribeToNothing = () => () => {};

export function SongDrawer({ children }: Props) {
  const { isDrawerPanelVisible, setDrawerPanelVisible } = usePlayer();
  const [hasEntered, setHasEntered] = useState(false);
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHasEntered(true);
      setDrawerPanelVisible(true);
    });

    return () => {
      cancelAnimationFrame(frame);
      setDrawerPanelVisible(false);
    };
  }, [setDrawerPanelVisible]);

  const isPanelVisible = hasEntered && isDrawerPanelVisible;

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-24 bottom-24 z-50 flex justify-end">
      <div
        className={`bg-surface pointer-events-auto relative flex h-full w-full flex-col overflow-hidden rounded-l-xl shadow-2xl shadow-black/40 transition-transform duration-300 ease-out sm:w-[420px] ${
          isPanelVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
