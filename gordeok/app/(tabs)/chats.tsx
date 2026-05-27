import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { leaveChatRoom } from "../../services/chat";
import { apiRequest, getStoredUserId } from "../../utils/api";
import type { ChatRoomApiItem } from "../../types/chat";

type ChatTab = "divide" | "note";
type UserRole = "seller" | "buyer" | "member";

type DivideRoom = {
  id: number;
  title: string;
  organizer: string;
  memberCount: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  status?: "progress" | "done";
  color: "yellow" | "purple" | "pink" | "gray";
  role: UserRole;
  reviewSubmitted?: boolean;
  sortTime?: number;
  albumImageUrl?: string;

  postId?: string;

  buyerName?: string;
  selectedMember?: string;
  selectedPrice?: string;
  receiverName?: string;
  phoneNumber?: string;
  storeName?: string;
  requestText?: string;
};

type NoteRoom = {
  id: number;
  title: string;
  boardName: string;
  userName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  sortTime?: number;

  postId?: string;
  postsId?: string;
  communityId?: string;
};

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B5B5B5",
  yellow: "#F3C24F",
  red: "#FF5A5A",
  line: "#EEEEEE",
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://frostily-derby-underpass.ngrok-free.dev";

const SCREEN_PADDING = 22;
const LEAVE_WIDTH = 88;

const CHAT_ROOMS_STORAGE_KEYS = ["localChatRooms", "GO_REUDEOK_CHAT_ROOMS"];
const TRADE_STATUS_STORAGE_KEY = "GO_REUDEOK_CHAT_TRADE_STATUS";
const REVIEW_SUBMITTED_STORAGE_KEY = "GO_REUDEOK_CHAT_REVIEW_SUBMITTED";

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

function getRoomAlbumImageUrl(room: any) {
  const rawUrl =
    Array.isArray(room?.imageUrls) && room.imageUrls.length > 0
      ? room.imageUrls[0]
      : Array.isArray(room?.post?.imageUrls) && room.post.imageUrls.length > 0
      ? room.post.imageUrls[0]
      : Array.isArray(room?.dividePost?.imageUrls) &&
        room.dividePost.imageUrls.length > 0
      ? room.dividePost.imageUrls[0]
      : room?.thumbnailUrl ||
        room?.albumImageUrl ||
        room?.imageUrl ||
        room?.postImageUrl ||
        room?.image ||
        room?.post?.thumbnailUrl ||
        room?.post?.albumImageUrl ||
        room?.post?.imageUrl ||
        room?.post?.postImageUrl ||
        room?.post?.image ||
        room?.dividePost?.thumbnailUrl ||
        room?.dividePost?.albumImageUrl ||
        room?.dividePost?.imageUrl ||
        room?.dividePost?.postImageUrl ||
        room?.dividePost?.image;

  return normalizeImageUrl(rawUrl);
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

async function loadStoredTradeStatusMap() {
  return readJsonMap(TRADE_STATUS_STORAGE_KEY);
}

async function loadStoredReviewSubmittedMap() {
  return readJsonMap(REVIEW_SUBMITTED_STORAGE_KEY);
}

function sortDivideRooms(rooms: DivideRoom[]) {
  return [...rooms].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;

    const aSortTime = a.sortTime ?? 0;
    const bSortTime = b.sortTime ?? 0;

    if (aSortTime !== bSortTime) return bSortTime - aSortTime;

    return b.id - a.id;
  });
}

function formatChatTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function getRoomSortTime(room: any) {
  const timeValue =
    room?.lastMessageTime ??
    room?.lastMessageAt ??
    room?.updatedAt ??
    room?.createdAt ??
    room?.joinedAt ??
    room?.chatRoomCreatedAt ??
    room?.chatCreatedAt;

  if (timeValue) {
    const time = new Date(timeValue).getTime();

    if (!Number.isNaN(time)) return time;
  }

  const id = getChatRoomId(room);

  return Number.isFinite(id) ? id : 0;
}

function getRoomColor(index: number): DivideRoom["color"] {
  const colors: DivideRoom["color"][] = ["yellow", "purple", "pink", "gray"];
  return colors[index % colors.length];
}

function getRawRoomType(room: any) {
  return String(room?.type ?? room?.chatRoomType ?? room?.roomType ?? "")
    .trim()
    .toUpperCase();
}

function getRawRoomRole(room: any) {
  return String(room?.myRole ?? room?.role ?? room?.userRole ?? "")
    .trim()
    .toUpperCase();
}

function isDivideRoom(room: any) {
  const type = getRawRoomType(room);

  return type === "GROUP" || type === "DIVIDE";
}

function isNoteRoom(room: any) {
  const type = getRawRoomType(room);

  return type === "DIRECT" || type === "NOTE";
}

function getChatRoomId(room: any) {
  return Number(room?.chatRoomId ?? room?.id ?? room?.roomId);
}

function getRoomStatus(room: any): DivideRoom["status"] {
  const raw = String(room?.status ?? room?.tradeStatus ?? room?.postStatus ?? "")
    .trim()
    .replace(/\s/g, "")
    .toUpperCase();

  if (
    raw === "DONE" ||
    raw === "COMPLETED" ||
    raw === "COMPLETE" ||
    raw === "거래완료"
  ) {
    return "done";
  }

  return "progress";
}

function convertCategoryLabel(category?: string | null) {
  const raw = String(category ?? "").trim();

  switch (raw) {
    case "PHOTO_EXCHANGE":
    case "포카교환":
      return "포카교환";
    case "OFFLINE_COMPANION":
    case "오프동행":
      return "오프동행";
    case "QUESTION":
    case "질문게시판":
      return "질문게시판";
    case "FREE":
    case "자유게시판":
      return "자유게시판";
    default:
      return raw || "커뮤니티";
  }
}

function getFirstText(...values: any[]) {
  for (const value of values) {
    if (typeof value !== "string" && typeof value !== "number") continue;

    const text = String(value).trim();

    if (!text) continue;
    if (text === "쪽지") continue;
    if (text === "DIRECT") continue;
    if (text === "NOTE") continue;

    return text;
  }

  return "";
}

function getServerGroupTitle(room: any) {
  return getFirstText(
    room.title,
    room.postTitle,
    room.dividePostTitle,
    room.post?.title,
    room.roomName
  );
}

function getNoteTitle(room: any) {
  return getFirstText(
    room.communityPostTitle,
    room.communityPost?.title,
    room.communityTitle,
    room.postTitle,
    room.post?.title,
    room.linkedPostTitle,
    room.boardTitle,
    room.subject,
    room.roomName,
    room.title
  );
}

function getNoteCategory(room: any) {
  return convertCategoryLabel(
    room.communityPostCategory ||
      room.communityPost?.category ||
      room.category ||
      room.boardName ||
      room.boardCategory ||
      room.communityCategory ||
      room.post?.category
  );
}

function getNoteOpponentName(room: any) {
  return getFirstText(
    room.opponentName,
    room.opponentNickname,
    room.otherUserNickname,
    room.receiverName,
    room.sellerName,
    room.sellerNickname,
    room.buyerName,
    room.buyerNickname,
    room.writerName,
    room.writerNickname,
    room.authorNickname,
    room.communityPost?.authorNickname,
    room.post?.authorNickname
  );
}

function getNotePostId(room: any) {
  return getFirstText(
    room.postId,
    room.postsId,
    room.communityId,
    room.communityPostId,
    room.communityPost?.postId,
    room.communityPost?.id,
    room.post?.postId,
    room.post?.id
  );
}

function getDividePostId(room: any) {
  return getFirstText(
    room.postId,
    room.postsId,
    room.dividePostId,
    room.groupPostId,
    room.post?.postId,
    room.post?.postsId,
    room.post?.id,
    room.dividePost?.postId,
    room.dividePost?.id
  );
}

function extractChatRooms(response: unknown): ChatRoomApiItem[] {
  if (Array.isArray(response)) return response as ChatRoomApiItem[];

  const maybeObject = response as any;

  if (Array.isArray(maybeObject?.content)) {
    return maybeObject.content as ChatRoomApiItem[];
  }

  if (Array.isArray(maybeObject?.data)) {
    return maybeObject.data as ChatRoomApiItem[];
  }

  if (Array.isArray(maybeObject?.items)) {
    return maybeObject.items as ChatRoomApiItem[];
  }

  return [];
}

async function loadSavedChatRooms() {
  try {
    const allRooms: any[] = [];

    for (const key of CHAT_ROOMS_STORAGE_KEYS) {
      const saved = await AsyncStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];

      if (Array.isArray(parsed)) {
        allRooms.push(...parsed);
      }
    }

    const uniqueMap = new Map<string, any>();

    allRooms.forEach((room) => {
      const id = String(room?.chatRoomId ?? room?.id ?? room?.roomId ?? "");

      if (!id) return;

      uniqueMap.set(id, {
        ...uniqueMap.get(id),
        ...room,
      });
    });

    return Array.from(uniqueMap.values());
  } catch (error) {
    console.log("로컬 채팅방 목록 불러오기 실패:", error);
    return [];
  }
}

async function removeLocalChatRoom(chatRoomId: string | number) {
  try {
    const targetId = String(chatRoomId);

    for (const key of CHAT_ROOMS_STORAGE_KEYS) {
      const saved = await AsyncStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : [];

      const next = Array.isArray(parsed)
        ? parsed.filter(
            (room) =>
              String(room?.chatRoomId ?? room?.id ?? room?.roomId ?? "") !==
              targetId
          )
        : [];

      await AsyncStorage.setItem(key, JSON.stringify(next));
    }
  } catch (error) {
    console.log("로컬 채팅방 제거 실패:", error);
  }
}

function findLocalRoomById(localRooms: any[], serverRoom: any) {
  const serverId = String(
    serverRoom?.chatRoomId ?? serverRoom?.id ?? serverRoom?.roomId ?? ""
  );

  if (!serverId) return null;

  return (
    localRooms.find((room) => {
      const localId = String(room?.chatRoomId ?? room?.id ?? room?.roomId ?? "");
      return localId === serverId;
    }) ?? null
  );
}

function mergeServerRoomsWithLocalMetadata(serverRooms: any[], localRooms: any[]) {
  return serverRooms
    .map((serverRoom) => {
      const localRoom = findLocalRoomById(localRooms, serverRoom);

      if (!localRoom) return serverRoom;

      const type = getRawRoomType(serverRoom);

      if (type === "GROUP" || type === "DIVIDE") {
        return {
          ...localRoom,
          ...serverRoom,

          chatRoomId:
            serverRoom.chatRoomId ??
            serverRoom.id ??
            serverRoom.roomId ??
            localRoom.chatRoomId ??
            localRoom.id,

          id:
            serverRoom.chatRoomId ??
            serverRoom.id ??
            serverRoom.roomId ??
            localRoom.chatRoomId ??
            localRoom.id,

          type: serverRoom.type || serverRoom.chatRoomType || "GROUP",
          myRole: serverRoom.myRole || serverRoom.role || localRoom.myRole,

          title:
            getServerGroupTitle(serverRoom) ||
            getServerGroupTitle(localRoom) ||
            "분철 채팅방",

          sellerName:
            serverRoom.sellerName ||
            serverRoom.sellerNickname ||
            localRoom.sellerName ||
            localRoom.sellerNickname ||
            localRoom.organizer,

          thumbnailUrl:
            serverRoom.thumbnailUrl ||
            serverRoom.albumImageUrl ||
            serverRoom.imageUrl ||
            serverRoom.postImageUrl ||
            localRoom.thumbnailUrl ||
            localRoom.albumImageUrl ||
            localRoom.imageUrl ||
            localRoom.postImageUrl,

          imageUrls:
            serverRoom.imageUrls ||
            serverRoom.post?.imageUrls ||
            localRoom.imageUrls ||
            localRoom.post?.imageUrls,

          lastMessage: serverRoom.lastMessage ?? localRoom.lastMessage ?? "",
          lastMessageTime:
            serverRoom.lastMessageTime ??
            serverRoom.lastMessageAt ??
            localRoom.lastMessageTime ??
            localRoom.lastMessageAt ??
            null,

          unreadCount: serverRoom.unreadCount ?? 0,
          status: serverRoom.status ?? localRoom.status,
          currentMembers:
            serverRoom.currentMembers ?? localRoom.currentMembers,
          maxMembers: serverRoom.maxMembers ?? localRoom.maxMembers,

          buyerName:
            serverRoom.buyerName ||
            serverRoom.buyerNickname ||
            localRoom.buyerName ||
            localRoom.buyerNickname ||
            "",

          selectedMember:
            serverRoom.selectedMember ||
            serverRoom.memberName ||
            localRoom.selectedMember ||
            localRoom.memberName ||
            "",

          selectedPrice:
            serverRoom.selectedPrice || localRoom.selectedPrice || "",

          receiverName:
            serverRoom.receiverName ||
            serverRoom.realName ||
            localRoom.receiverName ||
            localRoom.realName ||
            "",

          phoneNumber: serverRoom.phoneNumber || localRoom.phoneNumber || "",

          storeName:
            serverRoom.storeName ||
            serverRoom.convenienceStore ||
            localRoom.storeName ||
            localRoom.convenienceStore ||
            "",

          requestText:
            serverRoom.requestText ||
            serverRoom.requestMessage ||
            localRoom.requestText ||
            localRoom.requestMessage ||
            "",
        };
      }

      const localNoteTitle = getNoteTitle(localRoom);
      const serverNoteTitle = getNoteTitle(serverRoom);
      const localCategory = getNoteCategory(localRoom);
      const serverCategory = getNoteCategory(serverRoom);
      const localPostId = getNotePostId(localRoom);
      const serverPostId = getNotePostId(serverRoom);
      const localOpponent = getNoteOpponentName(localRoom);
      const serverOpponent = getNoteOpponentName(serverRoom);

      const finalNoteTitle = localNoteTitle || serverNoteTitle || "커뮤니티 글";
      const finalCategory = localCategory || serverCategory || "커뮤니티";
      const finalPostId = localPostId || serverPostId;
      const finalOpponent = serverOpponent || localOpponent || "상대방";

      return {
        ...localRoom,
        ...serverRoom,

        chatRoomId:
          serverRoom.chatRoomId ??
          serverRoom.id ??
          serverRoom.roomId ??
          localRoom.chatRoomId ??
          localRoom.id,

        id:
          serverRoom.chatRoomId ??
          serverRoom.id ??
          serverRoom.roomId ??
          localRoom.chatRoomId ??
          localRoom.id,

        type: serverRoom.type || serverRoom.chatRoomType || "DIRECT",
        myRole: serverRoom.myRole || serverRoom.role || localRoom.myRole,

        title: finalNoteTitle,
        communityPostTitle: finalNoteTitle,
        communityTitle: finalNoteTitle,
        postTitle: finalNoteTitle,
        roomName: finalNoteTitle,

        communityPostCategory: finalCategory,
        category: finalCategory,
        boardName: finalCategory,

        postId: finalPostId,
        postsId: finalPostId,
        communityId: finalPostId,
        communityPostId: finalPostId,

        opponentName: finalOpponent,

        sellerName:
          serverRoom.sellerName ||
          serverRoom.sellerNickname ||
          localRoom.sellerName ||
          localRoom.sellerNickname,

        lastMessage: serverRoom.lastMessage ?? localRoom.lastMessage ?? "",
        lastMessageTime:
          serverRoom.lastMessageTime ??
          serverRoom.lastMessageAt ??
          localRoom.lastMessageTime ??
          localRoom.lastMessageAt ??
          null,

        unreadCount: serverRoom.unreadCount ?? 0,
      };
    })
    .sort((a, b) => getRoomSortTime(b) - getRoomSortTime(a));
}

async function requestChatRoomsByUserId(userId: string | number) {
  try {
    const response = await apiRequest<any>("/api/chat-rooms", {
      method: "GET",
      query: {
        userId,
      },
    });

    return extractChatRooms(response);
  } catch (error) {
    console.log("/api/chat-rooms 채팅방 목록 조회 실패:", error);
    return [];
  }
}

async function fetchChatRoomsForCurrentUser() {
  const myUserId = await getStoredUserId();

  if (!myUserId) {
    console.log("채팅방 목록 조회 실패: 저장된 userId 없음");
    return [];
  }

  return requestChatRoomsByUserId(myUserId);
}

function normalizeChatRooms(response: unknown) {
  const rooms = extractChatRooms(response).filter((room: any) => {
    const id = getChatRoomId(room);
    return Number.isFinite(id);
  });

  const divideRooms = rooms
    .filter((room: any) => isDivideRoom(room))
    .map<DivideRoom>((room: any, index) => {
      const roomStatus = getRoomStatus(room);
      const role = getRawRoomRole(room);

      let normalizedRole: UserRole = "buyer";

      if (role === "SELLER") normalizedRole = "seller";
      else if (role === "MEMBER") normalizedRole = "member";
      else normalizedRole = "buyer";

      const albumImageUrl = getRoomAlbumImageUrl(room);

      return {
        id: getChatRoomId(room),
        title: getServerGroupTitle(room) || "분철 채팅방",
        organizer:
          room.sellerName ||
          room.sellerNickname ||
          room.organizer ||
          "판매자",
        memberCount: (() => {
          const currentMembers = Number(
            room.currentMembers ?? room.currentMemberCount ?? 1
          );

          const recruitMembers = Number(
            room.maxMembers ?? room.maxMemberCount ?? 0
          );

          const displayMaxMembers = recruitMembers > 0 ? recruitMembers + 1 : 1;

          return `${currentMembers}/${displayMaxMembers}명`;
        })(),
        lastMessage: room.lastMessage || "",
        time: formatChatTime(room.lastMessageTime ?? room.lastMessageAt),
        sortTime: getRoomSortTime(room),
        unreadCount: room.unreadCount ?? 0,
        status: roomStatus,
        color: roomStatus === "done" ? "gray" : getRoomColor(index),
        role: normalizedRole,
        reviewSubmitted: Boolean(room.reviewSubmitted),
        albumImageUrl,

        postId: getDividePostId(room) || undefined,

        buyerName: room.buyerName || room.buyerNickname || "",
        selectedMember: room.selectedMember || room.memberName || "",
        selectedPrice: room.selectedPrice ? String(room.selectedPrice) : "",
        receiverName: room.receiverName || room.realName || "",
        phoneNumber: room.phoneNumber || "",
        storeName: room.storeName || room.convenienceStore || "",
        requestText: room.requestText || room.requestMessage || "",
      };
    })
    .sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;

      const aSortTime = a.sortTime ?? 0;
      const bSortTime = b.sortTime ?? 0;

      if (aSortTime !== bSortTime) return bSortTime - aSortTime;

      return b.id - a.id;
    });

  const noteRooms = rooms
    .filter((room: any) => isNoteRoom(room))
    .map<NoteRoom>((room: any) => {
      const noteTitle = getNoteTitle(room);
      const category = getNoteCategory(room);
      const opponentName = getNoteOpponentName(room);
      const postId = getNotePostId(room);

      return {
        id: getChatRoomId(room),
        title: noteTitle || "커뮤니티 글",
        boardName: category,
        userName: opponentName || "상대방",
        lastMessage: room.lastMessage || "",
        time: formatChatTime(room.lastMessageTime ?? room.lastMessageAt),
        sortTime: getRoomSortTime(room),
        unreadCount: room.unreadCount ?? 0,

        postId,
        postsId: postId,
        communityId: postId,
      };
    })
    .sort((a, b) => {
      const aSortTime = a.sortTime ?? 0;
      const bSortTime = b.sortTime ?? 0;

      if (aSortTime !== bSortTime) return bSortTime - aSortTime;

      return b.id - a.id;
    });

  return { divideRooms, noteRooms };
}

export default function ChatsScreen() {
  const router = useRouter();

  const { removedChatRoomId, completedChatRoomId, reviewSubmittedChatRoomId } =
    useLocalSearchParams<{
      removedChatRoomId?: string;
      completedChatRoomId?: string;
      reviewSubmittedChatRoomId?: string;
    }>();

  const [selectedTab, setSelectedTab] = useState<ChatTab>("divide");
  const [divideRooms, setDivideRooms] = useState<DivideRoom[]>([]);
  const [noteRooms, setNoteRooms] = useState<NoteRoom[]>([]);
  const [isAnyRowOpen, setIsAnyRowOpen] = useState(false);

  const swipeRefs = useRef<Record<string, Swipeable | null>>({});
  const openedRowKey = useRef<string | null>(null);
  const removedIdRef = useRef<string | null>(null);
  const completedIdRef = useRef<string | null>(null);
  const reviewSubmittedIdRef = useRef<string | null>(null);

  const loadChatRooms = useCallback(async () => {
    try {
      const serverRooms = await fetchChatRoomsForCurrentUser();
      const localRooms = await loadSavedChatRooms();

      const mergedRooms = mergeServerRoomsWithLocalMetadata(
        serverRooms,
        localRooms
      );

      const normalized = normalizeChatRooms(mergedRooms);
      const storedTradeStatusMap = await loadStoredTradeStatusMap();
      const storedReviewSubmittedMap = await loadStoredReviewSubmittedMap();

      const divideRoomsWithLocalState = normalized.divideRooms.map((room) => {
        const roomId = String(room.id);
        const isDone =
          room.status === "done" || storedTradeStatusMap[roomId] === "거래 완료";

        return {
          ...room,
          status: isDone ? "done" : room.status,
          color: isDone ? "gray" : room.color,
          lastMessage: isDone
            ? room.lastMessage || "거래가 완료되었습니다."
            : room.lastMessage,
          reviewSubmitted:
            room.reviewSubmitted || storedReviewSubmittedMap[roomId] === true,
        };
      });

      console.log("채팅방 앨범 이미지 확인:", divideRoomsWithLocalState);

      setDivideRooms(sortDivideRooms(divideRoomsWithLocalState));
      setNoteRooms(normalized.noteRooms);
    } catch (error) {
      console.log("채팅방 목록 조회 실패:", error);

      setDivideRooms([]);
      setNoteRooms([]);
    }
  }, []);

  useEffect(() => {
    loadChatRooms();
  }, [loadChatRooms]);

  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
    }, [loadChatRooms])
  );

  useEffect(() => {
    if (!removedChatRoomId) return;
    if (removedIdRef.current === removedChatRoomId) return;

    removedIdRef.current = removedChatRoomId;

    const targetId = Number(removedChatRoomId);

    removeLocalChatRoom(removedChatRoomId);

    setDivideRooms((prev) => prev.filter((room) => room.id !== targetId));
    setNoteRooms((prev) => prev.filter((room) => room.id !== targetId));
  }, [removedChatRoomId]);

  useEffect(() => {
    if (!completedChatRoomId) return;
    if (completedIdRef.current === completedChatRoomId) return;

    completedIdRef.current = completedChatRoomId;

    const targetId = Number(completedChatRoomId);

    setDivideRooms((prev) =>
      sortDivideRooms(
        prev.map((room) =>
          room.id === targetId
            ? {
                ...room,
                status: "done",
                unreadCount: 0,
                lastMessage: "거래가 완료되었습니다.",
                time: "방금",
                sortTime: Date.now(),
                color: "gray",
              }
            : room
        )
      )
    );
  }, [completedChatRoomId]);

  useEffect(() => {
    if (!reviewSubmittedChatRoomId) return;
    if (reviewSubmittedChatRoomId.length === 0) return;
    if (reviewSubmittedIdRef.current === reviewSubmittedChatRoomId) return;

    reviewSubmittedIdRef.current = reviewSubmittedChatRoomId;

    const targetId = Number(reviewSubmittedChatRoomId);

    setDivideRooms((prev) =>
      prev.map((room) =>
        room.id === targetId
          ? {
              ...room,
              reviewSubmitted: true,
            }
          : room
      )
    );
  }, [reviewSubmittedChatRoomId]);

  const closeOpenedRow = () => {
    if (openedRowKey.current) {
      swipeRefs.current[openedRowKey.current]?.close();
      openedRowKey.current = null;
    }

    setIsAnyRowOpen(false);
  };

  const handleChangeTab = (tab: ChatTab) => {
    closeOpenedRow();
    setSelectedTab(tab);
  };

  const handlePressDivideRoom = (room: DivideRoom) => {
    if (openedRowKey.current) {
      closeOpenedRow();
      return;
    }

    router.push({
      pathname: "/chat/[chatRoomId]",
      params: {
        chatRoomId: String(room.id),
        type: "divide",
        role:
          room.role === "seller"
            ? "SELLER"
            : room.role === "member"
            ? "MEMBER"
            : "BUYER",

        title: room.title,
        roomName: room.title,

        sellerName: room.organizer,
        opponentName:
          room.role === "seller" ? room.buyerName || "" : room.organizer,

        buyerName: room.buyerName || "",

        selectedMember: room.selectedMember || "",
        selectedPrice: room.selectedPrice || "",

        receiverName: room.receiverName || "",
        phoneNumber: room.phoneNumber || "",
        storeName: room.storeName || "",
        requestText: room.requestText || "",

        status: room.status === "done" ? "거래 완료" : "모집 중",
        reviewSubmitted: room.reviewSubmitted ? "true" : "false",

        postId: room.postId || "",
        postsId: room.postId || "",
        id: room.postId || "",
      },
    } as any);
  };

  const handlePressNoteRoom = (room: NoteRoom) => {
    if (openedRowKey.current) {
      closeOpenedRow();
      return;
    }

    router.push({
      pathname: "/chat/[chatRoomId]",
      params: {
        chatRoomId: String(room.id),
        type: "note",
        role: "MEMBER",
        title: room.title,
        communityTitle: room.title,
        roomName: room.title,
        opponentName: room.userName,
        sellerName: room.userName,
        boardName: room.boardName,
        category: room.boardName,

        postId: room.postId || "",
        postsId: room.postsId || room.postId || "",
        communityId: room.communityId || room.postId || "",
        id: room.postId || "",
      },
    } as any);
  };

  const handleLeaveDivideRoom = (room: DivideRoom) => {
    Alert.alert("채팅방 나가기", "이 채팅방을 나가시겠어요?", [
      {
        text: "취소",
        style: "cancel",
        onPress: closeOpenedRow,
      },
      {
        text: "나가기",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveChatRoom(room.id);
          } catch (error) {
            console.log("서버 채팅방 나가기 실패:", error);
          } finally {
            await removeLocalChatRoom(room.id);

            setDivideRooms((prev) => prev.filter((item) => item.id !== room.id));
            closeOpenedRow();
          }
        },
      },
    ]);
  };

  const handleLeaveNoteRoom = (room: NoteRoom) => {
    Alert.alert("쪽지 나가기", "이 쪽지를 나가시겠어요?", [
      {
        text: "취소",
        style: "cancel",
        onPress: closeOpenedRow,
      },
      {
        text: "나가기",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveChatRoom(room.id);
          } catch (error) {
            console.log("서버 쪽지 나가기 실패:", error);
          } finally {
            await removeLocalChatRoom(room.id);

            setNoteRooms((prev) => prev.filter((item) => item.id !== room.id));
            closeOpenedRow();
          }
        },
      },
    ]);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>채팅</Text>
          </View>

          <View style={styles.tabContainer}>
            <TabButton
              title="분철"
              count={divideRooms.length}
              active={selectedTab === "divide"}
              onPress={() => handleChangeTab("divide")}
            />

            <TabButton
              title="쪽지"
              count={noteRooms.length}
              active={selectedTab === "note"}
              onPress={() => handleChangeTab("note")}
            />
          </View>

          <View style={styles.listWrap}>
            {selectedTab === "divide" ? (
              <FlatList
                data={divideRooms}
                keyExtractor={(item) => `divide-${item.id}`}
                renderItem={({ item }) => {
                  const rowKey = `divide-${item.id}`;

                  return (
                    <SwipeableRow
                      ref={(ref) => {
                        swipeRefs.current[rowKey] = ref;
                      }}
                      onOpen={() => {
                        if (
                          openedRowKey.current &&
                          openedRowKey.current !== rowKey
                        ) {
                          swipeRefs.current[openedRowKey.current]?.close();
                        }

                        openedRowKey.current = rowKey;
                        setIsAnyRowOpen(true);
                      }}
                      onClose={() => {
                        if (openedRowKey.current === rowKey) {
                          openedRowKey.current = null;
                          setIsAnyRowOpen(false);
                        }
                      }}
                      onLeave={() => handleLeaveDivideRoom(item)}
                    >
                      <DivideRoomItem
                        room={item}
                        onPress={() => handlePressDivideRoom(item)}
                      />
                    </SwipeableRow>
                  );
                }}
                ListEmptyComponent={
                  <EmptyState text="참여 중인 분철 채팅이 없어요." />
                }
                contentContainerStyle={[
                  styles.listContent,
                  divideRooms.length === 0 && styles.emptyListContent,
                ]}
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={closeOpenedRow}
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <FlatList
                data={noteRooms}
                keyExtractor={(item) => `note-${item.id}`}
                renderItem={({ item }) => {
                  const rowKey = `note-${item.id}`;

                  return (
                    <SwipeableRow
                      ref={(ref) => {
                        swipeRefs.current[rowKey] = ref;
                      }}
                      onOpen={() => {
                        if (
                          openedRowKey.current &&
                          openedRowKey.current !== rowKey
                        ) {
                          swipeRefs.current[openedRowKey.current]?.close();
                        }

                        openedRowKey.current = rowKey;
                        setIsAnyRowOpen(true);
                      }}
                      onClose={() => {
                        if (openedRowKey.current === rowKey) {
                          openedRowKey.current = null;
                          setIsAnyRowOpen(false);
                        }
                      }}
                      onLeave={() => handleLeaveNoteRoom(item)}
                    >
                      <NoteRoomItem
                        room={item}
                        onPress={() => handlePressNoteRoom(item)}
                      />
                    </SwipeableRow>
                  );
                }}
                ListEmptyComponent={<EmptyState text="주고받은 쪽지가 없어요." />}
                contentContainerStyle={[
                  styles.listContent,
                  noteRooms.length === 0 && styles.emptyListContent,
                ]}
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={closeOpenedRow}
                keyboardShouldPersistTaps="handled"
              />
            )}

            {isAnyRowOpen && (
              <Pressable style={styles.closeOverlay} onPress={closeOpenedRow} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function TabButton({
  title,
  count,
  active,
  onPress,
}: {
  title: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.tabButton}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.tabLabelRow}>
        <Text style={active ? styles.activeTabText : styles.tabText}>
          {title}
        </Text>

        <Text style={active ? styles.activeTabCount : styles.tabCount}>
          {count}
        </Text>
      </View>

      {active && <View style={styles.activeLine} />}
    </TouchableOpacity>
  );
}

const SwipeableRow = React.forwardRef<
  Swipeable,
  {
    children: React.ReactNode;
    onOpen: () => void;
    onClose: () => void;
    onLeave: () => void;
  }
>(({ children, onOpen, onClose, onLeave }, ref) => {
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const opacity = progress.interpolate({
      inputRange: [0, 0.25, 1],
      outputRange: [0, 1, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.rightActionWrap, { opacity }]}>
        <TouchableOpacity
          style={styles.leaveButton}
          activeOpacity={0.85}
          onPress={onLeave}
        >
          <Text style={styles.leaveText}>나가기</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={ref}
      friction={2}
      rightThreshold={34}
      overshootRight={false}
      renderRightActions={renderRightActions}
      onSwipeableOpen={onOpen}
      onSwipeableClose={onClose}
      containerStyle={styles.swipeContainer}
      childrenContainerStyle={styles.swipeChildren}
    >
      {children}
    </Swipeable>
  );
});

SwipeableRow.displayName = "SwipeableRow";

function DivideRoomItem({
  room,
  onPress,
}: {
  room: DivideRoom;
  onPress: () => void;
}) {
  const isDone = room.status === "done";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.divideItem,
        pressed && styles.pressedItem,
        isDone && styles.doneItem,
      ]}
      onPress={onPress}
    >
      <View style={[styles.albumIcon, getAlbumIconStyle(room.color)]}>
        {room.albumImageUrl ? (
          <Image
            key={room.albumImageUrl}
            source={{ uri: room.albumImageUrl }}
            style={styles.albumImage}
            resizeMode="cover"
            onLoad={() => {
              console.log("채팅방 앨범 이미지 로드 성공:", room.albumImageUrl);
            }}
            onError={(error) => {
              console.log(
                "채팅방 앨범 이미지 로드 실패:",
                room.albumImageUrl,
                error.nativeEvent
              );
            }}
          />
        ) : (
          <View style={[styles.albumIconCircle, getAlbumCircleStyle(room.color)]}>
            <View style={[styles.albumIconDot, getAlbumDotStyle(room.color)]} />
          </View>
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.topRow}>
          <Text
            style={[styles.chatTitle, isDone && styles.doneText]}
            numberOfLines={1}
          >
            {room.title}
          </Text>

          <Text style={styles.timeText}>{room.time}</Text>
        </View>

        <Text style={styles.metaText} numberOfLines={1}>
          {room.organizer} · {room.memberCount}
        </Text>

        <View style={styles.bottomRow}>
          <Text
            style={[styles.lastMessage, isDone && styles.doneText]}
            numberOfLines={1}
          >
            {room.lastMessage || "아직 메시지가 없어요."}
          </Text>

          {isDone && (
            <View style={styles.doneBadge}>
              <Text style={styles.doneBadgeText}>완료</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function NoteRoomItem({
  room,
  onPress,
}: {
  room: NoteRoom;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.noteItem, pressed && styles.pressedItem]}
      onPress={onPress}
    >
      <View style={styles.noteContent}>
        <View style={styles.noteTopRow}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {room.title}
          </Text>

          <Text style={styles.timeText}>{room.time}</Text>
        </View>

        <Text style={styles.noteMetaText} numberOfLines={1}>
          {room.boardName} · {room.userName}
        </Text>

        <View style={styles.noteBottomRow}>
          <Text style={styles.noteMessage} numberOfLines={1}>
            {room.lastMessage || "아직 메시지가 없어요."}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function getAlbumIconStyle(color: DivideRoom["color"]) {
  switch (color) {
    case "yellow":
      return styles.yellowIcon;
    case "purple":
      return styles.purpleIcon;
    case "pink":
      return styles.pinkIcon;
    case "gray":
      return styles.grayIcon;
  }
}

function getAlbumCircleStyle(color: DivideRoom["color"]) {
  switch (color) {
    case "yellow":
      return styles.yellowCircle;
    case "purple":
      return styles.purpleCircle;
    case "pink":
      return styles.pinkCircle;
    case "gray":
      return styles.grayCircle;
  }
}

function getAlbumDotStyle(color: DivideRoom["color"]) {
  switch (color) {
    case "yellow":
      return styles.yellowDot;
    case "purple":
      return styles.purpleDot;
    case "pink":
      return styles.pinkDot;
    case "gray":
      return styles.grayDot;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    height: 64,
    paddingHorizontal: SCREEN_PADDING,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.black,
  },
  tabContainer: {
    height: 48,
    paddingHorizontal: SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  tabButton: {
    marginRight: 36,
    paddingBottom: 12,
    position: "relative",
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.gray400,
  },
  activeTabText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.black,
  },
  tabCount: {
    marginLeft: 4,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.gray400,
  },
  activeTabCount: {
    marginLeft: 4,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.black,
  },
  activeLine: {
    position: "absolute",
    left: -2,
    right: -2,
    bottom: -1,
    height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.yellow,
  },
  listWrap: {
    flex: 1,
    position: "relative",
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  closeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: LEAVE_WIDTH,
    bottom: 0,
    backgroundColor: "transparent",
  },
  swipeContainer: {
    width: "100%",
    backgroundColor: COLORS.red,
    overflow: "hidden",
  },
  swipeChildren: {
    width: "100%",
    backgroundColor: COLORS.white,
  },
  rightActionWrap: {
    width: LEAVE_WIDTH,
    alignSelf: "stretch",
    backgroundColor: COLORS.red,
  },
  leaveButton: {
    flex: 1,
    width: LEAVE_WIDTH,
    height: "100%",
    backgroundColor: COLORS.red,
    justifyContent: "center",
    alignItems: "center",
  },
  leaveText: {
    width: LEAVE_WIDTH,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },
  divideItem: {
    minHeight: 98,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 16,
  },
  noteItem: {
    minHeight: 91,
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingHorizontal: 28,
    paddingVertical: 15,
  },
  pressedItem: {
    opacity: 0.72,
  },
  doneItem: {
    opacity: 0.55,
  },
  albumIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  albumImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  albumIconCircle: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  albumIconDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  yellowIcon: {
    backgroundColor: "#FFF8DE",
  },
  yellowCircle: {
    borderColor: "#E3B600",
  },
  yellowDot: {
    backgroundColor: "#E3B600",
  },
  purpleIcon: {
    backgroundColor: "#F0F0FF",
  },
  purpleCircle: {
    borderColor: "#6A6FD6",
  },
  purpleDot: {
    backgroundColor: "#6A6FD6",
  },
  pinkIcon: {
    backgroundColor: "#FFF0F5",
  },
  pinkCircle: {
    borderColor: "#E23D6B",
  },
  pinkDot: {
    backgroundColor: "#E23D6B",
  },
  grayIcon: {
    backgroundColor: "#EFEFEF",
  },
  grayCircle: {
    borderColor: "#A9A9A9",
  },
  grayDot: {
    backgroundColor: "#A9A9A9",
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.black,
    marginRight: 10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B6B6B6",
  },
  metaText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "500",
    color: "#9D9D9D",
  },
  bottomRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#777777",
    marginRight: 10,
  },
  doneBadge: {
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: "#CFCFCF",
    justifyContent: "center",
    alignItems: "center",
  },
  doneBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  doneText: {
    color: "#9A9A9A",
  },
  noteContent: {
    flex: 1,
    minWidth: 0,
  },
  noteTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.black,
    marginRight: 10,
  },
  noteMetaText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "500",
    color: "#9D9D9D",
  },
  noteBottomRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  noteMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#777777",
    marginRight: 10,
  },
  emptyState: {
    flex: 1,
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray400,
    textAlign: "center",
  },
});