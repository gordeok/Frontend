import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://frostily-derby-underpass.ngrok-free.dev";

export async function getStoredUserId() {
  const userId = await AsyncStorage.getItem("userId");

  if (!userId) {
    throw new Error("로그인 정보가 없습니다. 다시 로그인해주세요.");
  }

  return userId;
}

export function getImageUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function unwrapPage<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const queryString = options.query
    ? Object.entries(options.query)
        .filter(
          ([, value]) =>
            value !== undefined && value !== null && value !== ""
        )
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        )
        .join("&")
    : "";

  const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  console.log("API 요청 URL:", url);
  console.log("API 요청 메서드:", options.method || "GET");
  console.log("API 요청 body:", options.body);

  const response = await fetch(url, {
    ...options,
    headers: {
      "ngrok-skip-browser-warning": "true",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  console.log("API 응답 상태:", response.status);
  console.log("API 응답 데이터:", data);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.detail ||
      (typeof data === "string" ? data : null) ||
      `요청에 실패했습니다. (${response.status})`;

    throw new Error(message);
  }

  return data as T;
}