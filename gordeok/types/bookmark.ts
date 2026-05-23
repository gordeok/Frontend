export type BookmarkMemberItem = {
    id: number;
    memberName: string;
    price: number;
    status: string;
  };
  
  export type BookmarkItem = {
    bookmarkId: number;
    postId: number;
    title: string;
    idolName: string;
    albumName: string;
    imageUrl: string | null;
    nickname: string;
    status: string;
    createdAt: string;
    memberItems: BookmarkMemberItem[];
  };
  
  export type ToggleBookmarkResponse = {
    bookmarked: boolean;
    message: string;
  };