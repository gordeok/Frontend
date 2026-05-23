export type SellerProfileResponse = {
    userId: number;
    nickname: string;
    profileImage: string | null;
    trustScore: number;
    hasScamReport: boolean;
    createdAt: string;
  };
  