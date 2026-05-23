import { apiRequest } from "../utils/api";
import type { SellerProfileResponse } from "../types/seller";

export async function getSellerProfile(userId: number | string) {
  return apiRequest<SellerProfileResponse>(`/api/users/${userId}/profile`);
}
