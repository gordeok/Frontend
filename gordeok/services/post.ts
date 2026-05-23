import { apiRequest } from "../utils/api";
import type {
  CreateParticipationRequest,
  CreateParticipationResponse,
  CreatePostRequest,
  CreatePostResponse,
  PostDetailResponse,
  PostListItem,
  PostPageResponse,
} from "../types/post";

const DEFAULT_USER_ID = 1;

export type GetPostsParams = {
  page?: number;
  size?: number;
  keyword?: string;
  idolName?: string;
  sort?: "latest" | "likes" | string;
};

export async function getPosts(params: GetPostsParams = {}) {
  const searchParams = new URLSearchParams();

  searchParams.append("page", String(params.page ?? 0));
  searchParams.append("size", String(params.size ?? 10));
  searchParams.append("sort", params.sort ?? "latest");

  if (params.keyword) searchParams.append("keyword", params.keyword);
  if (params.idolName) searchParams.append("idolName", params.idolName);

  return apiRequest<PostPageResponse | PostListItem[]>(
    `/api/posts?${searchParams.toString()}`
  );
}

export async function getPostDetail(postId: string | number, userId = DEFAULT_USER_ID) {
  return apiRequest<PostDetailResponse>(`/api/posts/${postId}?userId=${userId}`);
}

export async function createPost(data: CreatePostRequest, userId = DEFAULT_USER_ID) {
  return apiRequest<CreatePostResponse>(`/api/posts?userId=${userId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function reserveMemberItem(memberItemId: string | number, buyerId = DEFAULT_USER_ID) {
  return apiRequest<void>(`/api/member-items/${memberItemId}/reserve?buyerId=${buyerId}`, {
    method: "POST",
  });
}

export async function createParticipation(
  postId: string | number,
  memberItemId: string | number,
  data: CreateParticipationRequest,
  userId = DEFAULT_USER_ID
) {
  return apiRequest<CreateParticipationResponse>(
    `/api/posts/${postId}/members/${memberItemId}/participations?userId=${userId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}
