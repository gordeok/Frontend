import { API_BASE_URL, getStoredUserId } from "../utils/api";
import type { CreateReportData, CreateReportResponse } from "../types/report";

export async function createReport(
  data: CreateReportData
): Promise<CreateReportResponse> {
  const reporterId = await getStoredUserId();

  const formData = new FormData();

  const reportData = {
    targetUserId: data.targetUserId,
    postId: data.postId,
    reason: data.reason,
    content: data.content ?? "",
  };

  formData.append("data", {
    uri: `data:application/json,${encodeURIComponent(
      JSON.stringify(reportData)
    )}`,
    name: "data.json",
    type: "application/json",
  } as any);

  data.images?.forEach((image, index) => {
    formData.append("images", {
      uri: image.uri,
      name: image.name ?? `report-image-${index}.jpg`,
      type: image.type ?? "image/jpeg",
    } as any);
  });

  const response = await fetch(
    `${API_BASE_URL}/api/reports?reporterId=${reporterId}`,
    {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      body: formData,
    }
  );

  const text = await response.text();

  let result: any = null;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = text;
  }

  if (!response.ok) {
    throw new Error(result?.message || "신고 등록 실패");
  }

  return result as CreateReportResponse;
}