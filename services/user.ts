import { apiRequest } from "../utils/api";

import type {
  SaveFavoriteIdolsRequest,
  SaveFavoriteMembersRequest,
} from "../types/user";

const USER_ID = 1;

export async function saveFavoriteIdols(data: SaveFavoriteIdolsRequest) {
  return apiRequest<void>(`/api/users/me/favorite-idols?userId=${USER_ID}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function saveFavoriteMembers(data: SaveFavoriteMembersRequest) {
  return apiRequest<void>(`/api/users/me/favorite-members?userId=${USER_ID}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type MyProfile = {
  userId: number;
  email: string;
  nickname: string;
  profileImage: string | null;
  trustScore: number;
  hasScamReport: boolean;
  createdAt: string;
};

export type TrustScoreDetail = {
  totalScore: number;
  breakdown: {
    transactionCompleteRate: number;
    chatResponseSpeed: number;
    reportCount: number;
  };
};

export async function getMyProfile() {
  return apiRequest<MyProfile>(`/api/users/me?userId=${USER_ID}`);
}

export async function getTrustScore(userId: number) {
  return apiRequest<TrustScoreDetail>(`/api/users/${userId}/trust-score`);
}