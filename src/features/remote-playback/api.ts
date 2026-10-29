import { InboundMessage, Realtime } from "ably";
import {
  REMOTE_PLAYBACK_COMMAND_MESSAGE_NAME,
  REMOTE_PLAYBACK_STATE_MESSAGE_NAME,
  RemotePlaybackCommand,
  RemotePlaybackCommandResult,
  RemotePlaybackState,
} from "@/features/remote-playback/entity";
import { createRemotePlaybackChannelName } from "@/features/remote-playback/libraries/device";
import {
  parseRemotePlaybackPresenceData,
  parseRemotePlaybackStateMessage,
} from "@/features/remote-playback/libraries/message";

// NOTE: 再生の開始は再生先が曲を読み込むまで状態が変わり続けるため、待つ時間の上限を長めに取る
const REMOTE_PLAYBACK_STATE_TIMEOUT_MILLISECONDS = 10 * 1000;
// NOTE: 再生先は 1 つの命令で状態を複数回送りうるため、最後の状態を受け取ってから少し待ち、続けて届かなければ確定とみなす
const REMOTE_PLAYBACK_STATE_SETTLE_MILLISECONDS = 1000;

interface RemotePlaybackStateWaiter {
  promise: Promise<RemotePlaybackState | null>;
  listener: (message: InboundMessage) => void;
  cancel: () => void;
}

const waitRemotePlaybackState = (
  deviceId: string,
  isExpectedState: (state: RemotePlaybackState) => boolean,
): RemotePlaybackStateWaiter => {
  let latestState: RemotePlaybackState | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
  let listener: (message: InboundMessage) => void = () => {};

  const promise = new Promise<RemotePlaybackState | null>((resolve) => {
    timeoutTimer = setTimeout(() => {
      clearTimeout(settleTimer);
      resolve(latestState);
    }, REMOTE_PLAYBACK_STATE_TIMEOUT_MILLISECONDS);

    listener = ({ name, data }) => {
      const message =
        name === REMOTE_PLAYBACK_STATE_MESSAGE_NAME
          ? parseRemotePlaybackStateMessage(data)
          : null;

      if (!message || message.deviceId !== deviceId) {
        return;
      }

      latestState = message.state;
      clearTimeout(settleTimer);

      if (!isExpectedState(message.state)) {
        return;
      }

      settleTimer = setTimeout(() => {
        clearTimeout(timeoutTimer);
        resolve(latestState);
      }, REMOTE_PLAYBACK_STATE_SETTLE_MILLISECONDS);
    };
  });

  // NOTE: 命令を送らずに終える場合に、待ち時間の上限まで処理が残り続けないよう止める
  const cancel = () => {
    clearTimeout(settleTimer);
    clearTimeout(timeoutTimer);
  };

  return { promise, listener, cancel };
};

// NOTE: サインインしていない場面（Discord からの操作）で使うため、ブラウザ向けのトークンではなくサーバーの API キーで接続する
export const sendRemotePlaybackCommand = async (
  email: string,
  deviceId: string,
  command: RemotePlaybackCommand,
  isExpectedState: (state: RemotePlaybackState) => boolean,
): Promise<RemotePlaybackCommandResult> => {
  const { ABLY_API_KEY: key } = process.env;

  if (!key) {
    throw new Error("ABLY_API_KEY is not set");
  }

  const client = new Realtime({ key });

  try {
    const channel = client.channels.get(
      await createRemotePlaybackChannelName(email),
    );
    const { promise, listener, cancel } = waitRemotePlaybackState(
      deviceId,
      isExpectedState,
    );

    // NOTE: 命令を送った直後に届く状態を取りこぼさないよう、受信の準備ができてから送る
    await channel.subscribe(listener);

    const members = await channel.presence.get();
    const isDeviceOnline = members.some(
      ({ data }) =>
        parseRemotePlaybackPresenceData(data)?.deviceId === deviceId,
    );

    // NOTE: オフラインのデバイス宛ての命令は保存されず破棄されるため、送らずに知らせる
    if (!isDeviceOnline) {
      cancel();

      return { isDeviceOnline, state: null };
    }

    await channel.publish(REMOTE_PLAYBACK_COMMAND_MESSAGE_NAME, {
      deviceId,
      command,
    });

    return { isDeviceOnline, state: await promise };
  } finally {
    client.close();
  }
};
