export type BookmarkMemberItem = {
  memberItemId?: number;
  memberName: string;
  price?: number;
  status: string;
};

export type BookmarkItem = {
  bookmarkId: number;
  postId: number;
  title: string;
  idolName: string;
  albumName?: string;
  imageUrl?: string;
  nickname: string;
  status: string;
  createdAt: string;
  memberItems?: BookmarkMemberItem[];
};
