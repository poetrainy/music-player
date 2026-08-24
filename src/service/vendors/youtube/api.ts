import { redirect } from "next/navigation";
import { auth } from "@/auth";

const API_BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface AccessTokenContext {
  accessToken: string;
  // NOTE: ユーザーごとにキャッシュを分離するためのキー。トークン自体は更新のたびに
  // 値が変わりキャッシュキーとして不安定なため、email を用いる
  userCacheKey: string;
}

export const getAccessTokenContext = async (): Promise<AccessTokenContext> => {
  const session = await auth();

  // NOTE: リフレッシュに失敗したトークンをそのまま送ると 401 を返し続けるため、
  // 検知した時点でサインイン画面へ再誘導する。Server Component のレンダー中にも
  // 呼ばれるため、Cookie を書き換える signOut ではなく redirect を使用する
  if (session?.error === "RefreshAccessTokenError") {
    redirect("/signin");
  }

  return {
    accessToken: session?.accessToken ?? "",
    userCacheKey: session?.user?.email ?? "",
  };
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
  accessToken: string,
  path: string,
  searchParams: Record<string, string>,
): Promise<T> => {
  const url = buildApiUrl(path, searchParams);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const postApi = async <T>(
  accessToken: string,
  path: string,
  searchParams: Record<string, string>,
  body: unknown,
): Promise<T> => {
  const url = buildApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const putApi = async <T>(
  accessToken: string,
  path: string,
  searchParams: Record<string, string>,
  body: unknown,
): Promise<T> => {
  const url = buildApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const data: unknown = await response.json();

  return data as T;
};

export const deleteApi = async (
  accessToken: string,
  path: string,
  searchParams: Record<string, string>,
): Promise<void> => {
  const url = buildApiUrl(path, searchParams);

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    await throwApiError(response);
  }
};
