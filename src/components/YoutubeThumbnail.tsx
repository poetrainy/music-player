"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { Music } from "lucide-react";
import { cn } from "@/library";

export const YOUTUBE_THUMBNAIL_SIZES = ["small", "large"] as const;
export type YoutubeThumbnailSize = (typeof YOUTUBE_THUMBNAIL_SIZES)[number];

const LARGE_THUMBNAIL_QUALITIES = [
  "maxresdefault",
  "sddefault",
  "hqdefault",
  "mqdefault",
  "default",
] as const;

const SMALL_THUMBNAIL_QUALITIES = [
  "mqdefault",
  "hqdefault",
  "sddefault",
  "maxresdefault",
] as const;

interface Props extends Omit<ImageProps, "src" | "onError" | "onLoad"> {
  videoId: string;
  size: YoutubeThumbnailSize;
}

export function YoutubeThumbnail({
  videoId,
  alt,
  className,
  size,
  sizes,
  fill,
  ...imageProps
}: Props) {
  const [qualityIndex, setQualityIndex] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);

  const thumbnailQualities =
    size === "large" ? LARGE_THUMBNAIL_QUALITIES : SMALL_THUMBNAIL_QUALITIES;
  const isLastFallback = qualityIndex === thumbnailQualities.length - 1;
  const defaultSizes = size === "large" ? "24rem" : "8rem";

  useEffect(() => {
    setQualityIndex(0);
    setHasFailed(false);
  }, [videoId]);

  const advanceFallback = () => {
    if (isLastFallback) {
      setHasFailed(true);
      return;
    }

    setQualityIndex((index) =>
      Math.min(index + 1, thumbnailQualities.length - 1),
    );
  };

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/${thumbnailQualities[qualityIndex]}.jpg`;

  if (hasFailed) {
    return (
      <div className="bg-surface-elevated flex h-full w-full items-center justify-center">
        <Music className="h-1/2 w-1/2 text-zinc-500" />
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      src={thumbnailUrl}
      alt={alt}
      sizes={sizes ?? defaultSizes}
      fill={fill !== undefined ? fill : true}
      className={cn("object-cover", className)}
      onError={advanceFallback}
    />
  );
}
