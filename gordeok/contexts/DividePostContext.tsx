import { createContext, useContext, useState, ReactNode } from "react";

type DividePostContextType = {
  posts: any[];
  addPost: (post: any) => void;
};

const DividePostContext = createContext<DividePostContextType | null>(null);

export function DividePostProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<any[]>([]);

  const addPost = (post: any) => {
    setPosts((prev) => [post, ...prev]);
  };

  return (
    <DividePostContext.Provider value={{ posts, addPost }}>
      {children}
    </DividePostContext.Provider>
  );
}

export function useDividePosts() {
  const context = useContext(DividePostContext);
  if (!context) throw new Error("useDividePosts must be used within DividePostProvider");
  return context;
}
