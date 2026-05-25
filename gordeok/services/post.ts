import { apiRequest, getStoredUserId } from "../utils/api";
import type {
  CreateParticipationRequest,
  CreateParticipationResponse,
  CreatePostRequest,
  CreatePostResponse,
  PostDetailResponse,
  PostListItem,
  PostPageResponse,
} from "../types/post";

export type GetPostsParams = {
  page?: number;
  size?: number;
  keyword?: string;
  idolName?: string;
  sort?: "latest" | "likes" | string;
};

export async function getPosts(params: GetPostsParams = {}) {
  return apiRequest<PostPageResponse | PostListItem[]>("/api/posts", {
    method: "GET",
    query: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? "latest",
      keyword: params.keyword,
      idolName: params.idolName,
    },
  });
}

export async function getPostDetail(postId: string | number) {
  let userId: string | null = null;

  try {
    userId = await getStoredUserId();
  } catch {
    userId = null;
  }

  return apiRequest<PostDetailResponse>(`/api/posts/${postId}`, {
    method: "GET",
    query: userId ? { userId } : undefined,
  });
}

export async function createPost(data: CreatePostRequest) {
  const userId = await getStoredUserId();

  return apiRequest<CreatePostResponse>("/api/posts", {
    method: "POST",
    query: { userId },
    body: JSON.stringify(data),
  });
}

export async function reserveMemberItem(memberItemId: string | number) {
  const buyerId = await getStoredUserId();

  return apiRequest<void>(`/api/member-items/${memberItemId}/reserve`, {
    method: "POST",
    query: { buyerId },
  });
}

export async function createParticipation(
  postId: string | number,
  memberItemId: string | number,
  data: CreateParticipationRequest
) {
  const userId = await getStoredUserId();

  const body = {
    realName: data.realName,
    phoneNumber: data.phoneNumber,
    storeName: data.storeName,
    requestMessage: data.requestMessage ?? "",
  };

  console.log("참여글 작성 API 요청:", {
    postId,
    memberItemId,
    userId,
    body,
  });

  return apiRequest<CreateParticipationResponse>(
    `/api/posts/${postId}/members/${memberItemId}/participations`,
    {
      method: "POST",
      query: { userId },
      body: JSON.stringify(body),
    }
  );
}

export async function cancelMemberItem(memberItemId: string | number) {
  const buyerId = await getStoredUserId();

  return apiRequest<void>(`/api/member-items/${memberItemId}/cancel`, {
    method: "PATCH",
    query: { buyerId },
  });
}