export type CreateReviewRequest = {
    reviewerId: number;
    targetUserId: number;
    chatRoomId: number;
    rating: number;
    content: string;
  };
  
  export type CreateReviewResponse = {
    reviewId: number;
    message: string;
  };
  