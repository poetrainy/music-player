"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePlayer } from "@/features/player/hook";

declare global {
  interface HTMLVideoElement {
    autoPictureInPicture: boolean;
  }
}

const PIP_CANVAS_SIZE = 256;
const PIP_CANVAS_FRAME_RATE = 1;
const PIP_BACKGROUND_COLOR = "#27272a";

const drawThumbnailFrame = (
  canvas: HTMLCanvasElement,
  thumbnail: HTMLImageElement | null,
): void => {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.fillStyle = PIP_BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (thumbnail) {
    context.drawImage(thumbnail, 0, 0, canvas.width, canvas.height);
  }
};

export function PlayerPictureInPicture() {
  const { currentSong, isPlaying, playNext, playPrevious, togglePlayback } =
    usePlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.srcObject) {
      return;
    }

    video.autoPictureInPicture = true;
    video.srcObject = canvas.captureStream(PIP_CANVAS_FRAME_RATE);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !currentSong) {
      return;
    }

    let isCancelled = false;

    drawThumbnailFrame(canvas, null);

    const thumbnail = new Image();

    thumbnail.crossOrigin = "anonymous";
    thumbnail.src = currentSong.thumbnailUrlLarge;
    thumbnail.onload = () => {
      if (isCancelled) {
        return;
      }

      drawThumbnailFrame(canvas, thumbnail);
    };

    return () => {
      isCancelled = true;
    };
  }, [currentSong]);

  useLayoutEffect(() => {
    const video = videoRef.current;

    if (!video || !currentSong) {
      return;
    }

    if (isPlaying) {
      video.play().catch((error: unknown) => {
        console.error("Failed to play picture-in-picture video", error);
      });
    } else {
      video.pause();
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentSong) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      artwork: [
        {
          src: currentSong.thumbnailUrlLarge,
          sizes: "480x360",
          type: "image/jpeg",
        },
      ],
    });
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    navigator.mediaSession.setActionHandler("play", togglePlayback);
    navigator.mediaSession.setActionHandler("pause", togglePlayback);
    navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [playNext, playPrevious, togglePlayback]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={PIP_CANVAS_SIZE}
        height={PIP_CANVAS_SIZE}
        className="pointer-events-none fixed top-0 left-0 size-px -translate-x-full overflow-hidden opacity-0"
      />
      <video
        ref={videoRef}
        muted
        playsInline
        className="size-full object-cover"
      />
    </>
  );
}
