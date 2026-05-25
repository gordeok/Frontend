import { apiRequest } from "../utils/api";
import type {
  CommunityCategory,
  CommunityComment,
  CommunityCreateRequest,
  CommunityCreateResponse,
  CommunityDetail,
  CommunityListResponse,
  CommunityPost,
  CommunitySort,
  CreateCommentRequest,
  CreateCommentResponse,
  ToggleLikeResponse,
} from "../types/community";

const USER_ID = 1;

export type { CommunityCategory, CommunityPost, CommunityDetail, CommunityComment };

type GetCommunityPostsParams = {
  category?: CommunityCategory;
  sort?: CommunitySort;
  page?: number;
  size?: number;
};

export async function getCommunityPosts(params: GetCommunityPostsParams = {}) {
  const searchParams = new URLSearchParams();

  searchParams.append("category", params.category ?? "ALL");
  searchParams.append("sort", params.sort ?? "latest");
  searchParams.append("page", String(params.page ?? 0));
  searchParams.append("size", String(params.size ?? 10));

  return apiRequest<CommunityListResponse>(
    `/api/community/posts?${searchParams.toString()}`
  );
}

export async function getCommunityPost(postId: number | string) {
  return apiRequest<CommunityDetail>(`/api/community/posts/${postId}`, {
    headers: {
      "X-USER-ID": String(USER_ID),
    },
  });
}

export async function createCommunityPost(data: CommunityCreateRequest) {
  return apiRequest<CommunityCreateResponse>("/api/community/posts", {
    method: "POST",
    headers: {
      "X-USER-ID": String(USER_ID),
    },
    body: JSON.stringify(data),
  });
}

export async function createCommunityComment(
  postId: number | string,
  data: CreateCommentRequest
) {
  return apiRequest<CreateCommentResponse>(
    `/api/community/posts/${postId}/comments`,
    {
      method: "POST",
      headers: {
        "X-USER-ID": String(USER_ID),
      },
      body: JSON.stringify(data),
    }
  );
}

export async function toggleCommunityLike(postId: number | string) {
  return apiRequest<ToggleLikeResponse>(
    `/api/community/posts/${postId}/likes/toggle`,
    {
      method: "POST",
      headers: {
        "X-USER-ID": String(USER_ID),
      },
    }
  );
}
