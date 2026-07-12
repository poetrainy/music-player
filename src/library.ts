import { ClassValue, clsx } from "clsx";
import { auth } from "@/auth";
import { QuotaUsage } from "@/features/user/entity";

export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

const CHANNEL_TITLE_TOPIC_SUFFIX_PATTERN = / - Topic$/;

export const trimChannelTopicSuffix = (channelTitle: string): string =>
  channelTitle.replace(CHANNEL_TITLE_TOPIC_SUFFIX_PATTERN, "");

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_DAILY_QUOTA_UNITS = 10_000;
const YOUTUBE_API_CALL_COST_UNITS = 1;

let quotaUsageDate = "";
let quotaUsageUnits = 0;

const getTodayDateKey = (): string => new Date().toDateString();

const recordYoutubeApiUsage = (): void => {
  const today = getTodayDateKey();

  if (quotaUsageDate !== today) {
    quotaUsageDate = today;
    quotaUsageUnits = 0;
  }

  quotaUsageUnits += YOUTUBE_API_CALL_COST_UNITS;
};

export const getYoutubeQuotaUsage = (): QuotaUsage => {
  const today = getTodayDateKey();

  if (quotaUsageDate !== today) {
    quotaUsageDate = today;
    quotaUsageUnits = 0;
  }

  const resetAt = new Date();
  resetAt.setHours(24, 0, 0, 0);

  return {
    usedUnits: quotaUsageUnits,
    totalUnits: YOUTUBE_DAILY_QUOTA_UNITS,
    resetAt: resetAt.toISOString(),
  };
};

const getYoutubeAccessToken = async (): Promise<string> => {
  const session = await auth();

  return session?.accessToken ?? "";
};

const buildYoutubeApiUrl = (
  path: string,
  searchParams: Record<string, string>,
): URL => {
  const url = new URL(`${YOUTUBE_API_BASE_URL}${path}`);

  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
};

export const fetchYoutubeApi = async <T>(
  path: string,
  searchParams: Record<string, string>,
): Promise<T> => {
  const accessToken = await getYoutubeAccessToken();
  const url = buildYoutubeApiUrl(path, searchParams);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  recordYoutubeApiUsage();

  if (!response.ok) {
    throw new Error(`YouTube API request failed: ${response.status}`);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const postYoutubeApi = async <T>(
  path: string,
  searchParams: Record<string, string>,
  body: unknown,
): Promise<T> => {
  const accessToken = await getYoutubeAccessToken();
  const url = buildYoutubeApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  recordYoutubeApiUsage();

  if (!response.ok) {
    throw new Error(`YouTube API request failed: ${response.status}`);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const putYoutubeApi = async <T>(
  path: string,
  searchParams: Record<string, string>,
  body: unknown,
): Promise<T> => {
  const accessToken = await getYoutubeAccessToken();
  const url = buildYoutubeApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  recordYoutubeApiUsage();

  if (!response.ok) {
    throw new Error(`YouTube API request failed: ${response.status}`);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const deleteYoutubeApi = async (
  path: string,
  searchParams: Record<string, string>,
): Promise<void> => {
  const accessToken = await getYoutubeAccessToken();
  const url = buildYoutubeApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  recordYoutubeApiUsage();

  if (!response.ok) {
    throw new Error(`YouTube API request failed: ${response.status}`);
  }
};
