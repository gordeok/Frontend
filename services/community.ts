    import { apiRequest } from "../utils/api";

    export type CommunityCategory =
    | "ALL"
    | "PHOTO_EXCHANGE"
    | "OFFLINE_COMPANION"
    | "QUESTION"
    | "FREE";

    export type CommunityPost = {
    postId: number;
    category: CommunityCategory;
    title: string;
    contentPreview: string;
    imageUrl: string | null;
    authorId: number;
    authorNickname: string;
    authorProfileImage: string | null;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    createdAt: string;
    };

    export type CommunityPostDetail = {
    postId: number;
    category: CommunityCategory;
    title: string;
    content: string;
    imageUrls: string[];
    authorId: number;
    authorNickname: string;
    authorProfileImage: string | null;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    liked: boolean;
    createdAt: string;
    comments: {
        commentId: number;
        userId: number;
        nickname: string;
        profileImage: string | null;
        content: string;
        createdAt: string;
    }[];
    };

    export async function getCommunityPosts(params?: {
    category?: CommunityCategory;
    sort?: "latest" | "likes";
    page?: number;
    size?: number;
    }) {
    const category = params?.category ?? "ALL";
    const sort = params?.sort ?? "latest";
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;

    return apiRequest<{
        content: CommunityPost[];
        totalPages: number;
        totalElements: number;
        number: number;
        size: number;
    }>(
        `/api/community/posts?category=${category}&sort=${sort}&page=${page}&size=${size}`
    );
    }

    export async function getCommunityPostDetail(postId: number, userId?: number) {
    return apiRequest<CommunityPostDetail>(`/api/community/posts/${postId}`, {
        headers: userId ? { "X-USER-ID": String(userId) } : {},
    });
    }

    export async function createCommunityPost(
    userId: number,
    body: {
        category: Exclude<CommunityCategory, "ALL">;
        title: string;
        content: string;
        imageUrls?: string[];
    }
    ) {
    return apiRequest<{ postId: number; message: string }>("/api/community/posts", {
        method: "POST",
        headers: {
        "X-USER-ID": String(userId),
        },
        body: JSON.stringify(body),
    });
    }

    export async function createComment(
    postId: number,
    userId: number,
    content: string
    ) {
    return apiRequest(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
        "X-USER-ID": String(userId),
        },
        body: JSON.stringify({ content }),
    });
    }

    export async function toggleCommunityLike(postId: number, userId: number) {
    return apiRequest<{
        liked: boolean;
        likeCount: number;
        message: string;
    }>(`/api/community/posts/${postId}/likes/toggle`, {
        method: "POST",
        headers: {
        "X-USER-ID": String(userId),
        },
    });
    }