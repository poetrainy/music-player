"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { Music } from "lucide-react";
import { cn } from "@/library";

export const SONG_THUMBNAIL_SIZES = ["small", "large"] as const;
export type SongThumbnailSize = (typeof SONG_THUMBNAIL_SIZES)[number];

export const SONG_THUMBNAIL_IMAGE_SIZES = ["8rem", "24rem"] as const;
export type SongThumbnailImageSize =
  (typeof SONG_THUMBNAIL_IMAGE_SIZES)[number];

interface Props extends Omit<
  ImageProps,
  "sizes" | "src" | "onError" | "onLoad"
> {
  thumbnailUrl: string;
  size: SongThumbnailSize;
  sizes?: SongThumbnailImageSize;
}

export function SongThumbnail({
  thumbnailUrl,
  alt,
  className,
  size,
  sizes,
  fill,
  ...imageProps
}: Props) {
  const [hasFailed, setHasFailed] = useState(false);

  const defaultSizes: SongThumbnailImageSize =
    size === "large" ? "24rem" : "8rem";

  if (hasFailed) {
    return (
      <div className="bg-surface-elevated flex size-full items-center justify-center">
        <Music className="size-1/2 text-zinc-500" />
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
      onError={() => setHasFailed(true)}
    />
  );
}
