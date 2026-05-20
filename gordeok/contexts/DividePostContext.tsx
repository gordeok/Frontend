import { createContext, ReactNode, useContext, useState } from "react";

export type DivideMemberStatus = "모집중" | "예약중" | "모집완료";

export type DivideMember = {
  id: number;
  name: string;
  initial?: string;
  price: number;
  status: DivideMemberStatus;
};

export type DividePost = {
  id: number;
  groupId?: string;
  groupName: string;
  title: string;
  albumName?: string;
  deliveryMethod: "GS" | "CU";
  members: DivideMember[];
  components: string[];
  content: string;
  photoCount: number;
  createdAt: string;
  createdDate?: string;
};

type DividePostContextType = {
  posts: DividePost[];
  addPost: (post: Omit<DividePost, "id" | "createdAt">) => DividePost;
};

const DividePostContext = createContext<DividePostContextType | null>(null);

export function DividePostProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<DividePost[]>([]);

  const addPost = (post: Omit<DividePost, "id" | "createdAt">) => {
    const newPost: DividePost = {
      ...post,
      id: Date.now(),
      createdAt: "방금 전",
    };

    setPosts((prev) => [newPost, ...prev]);

    return newPost;
  };

  return (
    <DividePostContext.Provider value={{ posts, addPost }}>
      {children}
    </DividePostContext.Provider>
  );
}

export function useDividePosts() {
  const context = useContext(DividePostContext);

  if (!context) {
    throw new Error("useDividePosts must be used within DividePostProvider");
  }

  return context;
}