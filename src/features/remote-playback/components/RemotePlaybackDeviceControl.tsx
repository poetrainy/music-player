"use client";

import { useEffect, useRef, useState } from "react";
import { cva } from "class-variance-authority";
import { Check, MonitorSpeaker } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { useRemotePlaybackTarget } from "@/features/remote-playback/hook";
import { REMOTE_PLAYBACK_DEVICES } from "@/features/remote-playback/libraries/device";

const THIS_DEVICE_NAME = "このデバイス";
const OFFLINE_LABEL = "オフライン";

const cvaRemotePlaybackDeviceControlButton = cva("", {
  variants: {
    isRemote: {
      true: "text-brand",
      false: "text-contrast",
    },
  },
});

const cvaRemotePlaybackDeviceControlCheck = cva("size-4 shrink-0", {
  variants: {
    isSelected: {
      true: "text-brand",
      false: "invisible",
    },
  },
});

export function RemotePlaybackDeviceControl() {
  const { targetDeviceId, selectTargetDevice, onlineDeviceIds } =
    useRemotePlaybackTarget();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPopoverOpen) {
      return;
    }

    const handlePointerDown = ({ target }: MouseEvent) => {
      if (target instanceof Node && !containerRef.current?.contains(target)) {
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

  const handleSelect = (deviceId: string | null) => {
    selectTargetDevice(deviceId);
    setIsPopoverOpen(false);
  };

  const options = [
    { id: null, name: THIS_DEVICE_NAME, isOnline: true },
    ...REMOTE_PLAYBACK_DEVICES.map(({ id, name }) => ({
      id,
      name,
      isOnline: onlineDeviceIds.includes(id),
    })),
  ];
  const targetDeviceName =
    options.find(({ id }) => id === targetDeviceId)?.name ?? THIS_DEVICE_NAME;

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        type="button"
        onClick={handleToggle}
        aria-label={`再生先：${targetDeviceName}`}
        aria-expanded={isPopoverOpen}
        className={cvaRemotePlaybackDeviceControlButton({
          isRemote: !!targetDeviceId,
        })}
      >
        <MonitorSpeaker className="size-6" />
      </IconButton>
      {isPopoverOpen && (
        <div className="bg-solid absolute top-full right-0 z-50 mt-2 w-44 rounded-lg p-1 shadow-lg shadow-black/40">
          <p className="text-muted px-3 pt-2 pb-1 text-xs">再生先</p>
          <ul>
            {options.map(({ id, name, isOnline }) => (
              <li key={id ?? THIS_DEVICE_NAME}>
                <button
                  type="button"
                  onClick={() => handleSelect(id)}
                  aria-pressed={id === targetDeviceId}
                  disabled={!isOnline}
                  className="text-contrast hover:bg-contrast/10 active:bg-contrast/15 disabled:text-muted flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm disabled:hover:bg-transparent"
                >
                  <Check
                    aria-hidden="true"
                    className={cvaRemotePlaybackDeviceControlCheck({
                      isSelected: id === targetDeviceId,
                    })}
                  />
                  <span className="min-w-0 flex-1">{name}</span>
                  {!isOnline && (
                    <span className="text-muted text-xs">{OFFLINE_LABEL}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
