import { apiRequest } from "../utils/api";
import type { CreateReviewRequest, CreateReviewResponse } from "../types/review";

const USER_ID = 1;

export async function createReview(data: Omit<CreateReviewRequest, "reviewerId">) {
  return apiRequest<CreateReviewResponse>("/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewerId: USER_ID,
      ...data,
    }),
  });
}
