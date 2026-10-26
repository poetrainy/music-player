import devices from "@/features/remote-playback/devices.json";
import {
  RemotePlaybackDevice,
  RemotePlaybackDeviceInstance,
} from "@/features/remote-playback/entity";

export const REMOTE_PLAYBACK_DEVICES: RemotePlaybackDevice[] = devices;

export const REMOTE_PLAYBACK_DEVICE_QUERY_NAME = "device";
const REMOTE_PLAYBACK_TARGET_DEVICE_COOKIE_NAME =
  "music-player-remote-playback-target-device";
const REMOTE_PLAYBACK_TARGET_DEVICE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

// NOTE: クエリで再生先を指定されたときにサーバー側でも書き換えられるよう、再生先は Cookie に保存する
export const REMOTE_PLAYBACK_TARGET_DEVICE_COOKIE_OPTIONS = {
  name: REMOTE_PLAYBACK_TARGET_DEVICE_COOKIE_NAME,
  path: "/",
  sameSite: "lax",
  maxAge: REMOTE_PLAYBACK_TARGET_DEVICE_MAX_AGE_SECONDS,
} as const;

export const parseRemotePlaybackDeviceId = (
  value: string | null | undefined,
): string | null =>
  REMOTE_PLAYBACK_DEVICES.find(({ id }) => id === value)?.id ?? null;

// NOTE: 開いた画面の再生先を指定のデバイスにするため、クエリで再生先を渡す。指定がない場合は自分で再生する設定のまま開く
export const buildRemotePlaybackTargetHref = (
  path: string,
  deviceId: string | null,
): string => {
  if (!deviceId) {
    return path;
  }

  const searchParams = new URLSearchParams({
    [REMOTE_PLAYBACK_DEVICE_QUERY_NAME]: deviceId,
  });

  return `${path}?${searchParams}`;
};

// NOTE: チャンネル名からメールアドレスを読み取れないよう、ハッシュにして使う
export const createRemotePlaybackChannelName = async (
  email: string,
): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(email),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `remote-playback:${hash}`;
};

const targetDeviceIdListeners = new Set<() => void>();

export const loadRemotePlaybackTargetDeviceId = (): string | null => {
  const prefix = `${REMOTE_PLAYBACK_TARGET_DEVICE_COOKIE_NAME}=`;

  return parseRemotePlaybackDeviceId(
    document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(prefix))
      ?.slice(prefix.length),
  );
};

export const subscribeRemotePlaybackTargetDeviceId = (
  onChange: () => void,
): (() => void) => {
  targetDeviceIdListeners.add(onChange);

  return () => {
    targetDeviceIdListeners.delete(onChange);
  };
};

export const saveRemotePlaybackTargetDeviceId = (
  deviceId: string | null,
): void => {
  const { name, path, sameSite, maxAge } =
    REMOTE_PLAYBACK_TARGET_DEVICE_COOKIE_OPTIONS;

  document.cookie = deviceId
    ? `${name}=${deviceId}; path=${path}; max-age=${maxAge}; samesite=${sameSite}`
    : `${name}=; path=${path}; max-age=0; samesite=${sameSite}`;

  targetDeviceIdListeners.forEach((listener) => listener());
};

const isNewerInstance = (
  instance: RemotePlaybackDeviceInstance,
  other: RemotePlaybackDeviceInstance,
): boolean =>
  instance.enteredAt > other.enteredAt ||
  (instance.enteredAt === other.enteredAt &&
    instance.connectionId > other.connectionId);

// NOTE: 同じ再生先が複数の場所で開かれていると命令が重複して実行されるため、最後に開かれたものだけを再生先として扱う
export const getActiveRemotePlaybackDeviceInstances = (
  instances: RemotePlaybackDeviceInstance[],
): RemotePlaybackDeviceInstance[] =>
  instances.filter(
    (instance) =>
      !instances.some(
        (other) =>
          other.deviceId === instance.deviceId &&
          isNewerInstance(other, instance),
      ),
  );
