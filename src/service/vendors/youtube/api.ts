import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { QuotaUsage } from "@/features/user/entity";

const API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const DAILY_QUOTA_UNITS = 10_000;
const API_CALL_COST_UNITS = 1;

let quotaUsageDate = "";
let quotaUsageUnits = 0;

const getTodayDateKey = (): string => new Date().toDateString();

const recordApiUsage = (): void => {
  const today = getTodayDateKey();

  if (quotaUsageDate !== today) {
    quotaUsageDate = today;
    quotaUsageUnits = 0;
  }

  quotaUsageUnits += API_CALL_COST_UNITS;
};

export const getQuotaUsage = (): QuotaUsage => {
  const today = getTodayDateKey();

  if (quotaUsageDate !== today) {
    quotaUsageDate = today;
    quotaUsageUnits = 0;
  }

  const resetAt = new Date();
  resetAt.setHours(24, 0, 0, 0);

  return {
    usedUnits: quotaUsageUnits,
    totalUnits: DAILY_QUOTA_UNITS,
    resetAt: resetAt.toISOString(),
  };
};

const getAccessToken = async (): Promise<string> => {
  const session = await auth();

  // NOTE: リフレッシュに失敗したトークンをそのまま送ると 401 を返し続けるため、
  // 検知した時点でサインイン画面へ再誘導する。Server Component のレンダー中にも
  // 呼ばれるため、Cookie を書き換える signOut ではなく redirect を使用する
  if (session?.error === "RefreshAccessTokenError") {
    redirect("/signin");
  }

  return session?.accessToken ?? "";
};

const buildApiUrl = (
  path: string,
  searchParams: Record<string, string>,
): URL => {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
};

interface YoutubeApiErrorResponse {
  error?: {
    message?: string;
    errors?: { reason?: string }[];
  };
}

const throwApiError = async (response: Response): Promise<never> => {
  const body: unknown = await response.json().catch(() => null);
  const { error } = (body ?? {}) as YoutubeApiErrorResponse;
  const reason = error?.errors?.[0]?.reason;
  const detail = [reason, error?.message].filter(Boolean).join(": ");

  throw new Error(
    `YouTube API request failed: ${response.status}${detail ? ` (${detail})` : ""}`,
  );
};

export const fetchApi = async <T>(
  path: string,
  searchParams: Record<string, string>,
): Promise<T> => {
  const accessToken = await getAccessToken();
  const url = buildApiUrl(path, searchParams);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  recordApiUsage();

  if (!response.ok) {
    await throwApiError(response);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const postApi = async <T>(
  path: string,
  searchParams: Record<string, string>,
  body: unknown,
): Promise<T> => {
  const accessToken = await getAccessToken();
  const url = buildApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  recordApiUsage();

  if (!response.ok) {
    await throwApiError(response);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const putApi = async <T>(
  path: string,
  searchParams: Record<string, string>,
  body: unknown,
): Promise<T> => {
  const accessToken = await getAccessToken();
  const url = buildApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  recordApiUsage();

  if (!response.ok) {
    await throwApiError(response);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const deleteApi = async (
  path: string,
  searchParams: Record<string, string>,
): Promise<void> => {
  const accessToken = await getAccessToken();
  const url = buildApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  recordApiUsage();

  if (!response.ok) {
    await throwApiError(response);
  }
};
