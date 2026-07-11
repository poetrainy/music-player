"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

const THUMBNAIL_QUALITIES = [
  "maxresdefault",
  "sddefault",
  "hqdefault",
  "mqdefault",
  "default",
] as const;

const MIN_ACCEPTABLE_THUMBNAIL_WIDTH = 300;

interface Props extends Omit<ImageProps, "src" | "onError" | "onLoad"> {
  videoId: string;
}

export function YoutubeThumbnail({ videoId, alt, ...imageProps }: Props) {
  const [qualityIndex, setQualityIndex] = useState(0);
  const isLastFallback = qualityIndex === THUMBNAIL_QUALITIES.length - 1;

  const advanceFallback = () => {
    setQualityIndex((index) =>
      Math.min(index + 1, THUMBNAIL_QUALITIES.length - 1),
    );
  };

  return (
    <Image
      {...imageProps}
      src={`https://i.ytimg.com/vi/${videoId}/${THUMBNAIL_QUALITIES[qualityIndex]}.jpg`}
      alt={alt}
      onError={advanceFallback}
      onLoad={(event) => {
        if (
          !isLastFallback &&
          event.currentTarget.naturalWidth < MIN_ACCEPTABLE_THUMBNAIL_WIDTH
        ) {
          advanceFallback();
        }
      }}
    />
  );
}
