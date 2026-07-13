"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { Music } from "lucide-react";
import { cn } from "@/library";

export const SONG_THUMBNAIL_SIZES = ["small", "large"] as const;
export type SongThumbnailSize = (typeof SONG_THUMBNAIL_SIZES)[number];

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

export const SONG_THUMBNAIL_IMAGE_SIZES = ["8rem", "24rem"] as const;
export type SongThumbnailImageSize =
  (typeof SONG_THUMBNAIL_IMAGE_SIZES)[number];

interface Props extends Omit<
  ImageProps,
  "sizes" | "src" | "onError" | "onLoad"
> {
  songId: string;
  size: SongThumbnailSize;
  sizes?: SongThumbnailImageSize;
}

export function SongThumbnail({
  songId,
  alt,
  className,
  size,
  sizes,
  fill,
  ...imageProps
}: Props) {
  const [qualityIndex, setQualityIndex] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);

  const advanceFallback = () => {
    if (isLastFallback) {
      setHasFailed(true);
      return;
    }

    setQualityIndex((index) => index + 1);
  };

  const thumbnailQualities =
    size === "large" ? LARGE_THUMBNAIL_QUALITIES : SMALL_THUMBNAIL_QUALITIES;
  const isLastFallback = qualityIndex === thumbnailQualities.length - 1;
  const defaultSizes: SongThumbnailImageSize =
    size === "large" ? "24rem" : "8rem";
  const thumbnailUrl = `https://i.ytimg.com/vi/${songId}/${thumbnailQualities[qualityIndex]}.jpg`;

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
