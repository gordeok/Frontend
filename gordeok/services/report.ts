import type { CreateReportData, CreateReportResponse } from "../types/report";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const REPORTER_ID = 1;

export async function createReport(
  data: CreateReportData
): Promise<CreateReportResponse> {
  if (!API_URL) {
    throw new Error("API 주소가 설정되지 않았습니다.");
  }

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
    `${API_URL}/api/reports?reporterId=${REPORTER_ID}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.message || "신고 등록 실패");
  }

  return result as CreateReportResponse;
}