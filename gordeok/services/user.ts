import { apiRequest } from "../utils/api";

import type {
  SaveFavoriteIdolsRequest,
  SaveFavoriteMembersRequest,
} from "../types/user";

const USER_ID = 1;

export async function saveFavoriteIdols(data: SaveFavoriteIdolsRequest) {
  return apiRequest<void>(`/api/users/me/favorite-idols?userId=${USER_ID}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function saveFavoriteMembers(data: SaveFavoriteMembersRequest) {
  return apiRequest<void>(`/api/users/me/favorite-members?userId=${USER_ID}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
