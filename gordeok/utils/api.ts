import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://frostily-derby-underpass.ngrok-free.dev";

export async function getStoredUserId() {
  const userId =
    (await AsyncStorage.getItem("userId")) ||
    (await AsyncStorage.getItem("memberId")) ||
    (await AsyncStorage.getItem("id"));

  if (!userId) {
    throw new Error("로그인 정보가 없습니다. 다시 로그인해주세요.");
  }

  return userId;
}

async function getOptionalStoredUserId() {
  return (
    (await AsyncStorage.getItem("userId")) ||
    (await AsyncStorage.getItem("memberId")) ||
    (await AsyncStorage.getItem("id"))
  );
}

async function getStoredAccessToken() {
  return (
    (await AsyncStorage.getItem("accessToken")) ||
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("jwt"))
  );
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

function makeQueryString(
  query?: Record<string, string | number | boolean | undefined | null>
) {
  if (!query) return "";

  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return headers as Record<string, string>;
}

function isPlainObjectBody(body: any) {
  if (!body) return false;
  if (typeof body === "string") return false;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer)
    return false;

  return typeof body === "object";
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const queryString = makeQueryString(options.query);
  const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const storedUserId = await getOptionalStoredUserId();
  const accessToken = await getStoredAccessToken();

  const optionHeaders = normalizeHeaders(options.headers);

  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),

    // 백엔드가 어떤 이름으로 받든 잡히게 여러 형태로 같이 보냄
    ...(storedUserId
      ? {
          userId: String(storedUserId),
          "User-Id": String(storedUserId),
          "USER-ID": String(storedUserId),
          "X-USER-ID": String(storedUserId),
          "X-User-Id": String(storedUserId),
          memberId: String(storedUserId),
          "Member-Id": String(storedUserId),
          "X-MEMBER-ID": String(storedUserId),
        }
      : {}),

    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),

    ...optionHeaders,
  };

  const requestBody = isPlainObjectBody(options.body)
    ? JSON.stringify(options.body)
    : options.body;

  console.log("API 요청 URL:", url);
  console.log("API 요청 메서드:", options.method || "GET");
  console.log("API 요청 userId:", storedUserId);
  console.log("API 요청 headers:", headers);
  console.log("API 요청 body:", requestBody);

  const response = await fetch(url, {
    ...options,
    headers,
    body: requestBody,
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