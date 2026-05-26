export type MemberItem = {
    id: number;
    memberName: string;
    price: number;
    status: string;
  };
  
  export type PostListItem = {
    id: number;
    userId: number;
    nickname: string;
    profileImage: string | null;
    idolName: string;
    albumName: string;
    title: string;
    description: string;
    imageUrl: string;
    imageUrls?: string[];
    components: string[];
    shippingFeeType: string;
    status: string;
    viewCount: number;
    scrapCount: number;
    createdAt: string;
    memberItems: MemberItem[];
    almostFull: boolean;
  };
  
  export type PostPageResponse = {
    content: PostListItem[];
    totalPages?: number;
    totalElements?: number;
    number?: number;
    size?: number;
  };
  
  export type CreatePostRequest = {
    title: string;
    description?: string;
    imageUrl?: string;
    idolName: string;
    albumName?: string;
    components?: string[];
    shippingFeeType?: string;
    memberItems: {
      memberName: string;
      price: number;
    }[];
  };
  
  export type CreatePostResponse = {
    postId: number;
    message: string;
  };
  
  export type PostDetailResponse = {
    postId: number;
    title: string;
    description: string;
    imageUrl: string | null;
    idolName: string;
    albumName: string;
    components: string[];
    shippingFeeType: string;
    status: string;
    scrapCount: number;
    seller: {
      sellerId: number;
      nickname: string;
      profileImage: string | null;
      trustScore: number;
    };
    memberItems: MemberItem[];
    bookmarked: boolean;
  };
  
  export type CreateParticipationRequest = {
    realName: string;
    phoneNumber: string;
    storeName: string;
    requestMessage?: string;
  };
  
  export type CreateParticipationResponse = {
    participationId: number;
    chatRoomId: number | null;
    memberStatus: string;
    message: string;
  };
  