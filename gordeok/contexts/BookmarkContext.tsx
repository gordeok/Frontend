import { createContext, useContext, useState, ReactNode } from "react";

type BookmarkContextType = {
  bookmarkedIds: string[];
  toggleBookmark: (id: string) => void;
};

const BookmarkContext = createContext<BookmarkContextType | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  return (
    <BookmarkContext.Provider value={{ bookmarkedIds, toggleBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmark() {
  const context = useContext(BookmarkContext);
  if (!context) throw new Error("useBookmark must be used within BookmarkProvider");
  return context;
}
