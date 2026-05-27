import { apiRequest, getStoredUserId, unwrapPage } from "../utils/api";

export type MyProfile = {
  userId: number;
  email: string;
  nickname: string;
  profileImage?: string | null;
  trustScore: number;
  hasScamReport: boolean;
  createdAt: string;
};

export type TrustScoreDetail = {
  totalScore: number;
  breakdown?: {
    transactionCompleteRate?: number;
    chatResponseSpeed?: number;
    reportCount?: number;
  };
};

export type MyPurchase = {
  participationId: number;
  postId: number;
  postTitle: string;
  memberName: string;
  thumbnailUrl?: string | null;
  postStatus: string;
  canWriteReview: boolean;
  createdAt: string;
};

export type MySale = {
  postId: number;
  postTitle: string;
  thumbnailUrl?: string | null;
  postStatus: string;
  participantCount: number;
  createdAt: string;
};

export type MyCommunityPost = {
  postId: number;
  category: string;
  title: string;
  preview: string;
  createdAt: string;
};

export type MyCommunityCommentPost = {
  postId: number;
  category: string;
  title: string;
  preview?: string;
  contentPreview?: string;
  commentContent?: string;
  createdAt: string;
};

export type MyReview = {
  reviewId: number;
  reviewerId: number;
  reviewerNickname: string;
  reviewerProfileImage?: string | null;
  rating: number;
  content: string;
  createdAt: string;
};

export type FavoriteIdol = {
  id: number;
  name: string;
  code: string;
};

export type FavoriteMember = {
  id: number;
  idolId: number;
  name: string;
};

export async function getMyProfile() {
  const userId = await getStoredUserId();

  return apiRequest<MyProfile>("/api/users/me", {
    method: "GET",
    query: { userId },
  });
}

export async function getTrustScore(userId: number | string) {
  return apiRequest<TrustScoreDetail>(`/api/users/${userId}/trust-score`, {
    method: "GET",
  });
}

export async function getMyPurchases(
  status: "OPEN" | "COMPLETED" = "OPEN",
  page = 0,
  size = 20
) {
  const userId = await getStoredUserId();

  const data = await apiRequest<any>("/api/users/me/purchases", {
    method: "GET",
    query: { userId, status, page, size },
  });

  return unwrapPage<MyPurchase>(data);
}

export async function getMySales(
  status: "OPEN" | "COMPLETED" = "OPEN",
  page = 0,
  size = 20
) {
  const userId = await getStoredUserId();

  const data = await apiRequest<any>("/api/users/me/sales", {
    method: "GET",
    query: { userId, status, page, size },
  });

  return unwrapPage<MySale>(data);
}

export async function getMyCommunityPosts(page = 0, size = 20) {
  const userId = await getStoredUserId();

  const data = await apiRequest<any>("/api/users/me/community-posts", {
    method: "GET",
    query: { userId, page, size },
  });

  return unwrapPage<MyCommunityPost>(data);
}

export async function getMyCommunityCommentPosts(page = 0, size = 20) {
  const userId = await getStoredUserId();

  const data = await apiRequest<any>("/api/users/me/community-comments", {
    method: "GET",
    query: { userId, page, size },
  });

  return unwrapPage<MyCommunityCommentPost>(data);
}

export async function getMyReviews(page = 0, size = 20) {
  const userId = await getStoredUserId();

  const data = await apiRequest<any>("/api/users/me/reviews", {
    method: "GET",
    query: { userId, page, size },
  });

  return unwrapPage<MyReview>(data);
}

export async function getFavoriteIdols() {
  const userId = await getStoredUserId();

  try {
    return await apiRequest<FavoriteIdol[]>("/api/users/me/favorite-idols", {
      method: "GET",
      query: { userId },
    });
  } catch (error) {
    console.log("저장된 최애 그룹 조회 실패, 빈 배열로 처리:", error);
    return [];
  }
}

export async function saveFavoriteIdols(idolIds: number[]) {
  const userId = await getStoredUserId();

  return apiRequest<void>("/api/users/me/favorite-idols", {
    method: "POST",
    query: { userId },
    body: JSON.stringify({ idolIds }),
  });
}

export async function getFavoriteMembers() {
  const userId = await getStoredUserId();

  try {
    return await apiRequest<FavoriteMember[]>("/api/users/me/favorite-members", {
      method: "GET",
      query: { userId },
    });
  } catch (error) {
    console.log("저장된 최애 멤버 조회 실패, 빈 배열로 처리:", error);
    return [];
  }
}

export async function saveFavoriteMembers(memberIds: number[]) {
  const userId = await getStoredUserId();

  return apiRequest<void>("/api/users/me/favorite-members", {
    method: "POST",
    query: { userId },
    body: JSON.stringify({ memberIds }),
  });
}

export async function uploadProfileImage(imageUri: string): Promise<string> {
  const userId = await getStoredUserId();
  const apiBase = (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://172.20.99.65:8080"
  ).replace(/\/$/, "");

  const ext = imageUri.toLowerCase().endsWith(".png") ? "png"
    : imageUri.toLowerCase().endsWith(".webp") ? "webp"
    : "jpeg";
  const mimeType = `image/${ext}`;
  const fileName = `profile-image.${ext}`;

  const formData = new FormData();
  formData.append("image", { uri: imageUri, name: fileName, type: mimeType } as any);

  const response = await fetch(`${apiBase}/api/users/upload-profile-image?userId=${userId}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
  });

  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!response.ok) {
    throw new Error(data?.message || "프로필 이미지 업로드 실패");
  }

  const imageUrl: string =
    data?.imageUrl ?? data?.profileImage ?? data?.url ?? data?.image ?? "";
  return imageUrl;
}

export async function updateProfile(params: { nickname?: string; profileImage?: string }) {
  const userId = await getStoredUserId();

  return apiRequest<MyProfile>("/api/users/me", {
    method: "PATCH",
    query: { userId },
    body: JSON.stringify(params),
  });
}