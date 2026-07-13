"use client";

import { useEffect, useRef, useState } from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { usePlayer } from "@/features/player/hook";

export function PlayerVolumeControl() {
  const { setVolume, volume } = usePlayer();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPopoverOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isPopoverOpen]);

  const handleToggle = () => {
    setIsPopoverOpen((previous) => !previous);
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div ref={containerRef} className="hidden md:block relative">
      <IconButton
        type="button"
        onClick={handleToggle}
        aria-label="音量"
        aria-expanded={isPopoverOpen}
        className="text-foreground"
      >
        <VolumeIcon className="size-5" />
      </IconButton>
      {isPopoverOpen && (
        <div className="bg-surface-elevated absolute bottom-full left-1/2 mb-2 w-32 -translate-x-1/2 rounded-lg p-3 shadow-lg shadow-black/40">
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="音量"
            className="accent-brand w-full"
          />
        </div>
      )}
    </div>
  );
}
