import { apiRequest, getStoredUserId } from "../utils/api";
import type { BookmarkItem } from "../types/bookmark";

export async function getBookmarks() {
  const userId = await getStoredUserId();

  return apiRequest<BookmarkItem[]>("/api/bookmarks", {
    method: "GET",
    query: { userId },
  });
}

export async function checkBookmark(postId: number | string) {
  const userId = await getStoredUserId();

  return apiRequest<{ bookmarked: boolean }>("/api/bookmarks/check", {
    method: "GET",
    query: {
      userId,
      postId,
    },
  });
}

export async function toggleBookmark(postId: number | string) {
  const userId = await getStoredUserId();

  return apiRequest<{ bookmarked: boolean; message: string }>(
    "/api/bookmarks/toggle",
    {
      method: "POST",
      query: {
        userId,
        postId,
      },
    }
  );
}