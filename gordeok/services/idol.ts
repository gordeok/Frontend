import { apiRequest } from "../utils/api";
import type { Idol, IdolMember } from "../types/idol";

export async function getIdols(keyword?: string) {
  const searchParams = new URLSearchParams();

  if (keyword?.trim()) {
    searchParams.append("keyword", keyword.trim());
  }

  const query = searchParams.toString();

  return apiRequest<Idol[]>(`/api/idols${query ? `?${query}` : ""}`);
}

export async function getIdolMembers(idolId: number | string) {
  return apiRequest<IdolMember[]>(`/api/idols/${idolId}/members`);
}
