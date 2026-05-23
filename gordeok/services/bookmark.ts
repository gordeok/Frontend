import { apiRequest } from "../utils/api";

import type {
  BookmarkItem,
  ToggleBookmarkResponse,
} from "../types/bookmark";

const USER_ID = 1;

export async function getBookmarks() {
  return apiRequest<BookmarkItem[]>(`/api/bookmarks?userId=${USER_ID}`);
}

export async function toggleBookmark(postId: number | string) {
  return apiRequest<ToggleBookmarkResponse>(
    `/api/bookmarks/toggle?userId=${USER_ID}&postId=${postId}`,
    {
      method: "POST",
    }
  );
}