export type DivideMemberStatus = "모집중" | "예약중" | "모집완료";

export type DivideMember = {
  id: number;
  name: string;
  price: number;
  status: DivideMemberStatus;
};

export type DividePost = {
  id: number;
  groupId: string;
  groupName: string;
  albumName: string;
  title: string;
  content: string;
  date: string;
  writer: string;
  trustScore: number;
  galleryName: string;
  bookmarkCount: number;
  viewCount: number;
  members: DivideMember[];
  items: string[];
  deliveryMethod: string;
};

export const dividePosts: DividePost[] = [
  {
    id: 1,
    groupId: "aespa",
    groupName: "에스파",
    albumName: "Armageddon - The 1st Album",
    title: "Armageddon - The 1st Album",
    content: "덤 많이 드려여~~~\n텍스트 텍스트 텍스트\n재배송비는 추후 분납 어쩌고저쩌고",
    date: "2025.05.11",
    writer: "사용자 닉네임",
    trustScore: 87,
    galleryName: "거래이력 바로가기",
    bookmarkCount: 11,
    viewCount: 705,
    members: [
      { id: 1, name: "카리나", price: 8000, status: "모집완료" },
      { id: 2, name: "윈터", price: 8000, status: "모집완료" },
      { id: 3, name: "지젤", price: 8000, status: "예약중" },
      { id: 4, name: "닝닝", price: 8000, status: "모집중" },
    ],
    items: ["앨범 본체", "엽서", "포스터"],
    deliveryMethod: "CU 반값택배",
  },
  {
    id: 2,
    groupId: "nct",
    groupName: "NCT",
    albumName: "ISTJ - The 3rd Album",
    title: "ISTJ - The 3rd Album",
    content: "도영 재현 마크 분철합니다.\n배송비는 추후 안내드려요.",
    date: "2025.05.13",
    writer: "분철러버",
    trustScore: 91,
    galleryName: "거래이력 바로가기",
    bookmarkCount: 8,
    viewCount: 421,
    members: [
      { id: 1, name: "도영", price: 9000, status: "모집중" },
      { id: 2, name: "재현", price: 9000, status: "예약중" },
      { id: 3, name: "마크", price: 9000, status: "모집완료" },
      { id: 4, name: "해찬", price: 9000, status: "모집중" },
    ],
    items: ["앨범 본체", "포토카드", "접지 포스터"],
    deliveryMethod: "GS 반값택배",
  },
  {
    id: 3,
    groupId: "txt",
    groupName: "투모로우바이투게더",
    albumName: "The Name Chapter: FREEFALL",
    title: "FREEFALL 앨범 분철",
    content: "포카 위주 분철합니다.\n하자 확인 후 보내드려요.",
    date: "2025.05.15",
    writer: "모아분철",
    trustScore: 79,
    galleryName: "거래이력 바로가기",
    bookmarkCount: 5,
    viewCount: 288,
    members: [
      { id: 1, name: "수빈", price: 8500, status: "모집중" },
      { id: 2, name: "연준", price: 8500, status: "모집완료" },
      { id: 3, name: "범규", price: 8500, status: "예약중" },
      { id: 4, name: "태현", price: 8500, status: "모집중" },
      { id: 5, name: "휴닝카이", price: 8500, status: "모집중" },
    ],
    items: ["앨범 본체", "포토카드", "스티커"],
    deliveryMethod: "일반택배",
  },
];