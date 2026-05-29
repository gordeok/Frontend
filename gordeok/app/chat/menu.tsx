// 채팅방 메뉴

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { completeChatRoom } from "../../services/chat";
import { getMyProfile } from "../../services/user";
import { apiRequest, getStoredUserId } from "../../utils/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.52;

const DEFAULT_PROFILE = require("../../assets/img/profile.jpg");

const LOCAL_CHAT_ROOMS_KEY = "localChatRooms";
const REMOVED_CHAT_ROOMS_KEY = "GO_REUDEOK_REMOVED_CHAT_ROOMS";
const TRADE_STATUS_STORAGE_KEY = "GO_REUDEOK_CHAT_TRADE_STATUS";
const CHAT_ROOM_LINKED_POST_STORAGE_KEY = "GO_REUDEOK_CHAT_ROOM_LINKED_POSTS";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://172.20.99.65:8080"
).replace(/\/$/, "");

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray700: "#666666",
  gray500: "#999999",
  gray100: "#F8F8F8",
  yellow: "#F7C94B",
  green: "#DDF7EB",
  greenText: "#24A466",
  blue: "#E7F4FF",
  blueText: "#2383C4",
  red: "#D94A4A",
  line: "#EFEFEF",
};

type TradeStatus =
  | "모집 중"
  | "모집 완료"
  | "배송 중"
  | "거래 완료"
  | "거래 취소";

type Member = {
  id: string;
  nickname: string;
  member: string;
  initial: string;
  color: string;
  initialColor: string;
  profileImageUrl?: string;
  isSeller?: boolean;
  receiver?: string;
  phone?: string;
  store?: string;
  request?: string;
  userId?: string;
  role?: string;
};

type MenuParticipant = {
  userId?: string | number;
  nickname?: string;
  memberName?: string;
  role?: string;
  profileImage?: string;
  profileImageUrl?: string;
  profileImg?: string;
  userProfileImage?: string;
  authorProfileImage?: string;
  sellerProfileImage?: string;
  buyerProfileImage?: string;
  imageUrl?: string;
  image?: string;
  photoUrl?: string;
  thumbnailUrl?: string;
};

type LocalChatRoom = {
  id: string;
  type?: string;
  chatRoomType?: string;
  roomType?: string;
  title?: string;
  status?: string;
  postStatus?: string;
  sellerName?: string;
  buyerName?: string;
  selectedMember?: string;
  totalMemberCount?: number;
  completedMemberCount?: number;
  allMembersCompleted?: boolean;
  postId?: string | number;
  postsId?: string | number;
  communityId?: string | number;
  communityPostId?: string | number;
  thumbnailUrl?: string;
  albumImageUrl?: string;
  postImageUrl?: string;
  imageUrl?: string;
  image?: string;
  imageUrls?: any[];
  images?: any[];
  post?: any;
  dividePost?: any;
  participants?: MenuParticipant[];
};

type ChatRoomMenuInfo = {
  chatRoomId?: string | number;
  title?: string;
  postTitle?: string;
  communityTitle?: string;
  roomName?: string;
  chatRoomTitle?: string;
  postStatus?: string;
  status?: string;
  myRole?: string;
  postId?: string | number;
  postsId?: string | number;
  id?: string | number;
  communityId?: string | number;
  communityPostId?: string | number;
  thumbnailUrl?: string;
  albumImageUrl?: string;
  postImageUrl?: string;
  imageUrl?: string;
  image?: string;
  imageUrls?: any[];
  images?: any[];
  post?: {
    postId?: string | number;
    postsId?: string | number;
    id?: string | number;
    communityId?: string | number;
    thumbnailUrl?: string;
    albumImageUrl?: string;
    postImageUrl?: string;
    imageUrl?: string;
    image?: string;
    imageUrls?: any[];
    images?: any[];
  };
  dividePost?: any;
  participants?: MenuParticipant[];
};

type BuyerInfoResponse = {
  nickname?: string;
  memberName?: string;
  realName?: string;
  phoneNumber?: string;
  storeName?: string;
  requestMessage?: string;
  profileImage?: string;
  profileImageUrl?: string;
  profileImg?: string;
  userProfileImage?: string;
  imageUrl?: string;
  image?: string;
};

function normalizeImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmed = String(url).trim();

  if (!trimmed) return "";

  if (trimmed.startsWith("http://localhost:8080")) {
    return trimmed.replace("http://localhost:8080", API_BASE_URL);
  }

  if (trimmed.startsWith("https://localhost:8080")) {
    return trimmed.replace("https://localhost:8080", API_BASE_URL);
  }

  if (trimmed.startsWith("http://127.0.0.1:8080")) {
    return trimmed.replace("http://127.0.0.1:8080", API_BASE_URL);
  }

  if (trimmed.startsWith("https://127.0.0.1:8080")) {
    return trimmed.replace("https://127.0.0.1:8080", API_BASE_URL);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`;
  }

  return `${API_BASE_URL}/${trimmed}`;
}

function getFirstImageFromArray(value: any) {
  if (!Array.isArray(value)) return "";

  const first = value.find((item) => {
    if (typeof item === "string") return item.trim().length > 0;

    return (
      item?.imageUrl ||
      item?.url ||
      item?.thumbnailUrl ||
      item?.albumImageUrl ||
      item?.postImageUrl ||
      item?.image
    );
  });

  if (!first) return "";

  if (typeof first === "string") return first;

  return (
    first?.imageUrl ||
    first?.url ||
    first?.thumbnailUrl ||
    first?.albumImageUrl ||
    first?.postImageUrl ||
    first?.image ||
    ""
  );
}

function getAlbumImageUrl(...sources: any[]) {
  for (const source of sources) {
    const raw =
      source?.thumbnailUrl ||
      source?.albumImageUrl ||
      source?.postImageUrl ||
      source?.imageUrl ||
      source?.image ||
      getFirstImageFromArray(source?.imageUrls) ||
      getFirstImageFromArray(source?.images) ||
      source?.post?.thumbnailUrl ||
      source?.post?.albumImageUrl ||
      source?.post?.postImageUrl ||
      source?.post?.imageUrl ||
      source?.post?.image ||
      getFirstImageFromArray(source?.post?.imageUrls) ||
      getFirstImageFromArray(source?.post?.images) ||
      source?.dividePost?.thumbnailUrl ||
      source?.dividePost?.albumImageUrl ||
      source?.dividePost?.postImageUrl ||
      source?.dividePost?.imageUrl ||
      source?.dividePost?.image ||
      getFirstImageFromArray(source?.dividePost?.imageUrls) ||
      getFirstImageFromArray(source?.dividePost?.images);

    const normalized = normalizeImageUrl(raw);

    if (normalized) return normalized;
  }

  return "";
}

function getProfileImageUrl(...sources: any[]) {
  for (const source of sources) {
    const raw =
      source?.profileImage ||
      source?.profileImageUrl ||
      source?.profileImg ||
      source?.userProfileImage ||
      source?.authorProfileImage ||
      source?.sellerProfileImage ||
      source?.buyerProfileImage ||
      source?.imageUrl ||
      source?.image ||
      source?.photoUrl ||
      source?.thumbnailUrl;

    const normalized = normalizeImageUrl(raw);

    if (normalized) return normalized;
  }

  return "";
}

async function fetchUserProfile(userId: string | number) {
  try {
    return await apiRequest<any>(`/api/users/${userId}/profile`, {
      method: "GET",
    });
  } catch (error) {
    console.log(`메뉴 user ${userId} 프로필 조회 실패:`, error);
    return null;
  }
}

async function fetchPostDetail(postId: string | number) {
  try {
    return await apiRequest<any>(`/api/posts/${postId}`, {
      method: "GET",
    });
  } catch (error) {
    console.log(`메뉴 post ${postId} 이미지 조회 실패:`, error);
    return null;
  }
}

function getPageContent<T>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function normalizeTitleForSearch(value?: string | null) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/앨범/g, "")
    .replace(/EP/g, "")
    .replace(/ep/g, "")
    .replace(/분철합니다/g, "분철")
    .replace(/분철해요/g, "분철")
    .replace(/분철합니다\./g, "분철")
    .replace(/해요/g, "")
    .replace(/합니다/g, "")
    .replace(/[~!！?？.。,_\-–—]/g, "")
    .toLowerCase();
}

function getPostIdFromAny(post: any) {
  const idValue =
    post?.postId ??
    post?.id ??
    post?.postsId ??
    post?.post?.postId ??
    post?.post?.id ??
    post?.dividePost?.postId ??
    post?.dividePost?.id ??
    "";

  return String(idValue ?? "").trim();
}

async function findDividePostByMenuTitle(menu: any, localRoom?: any) {
  try {
    const targetTitle = String(
      menu?.title ||
        menu?.postTitle ||
        menu?.roomName ||
        menu?.chatRoomTitle ||
        localRoom?.title ||
        ""
    ).trim();

    if (!targetTitle) return null;

    const postsRes = await apiRequest<any>("/api/posts", {
      method: "GET",
      query: {
        page: 0,
        size: 300,
        sort: "latest",
      },
    });

    const posts = getPageContent<any>(postsRes);
    const normalizedTargetTitle = normalizeTitleForSearch(targetTitle);
    const targetImage = normalizeImageUrl(getAlbumImageUrl(menu, localRoom));

    const found = posts.find((post: any) => {
      const normalizedPostTitle = normalizeTitleForSearch(post?.title);
      const postImage = normalizeImageUrl(getAlbumImageUrl(post));

      const titleMatched =
        !!normalizedTargetTitle &&
        !!normalizedPostTitle &&
        (normalizedPostTitle === normalizedTargetTitle ||
          normalizedPostTitle.includes(normalizedTargetTitle) ||
          normalizedTargetTitle.includes(normalizedPostTitle));

      const imageMatched = !!targetImage && !!postImage && targetImage === postImage;

      return titleMatched || imageMatched;
    });

    const foundId = getPostIdFromAny(found);

    console.log("메뉴 분철 게시글 제목 역조회:", {
      targetTitle,
      normalizedTargetTitle,
      foundId,
      foundTitle: found?.title,
      postsCount: posts.length,
    });

    if (!foundId) return null;

    return {
      postId: foundId,
      post: found,
    };
  } catch (error) {
    console.log("메뉴 분철 게시글 제목 역조회 실패:", error);
    return null;
  }
}

async function readJsonMap(key: string) {
  try {
    const saved = await AsyncStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : {};

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (error) {
    console.log(`${key} 불러오기 실패:`, error);
    return {};
  }
}

async function saveCompletedStatusToStorage(chatRoomId: string) {
  try {
    const map = await readJsonMap(TRADE_STATUS_STORAGE_KEY);
    map[String(chatRoomId)] = "거래 완료";
    await AsyncStorage.setItem(TRADE_STATUS_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.log("거래 완료 상태 저장 실패:", error);
  }
}

async function updateLocalRoomAsCompleted(chatRoomId: string) {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CHAT_ROOMS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return;

    const nextRooms = parsed.map((room: any) => {
      const roomId = String(room?.id ?? room?.chatRoomId ?? room?.roomId ?? "");

      if (roomId !== String(chatRoomId)) return room;

      return {
        ...room,
        status: "done",
        postStatus: "거래 완료",
        tradeStatus: "거래 완료",
        lastMessage: "거래가 완료되었습니다.",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };
    });

    await AsyncStorage.setItem(LOCAL_CHAT_ROOMS_KEY, JSON.stringify(nextRooms));
  } catch (error) {
    console.log("로컬 채팅방 거래 완료 반영 실패:", error);
  }
}

export default function ChatMenuScreen() {
  const {
    chatRoomId,
    role,
    title,
    type,
    status,
    reviewSubmitted,
    opponentName,
    sellerName,
    buyerName,
    myNickname,
    currentUserNickname,
    selectedMember,
    receiverName,
    phoneNumber,
    storeName,
    requestMessage,
    postStatus,
    allMembersCompleted,
    totalMemberCount,
    completedMemberCount,
    postId,
    postsId,
    id,
    communityId,
    dividePostId,
    linkedPostId,
  } = useLocalSearchParams<{
    chatRoomId?: string;
    role?: string;
    title?: string;
    type?: string;
    status?: string;
    reviewSubmitted?: string;
    opponentName?: string;
    sellerName?: string;
    buyerName?: string;
    myNickname?: string;
    currentUserNickname?: string;
    selectedMember?: string;
    receiverName?: string;
    phoneNumber?: string;
    storeName?: string;
    requestMessage?: string;
    postStatus?: string;
    allMembersCompleted?: string;
    totalMemberCount?: string;
    completedMemberCount?: string;
    postId?: string;
    postsId?: string;
    id?: string;
    communityId?: string;
    dividePostId?: string;
    linkedPostId?: string;
  }>();

  const [localRoom, setLocalRoom] = useState<LocalChatRoom | null>(null);
  const [menuInfo, setMenuInfo] = useState<ChatRoomMenuInfo | null>(null);
  const [menuParticipants, setMenuParticipants] = useState<MenuParticipant[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [, setIsMenuLoaded] = useState(false);
  const [fetchedAlbumImageUrl, setFetchedAlbumImageUrl] = useState("");
  const [fetchedSelfProfileImg, setFetchedSelfProfileImg] = useState("");
  const [fetchedPostId, setFetchedPostId] = useState("");
  const [linkedDividePostId, setLinkedDividePostId] = useState("");
  const [linkedCommunityPostId, setLinkedCommunityPostId] = useState("");
  const [fetchedBuyerMemberName, setFetchedBuyerMemberName] = useState("");
  const [fetchedTotalMemberCount, setFetchedTotalMemberCount] = useState(0);


  useEffect(() => {
    const loadLocalRoom = async () => {
      try {
        if (!chatRoomId) return;

        const raw = await AsyncStorage.getItem(LOCAL_CHAT_ROOMS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const found = Array.isArray(parsed)
          ? parsed.find(
              (room) =>
                String(room.id ?? room.chatRoomId ?? room.roomId) ===
                String(chatRoomId)
            )
          : null;

        setLocalRoom(found ?? null);
      } catch (error) {
        console.log("로컬 채팅방 정보 불러오기 실패:", error);
        setLocalRoom(null);
      }
    };

    loadLocalRoom();
  }, [chatRoomId]);

  const fetchChatRoomMenuInfo = async (roomId: string, userId: string) => {
    const data = await apiRequest<ChatRoomMenuInfo>(
      `/api/chat-rooms/${roomId}/menu?userId=${userId}`,
      { method: "GET" }
    );
    console.log("채팅 메뉴 RAW 응답 (apiRequest):", JSON.stringify(data));
    return data;
  };

  const fetchBuyerInfo = async (buyerUserId: string) => {
    if (!chatRoomId) return null;
    const data = await apiRequest<BuyerInfoResponse>(
      `/api/chat-rooms/${chatRoomId}/participants/${buyerUserId}/info`,
      { method: "GET" }
    );
    return data;
  };

  useEffect(() => {
    const loadMenuInfo = async () => {
      try {
        if (!chatRoomId) return;

        const storedUserId = await getStoredUserId();

        if (!storedUserId) {
          setIsMenuLoaded(true);
          return;
        }

        setCurrentUserId(String(storedUserId));

        // 현재 사용자(개설자/본인) 프로필 이미지 별도 조회 (/api/users/me 사용)
        try {
          const selfProfile = await getMyProfile();
          console.log("메뉴 본인 프로필 응답:", selfProfile);
          const selfImg = getProfileImageUrl(selfProfile);
          console.log("메뉴 본인 프로필 이미지:", selfImg);
          if (selfImg) setFetchedSelfProfileImg(selfImg);
        } catch (selfProfileError) {
          console.log("메뉴 본인 프로필 조회 실패:", selfProfileError);
        }

        const menu = await fetchChatRoomMenuInfo(String(chatRoomId), String(storedUserId));
        const participants = Array.isArray(menu?.participants)
          ? menu.participants
          : [];

        console.log("채팅 메뉴 응답:", menu);
        console.log("채팅 메뉴 앨범 이미지:", getAlbumImageUrl(menu, localRoom));
        console.log("채팅 메뉴 참여자 이미지:", participants);

        // 프로필 이미지 + 멤버 이름 없는 참여자는 API에서 별도로 가져옴
        const enrichedParticipants = await Promise.all(
          participants.map(async (p: MenuParticipant) => {
            const roleText = String(p.role ?? "").toUpperCase();
            const isBuyerParticipant = roleText === "BUYER";
            let enriched = { ...p };

            // 프로필 이미지 없으면 유저 API에서 가져옴
            if (!getProfileImageUrl(p) && p.userId) {
              const profile = await fetchUserProfile(p.userId);
              if (profile) {
                enriched.profileImageUrl = getProfileImageUrl(profile) || undefined;
              }
            }

            if (isBuyerParticipant && !String(p.memberName ?? "").trim() && p.userId && chatRoomId) {
              try {
                const buyerInfo = await apiRequest<BuyerInfoResponse>(
                  `/api/chat-rooms/${chatRoomId}/participants/${p.userId}/info`,
                  { method: "GET" }
                );
                if (buyerInfo?.memberName) {
                  enriched.memberName = buyerInfo.memberName;
                  console.log("메뉴 구매자 멤버 이름 조회 성공:", buyerInfo.memberName);
                }
              } catch {
              }
            }

            return enriched;
          })
        );

        setMenuInfo(menu);
        setMenuParticipants(enrichedParticipants);

        // 구매자 멤버 이름 — enriched participants에서 추출
        const buyerParticipant = enrichedParticipants.find(
          (p) => String(p.role ?? "").toUpperCase() === "BUYER"
        );
        const buyerMemberNameFromApi = String(buyerParticipant?.memberName ?? "").trim();
        if (buyerMemberNameFromApi) setFetchedBuyerMemberName(buyerMemberNameFromApi);

        const mAny = menu as any;
        const roomTypeText = String(type ?? localRoom?.type ?? localRoom?.chatRoomType ?? "")
          .trim()
          .toLowerCase();
        const isDirectRoom = roomTypeText === "note" || roomTypeText === "direct";

        let initialAlbum = getAlbumImageUrl(menu, localRoom);
        let foundDividePostByTitle: { postId: string; post: any } | null = null;

        if (!isDirectRoom) {
          foundDividePostByTitle = await findDividePostByMenuTitle(menu, localRoom);

          if (!initialAlbum && foundDividePostByTitle?.post) {
            const foundImage = getAlbumImageUrl(foundDividePostByTitle.post);

            if (foundImage) {
              initialAlbum = foundImage;
              console.log("메뉴 앨범 이미지 title 검색으로 찾음:", foundImage);
            }
          }
        }

        if (initialAlbum) {
          setFetchedAlbumImageUrl(initialAlbum);
          console.log("메뉴 앨범 이미지 state 저장:", initialAlbum);
        }

        let savedDividePostId = "";
        let savedCommunityPostId = "";

        if (chatRoomId) {
          try {
            const raw = await AsyncStorage.getItem(CHAT_ROOM_LINKED_POST_STORAGE_KEY);
            const mapData = raw ? JSON.parse(raw) : {};
            const saved = mapData[String(chatRoomId)];

            console.log("메뉴 연결 게시글 매핑 조회:", saved);

            if (saved && typeof saved === "object") {
              savedDividePostId = String(saved.dividePostId ?? "").trim();
              savedCommunityPostId = String(saved.communityPostId ?? "").trim();
            } else if (saved) {
              if (isDirectRoom) savedCommunityPostId = String(saved).trim();
              else savedDividePostId = String(saved).trim();
            }
          } catch (error) {
            console.log("메뉴 연결 게시글 매핑 조회 실패:", error);
          }
        }

        if (savedDividePostId) setLinkedDividePostId(savedDividePostId);
        if (savedCommunityPostId) setLinkedCommunityPostId(savedCommunityPostId);

        const routeDividePostId =
          !isDirectRoom
            ? postId ?? postsId ?? dividePostId ?? linkedPostId ?? id
            : "";

        const routeCommunityPostId =
          isDirectRoom
            ? communityId ?? postId ?? postsId ?? linkedPostId ?? id
            : "";

        let resolvedDividePostId = String(
          routeDividePostId ??
            mAny?.dividePostId ??
            mAny?.postId ??
            mAny?.postsId ??
            mAny?.post?.postId ??
            mAny?.post?.postsId ??
            mAny?.post?.id ??
            mAny?.dividePost?.postId ??
            mAny?.dividePost?.id ??
            localRoom?.postId ??
            localRoom?.postsId ??
            savedDividePostId ??
            ""
        ).trim();

        let resolvedCommunityPostId = String(
          routeCommunityPostId ??
            mAny?.communityPostId ??
            mAny?.communityId ??
            mAny?.post?.communityId ??
            localRoom?.communityPostId ??
            localRoom?.communityId ??
            savedCommunityPostId ??
            ""
        ).trim();

        if (!resolvedDividePostId && foundDividePostByTitle?.postId) {
          resolvedDividePostId = foundDividePostByTitle.postId;
          console.log("메뉴 분철 postId title 검색으로 찾음:", resolvedDividePostId);
        }

        if (!resolvedDividePostId && !resolvedCommunityPostId && chatRoomId) {
          try {
            const raw = await AsyncStorage.getItem("GO_REUDEOK_CHATROOM_POST_MAP");
            const mapData = raw ? JSON.parse(raw) : {};
            const mapped = mapData[String(chatRoomId)];
            if (mapped) {
              if (isDirectRoom) resolvedCommunityPostId = String(mapped).trim();
              else resolvedDividePostId = String(mapped).trim();
              console.log("이전 로컬 매핑에서 게시글 ID 발견:", mapped);
            }
          } catch {}
        }

        console.log("메뉴 분철 postId 계산:", resolvedDividePostId);
        console.log("메뉴 커뮤니티 postId 계산:", resolvedCommunityPostId);

        if (resolvedDividePostId) {
          setFetchedPostId(resolvedDividePostId);
          setLinkedDividePostId(resolvedDividePostId);
        }

        if (resolvedCommunityPostId) {
          setLinkedCommunityPostId(resolvedCommunityPostId);
        }

        if (!isDirectRoom) {
          // postId를 못 찾은 경우 채팅방 상세 API에서 한 번 더 시도
          if (!resolvedDividePostId && chatRoomId) {
            try {
              const roomDetail = await apiRequest<any>(`/api/chat-rooms/${chatRoomId}`, { method: "GET" });
              const roomDetailPostId = String(
                roomDetail?.postId ?? roomDetail?.postsId ?? roomDetail?.post?.postId ?? roomDetail?.post?.id ?? ""
              ).trim();
              if (roomDetailPostId) {
                resolvedDividePostId = roomDetailPostId;
                setFetchedPostId(roomDetailPostId);
                setLinkedDividePostId(roomDetailPostId);
                console.log("채팅방 상세 API에서 postId 확보:", roomDetailPostId);
              }
            } catch {
              console.log("채팅방 상세 API 조회 실패");
            }
          }

          if (resolvedDividePostId) {
            const postDetail = await fetchPostDetail(resolvedDividePostId);
            console.log("메뉴 게시글 상세 응답:", postDetail);
            const postImage = getAlbumImageUrl(postDetail);
            if (postImage) setFetchedAlbumImageUrl(postImage);

            const postTotalCount = Number(
              postDetail?.totalMemberCount ??
              postDetail?.memberCount ??
              postDetail?.quantity ??
              postDetail?.recruitCount ??
              postDetail?.maxParticipants ??
              postDetail?.totalCount ??
              0
            );
            if (postTotalCount > 0) setFetchedTotalMemberCount(postTotalCount);
          }
        }
      } catch (error) {
        console.log("채팅 메뉴 조회 실패:", error);
      } finally {
        setIsMenuLoaded(true);
      }
    };

    loadMenuInfo();
  }, [chatRoomId, postId, postsId, id, communityId, dividePostId, linkedPostId, type, localRoom]);

  const normalizedRole =
    typeof role === "string" ? role.trim().toLowerCase() : "";

  const normalizedMenuRole = String(menuInfo?.myRole ?? "")
    .trim()
    .toLowerCase();

  const effectiveRole = normalizedMenuRole || normalizedRole;

  const normalizedType = typeof type === "string" ? type.trim().toLowerCase() : "";
  const isNote = normalizedType === "note" || normalizedType === "direct";
  const isSeller = !isNote && effectiveRole === "seller";
  const isBuyer = !isNote && !isSeller;

  const cleanName = (value?: string) => {
    if (typeof value !== "string") return "";

    const trimmed = value.trim();

    if (!trimmed) return "";
    if (trimmed === "나") return "";
    if (trimmed === "본인") return "";
    if (trimmed.toLowerCase() === "me") return "";
    if (trimmed === "구매자") return "";
    if (trimmed === "판매자") return "";

    return trimmed;
  };

  const roomTitle =
    typeof title === "string" && title.trim().length > 0
      ? title.trim()
      : menuInfo?.title && String(menuInfo.title).trim().length > 0
      ? String(menuInfo.title).trim()
      : localRoom?.title && localRoom.title.trim().length > 0
      ? localRoom.title.trim()
      : isNote
      ? "쪽지"
      : "분철 채팅방";

  const albumImageUrl = fetchedAlbumImageUrl || getAlbumImageUrl(menuInfo, localRoom);

  const _m = menuInfo as any;

  const targetDividePostId = String(
    !isNote
      ? postId ??
          postsId ??
          dividePostId ??
          linkedPostId ??
          id ??
          _m?.dividePostId ??
          _m?.postId ??
          _m?.postsId ??
          _m?.post?.postId ??
          _m?.post?.postsId ??
          _m?.post?.id ??
          _m?.dividePost?.postId ??
          _m?.dividePost?.id ??
          localRoom?.postId ??
          localRoom?.postsId ??
          linkedDividePostId ??
          fetchedPostId ??
          ""
      : ""
  ).trim();

  const targetCommunityPostId = String(
    isNote
      ? communityId ??
          postId ??
          postsId ??
          linkedPostId ??
          id ??
          _m?.communityPostId ??
          _m?.communityId ??
          _m?.post?.communityId ??
          localRoom?.communityPostId ??
          localRoom?.communityId ??
          linkedCommunityPostId ??
          ""
      : ""
  ).trim();

  console.log("분철 게시글 ID 계산:", targetDividePostId, "| postId param:", postId, "| menuInfo keys:", _m ? Object.keys(_m) : []);
  console.log("커뮤니티 게시글 ID 계산:", targetCommunityPostId);

  const sellerParticipant = menuParticipants.find(
    (participant) =>
      String(participant.role ?? "").trim().toUpperCase() === "SELLER"
  );

  const currentParticipant = menuParticipants.find(
    (participant) => String(participant.userId ?? "") === String(currentUserId)
  );

  const sellerDisplayName =
    cleanName(sellerName) ||
    cleanName(localRoom?.sellerName) ||
    cleanName(sellerParticipant?.nickname) ||
    (isBuyer ? cleanName(opponentName) : "") ||
    "판매자";

  const currentUserName =
    cleanName(myNickname) || cleanName(currentUserNickname);

  const buyerNameCandidatesForSeller = [
    cleanName(buyerName),
    cleanName(localRoom?.buyerName),
    cleanName(opponentName),
  ].filter(
    (name) =>
      name.length > 0 &&
      name !== sellerDisplayName &&
      name !== currentUserName
  );

  const rawBuyerName = isBuyer
    ? cleanName(buyerName) ||
      cleanName(localRoom?.buyerName) ||
      currentUserName
    : buyerNameCandidatesForSeller[0] ?? "";

  const hasBuyerParticipant =
    rawBuyerName.length > 0 ||
    (typeof selectedMember === "string" && selectedMember.trim().length > 0) ||
    (typeof receiverName === "string" && receiverName.trim().length > 0) ||
    (typeof phoneNumber === "string" && phoneNumber.trim().length > 0) ||
    (typeof storeName === "string" && storeName.trim().length > 0) ||
    (localRoom?.buyerName && localRoom.buyerName.trim().length > 0) ||
    (localRoom?.selectedMember && localRoom.selectedMember.trim().length > 0);

  const buyerDisplayName = isBuyer
    ? rawBuyerName || "나"
    : rawBuyerName;

  const buyerMemberName =
    (typeof selectedMember === "string" && selectedMember.trim().length > 0
      ? selectedMember.trim()
      : localRoom?.selectedMember && localRoom.selectedMember.trim().length > 0
      ? localRoom.selectedMember.trim()
      : "") || fetchedBuyerMemberName;

  const parsedTotalMemberCount = Number(
    totalMemberCount ?? localRoom?.totalMemberCount ?? 0
  );
  const parsedCompletedMemberCount = Number(
    completedMemberCount ?? localRoom?.completedMemberCount ?? 0
  );
  const effectiveTotalMemberCount =
    parsedTotalMemberCount > 0 ? parsedTotalMemberCount : fetchedTotalMemberCount;

  const effectivePostStatus =
    menuInfo?.postStatus ?? menuInfo?.status ?? postStatus ?? localRoom?.postStatus ?? localRoom?.status;

  const buyerParticipantCount = menuParticipants.filter(
    (p) => String(p.role ?? "").toUpperCase() !== "SELLER"
  ).length;

  const isCompletedStatus = (s?: string) => {
    const v = String(s ?? "").trim();
    return (
      v === "모집 완료" ||
      v === "모집완료" ||
      v === "COMPLETED" ||
      v === "CLOSED" ||
      v === "SOLD_OUT"
    );
  };

  const isAllMembersCompleted =
    allMembersCompleted === "true" ||
    localRoom?.allMembersCompleted === true ||
    isCompletedStatus(effectivePostStatus) ||
    (effectiveTotalMemberCount > 0 &&
      parsedCompletedMemberCount >= effectiveTotalMemberCount) ||
    (effectiveTotalMemberCount > 0 &&
      buyerParticipantCount >= effectiveTotalMemberCount);

  const initialStatus: TradeStatus = isAllMembersCompleted
    ? "모집 완료"
    : status === "모집 완료" ||
      status === "배송 중" ||
      status === "거래 완료" ||
      status === "거래 취소"
    ? status
    : effectivePostStatus === "모집 완료"
    ? "모집 완료"
    : "모집 중";

  const [tradeStatus, setTradeStatus] = useState<TradeStatus>(initialStatus);
  const [selectedBuyerInfo, setSelectedBuyerInfo] = useState<Member | null>(
    null
  );
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dimOpacity = useRef(new Animated.Value(0)).current;
  const currentTranslateY = useRef(SHEET_HEIGHT);

  const isTradeCompleted = tradeStatus === "거래 완료";

  useEffect(() => {
    const nextStatus = String(menuInfo?.postStatus ?? menuInfo?.status ?? "");

    if (
      nextStatus === "모집 완료" ||
      nextStatus === "모집완료" ||
      nextStatus === "COMPLETED" ||
      nextStatus === "CLOSED" ||
      nextStatus === "SOLD_OUT"
    ) {
      setTradeStatus("모집 완료");
    } else if (nextStatus === "배송 중") {
      setTradeStatus("배송 중");
    } else if (nextStatus === "거래 완료" || nextStatus === "done") {
      setTradeStatus("거래 완료");
    } else if (nextStatus === "거래 취소") {
      setTradeStatus("거래 취소");
    }
  }, [menuInfo]);

  useEffect(() => {
    if (effectiveTotalMemberCount <= 0) return;

    const buyers = menuParticipants.filter(
      (p) => String(p.role ?? "").toUpperCase() !== "SELLER"
    ).length;

    if (buyers >= effectiveTotalMemberCount) {
      setTradeStatus((prev) =>
        prev === "거래 완료" || prev === "거래 취소" ? prev : "모집 완료"
      );
    }
  }, [menuParticipants, effectiveTotalMemberCount]);

  const sellerMember: Member = {
    id: "seller",
    nickname: sellerDisplayName,
    member: isNote ? "" : "개설자",
    initial: sellerDisplayName.slice(0, 1),
    color: "#FFF1B8",
    initialColor: "#D09A00",
    profileImageUrl: getProfileImageUrl(sellerParticipant),
    isSeller: true,
    role: "SELLER",
  };

  const buyerMember: Member = {
    id: "buyer",
    nickname: buyerDisplayName,
    member: isNote ? "" : buyerMemberName,
    initial: buyerDisplayName.slice(0, 1),
    color: "#DDF7EB",
    initialColor: "#1E8E61",
    profileImageUrl: "",
    receiver:
      typeof receiverName === "string" && receiverName.trim().length > 0
        ? receiverName.trim()
        : "-",
    phone:
      typeof phoneNumber === "string" && phoneNumber.trim().length > 0
        ? phoneNumber.trim()
        : "-",
    store:
      typeof storeName === "string" && storeName.trim().length > 0
        ? storeName.trim()
        : "-",
    request:
      typeof requestMessage === "string" && requestMessage.trim().length > 0
        ? requestMessage.trim()
        : "없음",
    role: "BUYER",
  };

  const getParticipantMember = (participant: MenuParticipant, index: number): Member => {
    const nickname =
      cleanName(String(participant.nickname ?? "")) ||
      (String(participant.role ?? "").toUpperCase() === "SELLER" ? "판매자" : "참여자");

    const roleText = String(participant.role ?? "").toUpperCase();
    const memberName = String(participant.memberName ?? "").trim();
    const isParticipantSeller = roleText === "SELLER";

    return {
      id: `participant-${index}-${participant.userId ?? 'unknown'}`,
      userId:
        participant.userId === null || participant.userId === undefined
          ? undefined
          : String(participant.userId),
      nickname,
      member: isNote ? "" : isParticipantSeller ? "개설자" : memberName,
      initial: nickname.slice(0, 1),
      color: isParticipantSeller ? "#FFF1B8" : "#DDF7EB",
      initialColor: isParticipantSeller ? "#D09A00" : "#1E8E61",
      profileImageUrl: getProfileImageUrl(participant),
      isSeller: isParticipantSeller,
      role: roleText,
      receiver:
        typeof receiverName === "string" && receiverName.trim().length > 0
          ? receiverName.trim()
          : "-",
      phone:
        typeof phoneNumber === "string" && phoneNumber.trim().length > 0
          ? phoneNumber.trim()
          : "-",
      store:
        typeof storeName === "string" && storeName.trim().length > 0
          ? storeName.trim()
          : "-",
      request:
        typeof requestMessage === "string" && requestMessage.trim().length > 0
          ? requestMessage.trim()
          : "없음",
    };
  };

  const apiMembers = menuParticipants.map(getParticipantMember);

  const noteMembers: Member[] = [
    {
      id: "note-other",
      nickname: cleanName(opponentName) || "상대방",
      member: "",
      initial: (cleanName(opponentName) || "상대방").slice(0, 1),
      color: "#DDF7EB",
      initialColor: "#1E8E61",
      profileImageUrl: "",
    },
  ];

  const currentUserDisplayName =
    currentUserName ||
    (isSeller ? sellerDisplayName : "") ||
    (isBuyer ? buyerDisplayName : "") ||
    "나";

  const selfMember: Member = {
    id: "me",
    userId: currentUserId || undefined,
    nickname: currentUserDisplayName,
    member: isNote ? "" : isSeller ? "개설자" : buyerMemberName,
    initial: currentUserDisplayName.slice(0, 1) || "나",
    color: "#FFE0CA",
    initialColor: "#E0702A",
    profileImageUrl: getProfileImageUrl(currentParticipant) || fetchedSelfProfileImg,
    isSeller,
    role: isSeller ? "SELLER" : isBuyer ? "BUYER" : "MEMBER",
    receiver:
      !isSeller && typeof receiverName === "string" && receiverName.trim().length > 0
        ? receiverName.trim()
        : "-",
    phone:
      !isSeller && typeof phoneNumber === "string" && phoneNumber.trim().length > 0
        ? phoneNumber.trim()
        : "-",
    store:
      !isSeller && typeof storeName === "string" && storeName.trim().length > 0
        ? storeName.trim()
        : "-",
    request:
      !isSeller && typeof requestMessage === "string" && requestMessage.trim().length > 0
        ? requestMessage.trim()
        : "없음",
  };

  const apiOtherMembers = apiMembers.filter((member) => {
    if (!currentUserId) return true;
    if (!member.userId) return true;

    return String(member.userId) !== String(currentUserId);
  });

  const fallbackOtherMembers = isNote
    ? noteMembers
    : isSeller
    ? hasBuyerParticipant
      ? [buyerMember]
      : []
    : [sellerMember];

  const visibleMembers = [
    selfMember,
    ...(apiOtherMembers.length > 0 ? apiOtherMembers : fallbackOtherMembers),
  ];

  const getIsMe = (member: Member) => {
    return member.id === "me";
  };

  const getStatusStyle = (targetStatus: TradeStatus) => {
    switch (targetStatus) {
      case "모집 중":
        return {
          badge: styles.statusRecruitingBadge,
          text: styles.statusRecruitingText,
        };
      case "모집 완료":
        return {
          badge: styles.statusClosedBadge,
          text: styles.statusClosedText,
        };
      case "배송 중":
        return {
          badge: styles.statusShippingBadge,
          text: styles.statusShippingText,
        };
      case "거래 완료":
        return {
          badge: styles.statusCompleteBadge,
          text: styles.statusCompleteText,
        };
      case "거래 취소":
        return {
          badge: styles.statusCancelBadge,
          text: styles.statusCancelText,
        };
    }
  };

  const openBuyerSheet = async (member: Member) => {
    if (isSeller && member.userId) {
      try {
        const info = await fetchBuyerInfo(member.userId);

        if (info) {
          const nickname = cleanName(info.nickname) || member.nickname;

          setSelectedBuyerInfo({
            ...member,
            nickname,
            member: info.memberName || member.member,
            initial: nickname.slice(0, 1),
            profileImageUrl: getProfileImageUrl(info) || member.profileImageUrl,
            receiver: info.realName || member.receiver || "-",
            phone: info.phoneNumber || member.phone || "-",
            store: info.storeName || member.store || "-",
            request: info.requestMessage || member.request || "없음",
          });
          setIsSheetVisible(true);
          return;
        }
      } catch (error) {
        console.log("구매자 정보 조회 실패:", error);
      }
    }

    setSelectedBuyerInfo(member);
    setIsSheetVisible(true);
  };

  const openSheetAnimation = useCallback(() => {
    sheetTranslateY.setValue(SHEET_HEIGHT);
    dimOpacity.setValue(0);
    currentTranslateY.current = SHEET_HEIGHT;

    Animated.parallel([
      Animated.timing(dimOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 95,
        friction: 14,
      }),
    ]).start(() => {
      currentTranslateY.current = 0;
    });
  }, [sheetTranslateY, dimOpacity]);

  const closeBuyerSheet = () => {
    Animated.parallel([
      Animated.timing(dimOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_HEIGHT + 80,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      currentTranslateY.current = SHEET_HEIGHT;
      setIsSheetVisible(false);
      setSelectedBuyerInfo(null);
    });
  };

  const restoreSheet = () => {
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 95,
      friction: 14,
    }).start(() => {
      currentTranslateY.current = 0;
    });
  };

  useEffect(() => {
    if (!isSheetVisible) return;

    requestAnimationFrame(() => {
      openSheetAnimation();
    });
  }, [isSheetVisible, openSheetAnimation]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dy) > 4;
      },

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) return;

        const nextTranslateY = Math.min(SHEET_HEIGHT + 80, gesture.dy);
        sheetTranslateY.setValue(nextTranslateY);
        currentTranslateY.current = nextTranslateY;
      },

      onPanResponderRelease: (_, gesture) => {
        const shouldClose =
          gesture.dy > 45 ||
          gesture.vy > 0.35 ||
          currentTranslateY.current > SHEET_HEIGHT * 0.16;

        if (shouldClose) {
          closeBuyerSheet();
          return;
        }

        restoreSheet();
      },
    })
  ).current;

  const handleOpenCommunityPost = () => {
    console.log(
      "커뮤니티 게시글 이동 시도 - targetCommunityPostId:",
      targetCommunityPostId,
      "menuInfo:",
      JSON.stringify(menuInfo)
    );

    if (!targetCommunityPostId) {
      Alert.alert(
        "커뮤니티 글",
        "연결된 커뮤니티 게시글 정보를 찾지 못했어요."
      );
      return;
    }

    router.push({
      pathname: "/community/[postId]",
      params: {
        postId: targetCommunityPostId,
        postsId: targetCommunityPostId,
        id: targetCommunityPostId,
        communityId: targetCommunityPostId,
      },
    } as any);
  };

  const handleOpenDividePost = () => {
    console.log(
      "분철 게시글 이동 시도 - targetDividePostId:",
      targetDividePostId,
      "menuInfo:",
      JSON.stringify(menuInfo)
    );

    if (!targetDividePostId) {
      Alert.alert("게시글 정보 없음", "연결된 분철 게시글 정보를 찾지 못했어요.");
      return;
    }

    router.push({
      pathname: "/divide-detail",
      params: {
        postId: targetDividePostId,
        postsId: targetDividePostId,
        id: targetDividePostId,
      },
    } as any);
  };

  const moveToChatWithCompletedStatus = async () => {
    const nextStatus: TradeStatus = "거래 완료";
    const targetChatRoomId = typeof chatRoomId === "string" ? chatRoomId : "1";

    setTradeStatus(nextStatus);
    await saveCompletedStatusToStorage(targetChatRoomId);
    await updateLocalRoomAsCompleted(targetChatRoomId);

    router.replace({
      pathname: "/chat/[chatRoomId]",
      params: {
        chatRoomId: targetChatRoomId,
        type: "divide",
        role: isSeller ? "seller" : "buyer",
        title: roomTitle,
        tradeEvent: "completed",
        status: nextStatus,
        reviewSubmitted:
          typeof reviewSubmitted === "string" ? reviewSubmitted : "false",
        opponentName: isSeller ? buyerDisplayName : sellerDisplayName,
        sellerName: sellerDisplayName,
        buyerName: buyerDisplayName,
        selectedMember: buyerMemberName,
        postStatus: "거래 완료",
        allMembersCompleted: isAllMembersCompleted ? "true" : "false",
        totalMemberCount:
          parsedTotalMemberCount > 0 ? String(parsedTotalMemberCount) : "",
        completedMemberCount:
          parsedCompletedMemberCount > 0
            ? String(parsedCompletedMemberCount)
            : "",
      },
    } as any);
  };

  const removeChatRoomFromList = async () => {
    try {
      const targetId = typeof chatRoomId === "string" ? chatRoomId : "";

      if (!targetId) return;

      const localRaw = await AsyncStorage.getItem(LOCAL_CHAT_ROOMS_KEY);
      const localRooms = localRaw ? JSON.parse(localRaw) : [];

      const nextLocalRooms = Array.isArray(localRooms)
        ? localRooms.filter((room) => String(room.id) !== String(targetId))
        : [];

      await AsyncStorage.setItem(
        LOCAL_CHAT_ROOMS_KEY,
        JSON.stringify(nextLocalRooms)
      );

      const removedRaw = await AsyncStorage.getItem(REMOVED_CHAT_ROOMS_KEY);
      const removedRooms = removedRaw ? JSON.parse(removedRaw) : [];

      const nextRemovedRooms = Array.isArray(removedRooms)
        ? Array.from(new Set([...removedRooms.map(String), targetId]))
        : [targetId];

      await AsyncStorage.setItem(
        REMOVED_CHAT_ROOMS_KEY,
        JSON.stringify(nextRemovedRooms)
      );
    } catch (error) {
      console.log("채팅방 목록 제거 저장 실패:", error);
    }
  };

  const moveToChatListAfterLeave = async () => {
    const targetId = typeof chatRoomId === "string" ? chatRoomId : "1";

    await removeChatRoomFromList();

    router.replace({
      pathname: "/(tabs)/chats",
      params: {
        removedChatRoomId: targetId,
      },
    } as any);
  };

  const handleCancelTrade = () => {
    Alert.alert("거래 취소", "거래를 취소하시겠습니까?", [
      {
        text: "아니오",
        style: "cancel",
      },
      {
        text: "예",
        style: "destructive",
        onPress: async () => {
          setTradeStatus("거래 취소");
          await moveToChatListAfterLeave();
        },
      },
    ]);
  };

  const handleCompleteTrade = () => {
    if (isTradeCompleted) return;

    Alert.alert("거래 완료", "거래를 완료하시겠습니까?", [
      {
        text: "아니오",
        style: "cancel",
      },
      {
        text: "예",
        onPress: async () => {
          try {
            if (chatRoomId) {
              await completeChatRoom(chatRoomId);
            }

            await moveToChatWithCompletedStatus();
          } catch (error: any) {
            console.log("거래 완료 처리 실패:", error);

            Alert.alert(
              "오류",
              error?.message || "거래 완료 처리에 실패했습니다."
            );
          }
        },
      },
    ]);
  };

  const handleLeaveChatRoom = () => {
    Alert.alert("채팅방 나가기", "이 채팅방을 나가시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "나가기",
        style: "destructive",
        onPress: async () => {
          await moveToChatListAfterLeave();
        },
      },
    ]);
  };

  const statusStyle = getStatusStyle(tradeStatus);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>메뉴</Text>

        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isNote ? (
          <TouchableOpacity
            style={styles.notePostCard}
            activeOpacity={0.8}
            onPress={handleOpenCommunityPost}
          >
            <View style={styles.notePostTextBox}>
              <Text style={styles.notePostLabel}>커뮤니티 글</Text>
              <Text style={styles.notePostTitle} numberOfLines={2}>
                {roomTitle}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={COLORS.gray700} />
          </TouchableOpacity>
        ) : (
          <View style={styles.tradeCard}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleOpenDividePost}>
            <View style={styles.tradeTop}>
              <View style={styles.thumbnail}>
                {albumImageUrl ? (
                  <Image
                    key={albumImageUrl}
                    source={{ uri: albumImageUrl }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log(
                        "메뉴 앨범 이미지 로드 실패:",
                        albumImageUrl,
                        error.nativeEvent
                      );
                    }}
                  />
                ) : (
                  <Ionicons name="albums-outline" size={24} color={COLORS.black} />
                )}
              </View>

              <View style={styles.tradeInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.tradeTitle}>{roomTitle}</Text>

                  <View style={[styles.statusBadge, statusStyle.badge]}>
                    <Text style={[styles.statusText, statusStyle.text]}>
                      {tradeStatus}
                    </Text>
                  </View>
                </View>

                {!isNote && !isSeller && buyerMemberName ? (
                  <View style={styles.buyerInfoBox}>
                    <Text style={styles.buyerInfoLabel}>
                      {isSeller ? "선택 멤버" : "내 참여 멤버"}
                    </Text>
                    <Text style={styles.buyerInfoValue}>{buyerMemberName}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>

            {isSeller && (
              <View style={styles.tradeButtonRow}>
                <TouchableOpacity
                  style={[styles.tradeButton, styles.cancelButton]}
                  activeOpacity={0.8}
                  disabled={isTradeCompleted}
                  onPress={handleCancelTrade}
                >
                  <Text style={styles.cancelButtonText}>거래 취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tradeButton,
                    isTradeCompleted
                      ? styles.completeButtonDisabled
                      : styles.completeButton,
                  ]}
                  activeOpacity={isTradeCompleted ? 1 : 0.8}
                  disabled={isTradeCompleted}
                  onPress={handleCompleteTrade}
                >
                  <Text
                    style={[
                      styles.completeButtonText,
                      isTradeCompleted && styles.completeButtonTextDisabled,
                    ]}
                  >
                    {isTradeCompleted ? "완료됨" : "거래 완료"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.memberCard}>
          <Text style={styles.sectionTitle}>
            대화상대{" "}
            <Text style={styles.countText}>{visibleMembers.length}</Text>
          </Text>

          {visibleMembers.length === 0 && (
            <Text style={styles.emptyMemberText}>아직 참여자가 없어요.</Text>
          )}

          {visibleMembers.map((member, index) => {
            const isMe = getIsMe(member);

            return (
              <View key={member.id}>
                <View style={styles.memberRow}>
                  <View style={styles.profileWrap}>
                    <View
                      style={[
                        styles.memberProfile,
                        { backgroundColor: member.color },
                      ]}
                    >
                      <Image
                          key={member.profileImageUrl || "default"}
                          source={member.profileImageUrl ? { uri: member.profileImageUrl } : DEFAULT_PROFILE}
                          style={styles.memberProfileImage}
                          resizeMode="cover"
                        />
                    </View>

                    {!isNote && member.isSeller && (
                      <View style={styles.crownFloatingBadge}>
                        <MaterialCommunityIcons
                          name="crown"
                          size={13}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.memberTextBox}>
                    <View style={styles.nicknameRow}>
                      <Text style={styles.memberNickname}>
                        {member.nickname}
                      </Text>

                      {isMe && (
                        <View style={styles.nameMeBadge}>
                          <Text style={styles.nameMeBadgeText}>나</Text>
                        </View>
                      )}
                    </View>

                    {member.member ? (
                      <Text style={styles.memberName}>{member.member}</Text>
                    ) : null}
                  </View>

                  {!isNote && isSeller && !member.isSeller && (
                    <TouchableOpacity
                      style={styles.infoButton}
                      activeOpacity={0.75}
                      onPress={() => openBuyerSheet(member)}
                    >
                      <Text style={styles.infoButtonText}>정보 확인</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {index !== visibleMembers.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            );
          })}
        </View>

        {(isNote || !isSeller) && (
          <TouchableOpacity
            style={styles.leaveRoomCard}
            activeOpacity={0.78}
            onPress={handleLeaveChatRoom}
          >
            <View style={styles.leaveRoomLeft}>
              <Ionicons name="exit-outline" size={22} color={COLORS.red} />
              <Text style={styles.leaveRoomText}>채팅방 나가기</Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={COLORS.red} />
          </TouchableOpacity>
        )}
      </ScrollView>

      <BuyerInfoBottomSheet
        member={selectedBuyerInfo}
        visible={isSheetVisible}
        sheetTranslateY={sheetTranslateY}
        dimOpacity={dimOpacity}
        panHandlers={panResponder.panHandlers}
        onClose={closeBuyerSheet}
      />
    </SafeAreaView>
  );
}

function BuyerInfoBottomSheet({
  member,
  visible,
  sheetTranslateY,
  dimOpacity,
  panHandlers,
  onClose,
}: {
  member: Member | null;
  visible: boolean;
  sheetTranslateY: Animated.Value;
  dimOpacity: Animated.Value;
  panHandlers: any;
  onClose: () => void;
}) {
  if (!member) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.sheetModal}>
        <Animated.View
          style={[
            styles.dimBackground,
            {
              opacity: dimOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.dimPressArea}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          {...panHandlers}
        >
          <View style={styles.sheetGestureArea}>
            <View style={styles.handle} />
          </View>

          <View style={styles.sheetContent}>
            <View style={styles.sheetProfileRow}>
              <View
                style={[styles.sheetProfile, { backgroundColor: member.color }]}
              >
                <Image
                    key={member.profileImageUrl || "default"}
                    source={member.profileImageUrl ? { uri: member.profileImageUrl } : DEFAULT_PROFILE}
                    style={styles.sheetProfileImage}
                    resizeMode="cover"
                  />
              </View>

              <View>
                <Text style={styles.sheetNickname}>{member.nickname}</Text>
                <Text style={styles.sheetMember}>{member.member}</Text>
              </View>
            </View>

            <InfoItem label="받으시는 분" value={member.receiver ?? "-"} />
            <InfoItem label="전화번호" value={member.phone ?? "-"} />
            <InfoItem label="편의점 지점명" value={member.store ?? "-"} />
            <InfoItem label="요청사항" value={member.request ?? "-"} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  header: {
    height: 58,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
  },
  notePostCard: {
    minHeight: 74,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notePostTextBox: {
    flex: 1,
    marginRight: 12,
  },
  notePostLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray500,
    marginBottom: 6,
  },
  notePostTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 21,
  },
  tradeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  tradeTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FFE07A",
    marginRight: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  tradeInfo: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tradeTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 24,
    marginRight: 8,
  },
  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusRecruitingBadge: {
    backgroundColor: COLORS.green,
  },
  statusRecruitingText: {
    color: COLORS.greenText,
  },
  statusClosedBadge: {
    backgroundColor: "#FFF2C2",
  },
  statusClosedText: {
    color: "#C48A00",
  },
  statusShippingBadge: {
    backgroundColor: COLORS.blue,
  },
  statusShippingText: {
    color: COLORS.blueText,
  },
  statusCompleteBadge: {
    backgroundColor: "#EEEEEE",
  },
  statusCompleteText: {
    color: COLORS.gray500,
  },
  statusCancelBadge: {
    backgroundColor: "#EEEEEE",
  },
  statusCancelText: {
    color: COLORS.gray500,
  },
  buyerInfoBox: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  buyerInfoLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: "700",
    marginRight: 8,
  },
  buyerInfoValue: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: "800",
  },
  tradeButtonRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
  },
  tradeButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#D4D4D8",
  },
  completeButton: {
    backgroundColor: COLORS.yellow,
  },
  completeButtonDisabled: {
    backgroundColor: "#E1E1E1",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },
  completeButtonTextDisabled: {
    color: COLORS.gray500,
  },
  memberCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray700,
    marginBottom: 12,
  },
  countText: {
    color: COLORS.yellow,
  },
  memberRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },
  profileWrap: {
    width: 66,
    height: 58,
    marginRight: 13,
    position: "relative",
    justifyContent: "center",
  },
  memberProfile: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  memberProfileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
  },
  crownFloatingBadge: {
    position: "absolute",
    right: 6,
    bottom: 1,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#6C86FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  memberTextBox: {
    flex: 1,
  },
  nicknameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  memberNickname: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    marginRight: 7,
  },
  nameMeBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: "#B5B5B5",
    alignItems: "center",
    justifyContent: "center",
  },
  nameMeBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.white,
  },
  memberName: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  infoButton: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.gray500,
    alignItems: "center",
    justifyContent: "center",
  },
  infoButtonText: {
    fontSize: 12,
    color: COLORS.gray700,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginLeft: 79,
  },
  emptyMemberText: {
    paddingVertical: 22,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray500,
    textAlign: "center",
  },
  leaveRoomCard: {
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leaveRoomLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaveRoomText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.red,
    marginLeft: 12,
  },
  sheetModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  dimBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  dimPressArea: {
    flex: 1,
  },
  bottomSheet: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetGestureArea: {
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 74,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#D0D0D0",
  },
  sheetContent: {
    paddingHorizontal: 28,
    paddingBottom: 34,
  },
  sheetProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  sheetProfile: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  sheetProfileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  sheetNickname: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 5,
  },
  sheetMember: {
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  infoItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingVertical: 13,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: "600",
    marginBottom: 9,
  },
  infoValue: {
    fontSize: 17,
    color: COLORS.black,
    fontWeight: "600",
  },
});