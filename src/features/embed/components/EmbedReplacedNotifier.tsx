"use client";

import { useEffect } from "react";
import {
  EMBED_REPLACED_MESSAGE_TYPE,
  EmbedReplacedMessage,
} from "@/features/embed/entity";
import { useRemotePlaybackTarget } from "@/features/remote-playback/hook";

// NOTE: 埋め込み元は iframe 内の表示を読み取れないため、同じ再生先が別の場所で開かれたかどうかをメッセージで伝え、開き直す操作を出せるようにする
export function EmbedReplacedNotifier() {
  const { isReplacedDevice } = useRemotePlaybackTarget();

  useEffect(() => {
    if (window.parent === window) {
      return;
    }

    const message: EmbedReplacedMessage = {
      type: EMBED_REPLACED_MESSAGE_TYPE,
      isReplaced: isReplacedDevice,
    };

    // NOTE: 埋め込み元のオリジンは決まっておらず、送る値も秘密ではないため、送り先のオリジンを限定しない
    window.parent.postMessage(message, "*");
  }, [isReplacedDevice]);

  return null;
}
