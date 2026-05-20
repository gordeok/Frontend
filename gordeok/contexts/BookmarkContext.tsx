import React, { createContext, useContext, useState } from "react";

export type BookmarkPost = {
  id: string;
  title: string;
  sellerName: string;
  groupName?: string;
  postData: string;
  groups?: string;
  members?: string;
};

type BookmarkContextType = {
  bookmarks: BookmarkPost[];
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (post: BookmarkPost) => void;
  removeBookmark: (id: string) => void;
};

const BookmarkContext = createContext<BookmarkContextType | null>(null);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkPost[]>([]);

  const isBookmarked = (id: string) => {
    return bookmarks.some((item) => item.id === id);
  };

  const toggleBookmark = (post: BookmarkPost) => {
    setBookmarks((prev) => {
      const exists = prev.some((item) => item.id === post.id);

      if (exists) {
        return prev.filter((item) => item.id !== post.id);
      }

      return [post, ...prev];
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmark() {
  const context = useContext(BookmarkContext);

  if (!context) {
    throw new Error("useBookmark must be used within BookmarkProvider");
  }

  return context;
}