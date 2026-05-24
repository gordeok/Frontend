const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type ApiRequestOptions = RequestInit & {
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "API 주소가 설정되지 않았습니다. .env의 EXPO_PUBLIC_API_BASE_URL을 확인해주세요."
    );
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "요청 처리 중 오류가 발생했습니다.");
  }

  return data as T;
}