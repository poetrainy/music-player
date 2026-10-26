import devices from "@/features/remote-playback/devices.json";
import { RemotePlaybackDevice } from "@/features/remote-playback/entity";

export const REMOTE_PLAYBACK_DEVICES: RemotePlaybackDevice[] = devices;

const TARGET_DEVICE_STORAGE_KEY = "remote-playback-target-device";

export const parseRemotePlaybackDeviceId = (
  value: string | null | undefined,
): string | null =>
  REMOTE_PLAYBACK_DEVICES.find(({ id }) => id === value)?.id ?? null;

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
// NOTE: localStorage を使えない環境でも切り替えた再生先を使い続けられるよう、読み込んだ値をメモリにも持つ
let cachedTargetDeviceId: string | null | undefined;

const readStoredTargetDeviceId = (): string | null => {
  try {
    return parseRemotePlaybackDeviceId(
      localStorage.getItem(TARGET_DEVICE_STORAGE_KEY),
    );
  } catch {
    return null;
  }
};

export const loadRemotePlaybackTargetDeviceId = (): string | null => {
  if (cachedTargetDeviceId === undefined) {
    cachedTargetDeviceId = readStoredTargetDeviceId();
  }

  return cachedTargetDeviceId;
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
  cachedTargetDeviceId = deviceId;

  try {
    if (deviceId) {
      localStorage.setItem(TARGET_DEVICE_STORAGE_KEY, deviceId);
    } else {
      localStorage.removeItem(TARGET_DEVICE_STORAGE_KEY);
    }
  } catch {}

  targetDeviceIdListeners.forEach((listener) => listener());
};
