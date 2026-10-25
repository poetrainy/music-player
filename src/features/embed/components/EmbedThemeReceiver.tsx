"use client";

import { useEffect } from "react";
import { parseEmbedThemeMessage } from "@/features/embed/library";

// NOTE: テーマは iframe を開いた時点の指定で決まるため、開いたあとの切り替えは埋め込み元からのメッセージで反映する
export function EmbedThemeReceiver() {
  useEffect(() => {
    const handleMessage = ({ source, data }: MessageEvent) => {
      // NOTE: 埋め込み元以外のウィンドウからテーマを書き換えられないよう、親ウィンドウからのメッセージに限る
      if (window.parent === window || source !== window.parent) {
        return;
      }

      const theme = parseEmbedThemeMessage(data);

      if (!theme) {
        return;
      }

      document.documentElement.dataset.theme = theme;
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
