export type CommunityCategory =
  | "ALL"
  | "PHOTO_EXCHANGE"
  | "OFFLINE_COMPANION"
  | "QUESTION"
  | "FREE";

export type CommunitySort = "latest" | "likes";

export type CommunityPost = {
  postId: number;
  category: CommunityCategory | string;
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

export type CommunityComment = {
  commentId: number;
  userId: number;
  nickname: string;
  profileImage: string | null;
  content: string;
  createdAt: string;
};

export type CommunityDetail = {
  postId: number;
  category: CommunityCategory | string;
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
  comments: CommunityComment[];
};

export type CommunityCreateRequest = {
  category: Exclude<CommunityCategory, "ALL">;
  title: string;
  content: string;
  imageUrls?: string[];
};

export type CommunityCreateResponse = {
  postId: number;
  message: string;
};

export type CreateCommentRequest = {
  content: string;
};

export type CreateCommentResponse = CommunityComment;

export type ToggleLikeResponse = {
  liked: boolean;
  likeCount: number;
  message: string;
};

export type CommunityListResponse = {
  content: CommunityPost[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
};
