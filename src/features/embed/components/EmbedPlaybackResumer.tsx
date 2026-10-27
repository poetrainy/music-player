"use client";

import { useEffect } from "react";
import { isEmbedResumeMessage } from "@/features/embed/library";
import { usePlayer } from "@/features/player/hook";

// NOTE: 埋め込み元で再生が許可されたことは iframe 内では分からないため、埋め込み元からのメッセージを受けて再生し直す
export function EmbedPlaybackResumer() {
  const { resumePlayback } = usePlayer();

  useEffect(() => {
    const handleMessage = ({ source, data }: MessageEvent) => {
      // NOTE: 埋め込み元以外のウィンドウから再生させられないよう、親ウィンドウからのメッセージに限る
      if (window.parent === window || source !== window.parent) {
        return;
      }

      if (!isEmbedResumeMessage(data)) {
        return;
      }

      resumePlayback();
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [resumePlayback]);

  return null;
}
