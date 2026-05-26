import { Ionicons } from "@expo/vector-icons";
import { Client } from "@stomp/stompjs";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import SockJS from "sockjs-client";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getChatMessages } from "../../services/chat";
import { getMyProfile } from "../../services/user";
import { getStoredUserId } from "../../utils/api";
import type { ChatMessageApiItem } from "../../types/chat";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray200: "#EEEEEE",
  gray100: "#F7F7F7",
  yellow: "#F7C94B",
  yellowDisabled: "#E8D38E",
  yellowLight: "#FFF6D8",
  line: "#F0F0F0",
};

const DEFAULT_PANEL_HEIGHT = 300;
const INPUT_BAR_HEIGHT = 55;

const TRADE_COMPLETE_TEXT = "거래가 완료되었습니다.";
const TRADE_CANCEL_TEXT = "거래가 취소되었습니다.";

const TRADE_STATUS_STORAGE_KEY = "GO_REUDEOK_CHAT_TRADE_STATUS";
const REVIEW_SUBMITTED_STORAGE_KEY = "GO_REUDEOK_CHAT_REVIEW_SUBMITTED";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://172.20.99.65:8080"
).replace(/\/$/, "");

const WS_URL = `${API_BASE_URL}/ws`;

type TradeStatus =
  | "모집 중"
  | "모집 완료"
  | "배송 중"
  | "거래 완료"
  | "거래 취소";

type MessageType =
  | "system"
  | "me"
  | "other"
  | "image"
  | "otherImage"
  | "trade"
  | "fraudWarning"
  | "fraudDanger";

type Message = {
  id: string;
  type: MessageType;
  text?: string;
  time?: string;
  nickname?: string;
  initial?: string;
  color?: string;
  initialColor?: string;
  imageUrl?: string;
};

type ChatRoomMenuInfo = {
  title?: string;
  postId?: string | number;
  postsId?: string | number;
  id?: string | number;
  communityId?: string | number;
  communityPostId?: string | number;
  post?: {
    postId?: string | number;
    postsId?: string | number;
    id?: string | number;
    communityId?: string | number;
  };
  participants?: {
    userId?: number | string;
    nickname?: string;
    memberName?: string;
    role?: string;
  }[];
};

function getFirstText(...values: Array<string | undefined>) {
  return values.map((value) => (value ?? "").trim()).find(Boolean) ?? "";
}

function getFirstValueText(...values: any[]) {
  return values
    .map((value) =>
      value === null || value === undefined ? "" : String(value).trim()
    )
    .find(Boolean) ?? "";
}

async function getChatRoomMenuInfo(
  chatRoomId: string,
  userId: string,
): Promise<ChatRoomMenuInfo | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/chat-rooms/${chatRoomId}/menu?userId=${userId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const text = await response.text();
  let data: ChatRoomMenuInfo | null = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data as any)?.message || "채팅방 정보를 불러오지 못했습니다.");
  }

  return data;
}

function getParamString(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function cleanParamName(value?: string | string[]) {
  const raw = getParamString(value).trim();

  if (!raw) return "";
  if (raw === "나") return "";
  if (raw === "본인") return "";
  if (raw.toLowerCase() === "me") return "";
  if (raw === "구매자") return "";
  if (raw === "판매자") return "";

  return raw;
}

function normalizeTradeStatus(value?: string | string[]): TradeStatus {
  const status = getParamString(value);

  if (
    status === "모집 완료" ||
    status === "배송 중" ||
    status === "거래 완료" ||
    status === "거래 취소"
  ) {
    return status;
  }

  return "모집 중";
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

async function getStoredTradeStatus(chatRoomId: string): Promise<TradeStatus | null> {
  const map = await readJsonMap(TRADE_STATUS_STORAGE_KEY);
  const savedStatus = map[String(chatRoomId)];

  if (
    savedStatus === "모집 완료" ||
    savedStatus === "배송 중" ||
    savedStatus === "거래 완료" ||
    savedStatus === "거래 취소"
  ) {
    return savedStatus;
  }

  return null;
}

async function saveStoredTradeStatus(chatRoomId: string, status: TradeStatus) {
  try {
    const map = await readJsonMap(TRADE_STATUS_STORAGE_KEY);
    map[String(chatRoomId)] = status;
    await AsyncStorage.setItem(TRADE_STATUS_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.log("거래 상태 저장 실패:", error);
  }
}

async function getStoredReviewSubmitted(chatRoomId: string) {
  const map = await readJsonMap(REVIEW_SUBMITTED_STORAGE_KEY);
  return map[String(chatRoomId)] === true;
}

async function saveStoredReviewSubmitted(chatRoomId: string) {
  try {
    const map = await readJsonMap(REVIEW_SUBMITTED_STORAGE_KEY);
    map[String(chatRoomId)] = true;
    await AsyncStorage.setItem(REVIEW_SUBMITTED_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.log("후기 작성 여부 저장 실패:", error);
  }
}

function formatMessageTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isFraudApiMessage(message: any) {
  return (
    message?.messageType === "FRAUD_WARNING" ||
    message?.messageType === "FRAUD_DANGER"
  );
}

function isTrackingApiMessage(message: any) {
  const messageType = String(message?.messageType ?? "").toUpperCase();
  const content = String(message?.content ?? "");

  return (
    messageType === "TRACKING_SHARED" ||
    messageType === "TRACKING_SHARE" ||
    messageType === "DELIVERY_TRACKING" ||
    messageType === "TRACKING_NUMBER" ||
    (messageType !== "TEXT" && content.includes("운송장"))
  );
}

function getFraudReasonText(value?: string) {
  const reason = (value ?? "").trim();

  if (!reason) return "거래 안전 확인이 필요한 문구예요.";

  if (reason.includes("빈 메시지")) {
    return "비정상적인 메시지 패턴이 감지됐어요.";
  }

  if (reason.includes("규칙 기반") || reason.includes("필터")) {
    return "거래 안전 확인이 필요한 표현이 감지됐어요.";
  }

  return reason;
}

function toAbsoluteImageUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

function getImageName(uri: string) {
  const rawName = uri.split("/").pop() || `chat-image-${Date.now()}.jpg`;
  return rawName.includes(".") ? rawName : `${rawName}.jpg`;
}

function getImageMimeType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
}

async function uploadImageToServer(uri: string) {
  const formData = new FormData();

  formData.append("image", {
    uri,
    name: getImageName(uri),
    type: getImageMimeType(uri),
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/posts/upload-image`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "이미지 업로드에 실패했습니다.");
  }

  const imageUrl = data?.imageUrl;
  if (!imageUrl) {
    throw new Error("업로드된 이미지 URL을 받지 못했습니다.");
  }

  return toAbsoluteImageUrl(imageUrl);
}

function ensureStatusMessage(messages: Message[], status: TradeStatus) {
  const text =
    status === "거래 완료"
      ? TRADE_COMPLETE_TEXT
      : status === "거래 취소"
        ? TRADE_CANCEL_TEXT
        : "";

  if (!text) return messages;

  const alreadyExists = messages.some(
    (message) => message.type === "trade" && message.text === text,
  );

  if (alreadyExists) return messages;

  return [
    ...messages,
    {
      id: `trade-${status}-${Date.now()}`,
      type: "trade" as const,
      text,
    },
  ];
}

function normalizeChatMessage(
  message: ChatMessageApiItem | any,
  myUserId?: string | number | null,
): Message | null {
  const messageType = message.messageType;

  if (isTrackingApiMessage(message)) {
    return null;
  }

  if (messageType === "TRANSACTION_COMPLETE") {
    return {
      id: String(message.messageId ?? `trade-${Date.now()}`),
      type: "trade",
      text: message.content || TRADE_COMPLETE_TEXT,
      time: formatMessageTime(message.createdAt),
    };
  }

  if (messageType === "FRAUD_WARNING" || messageType === "FRAUD_DANGER") {
    return {
      id: String(
        message.messageId ??
          `fraud-${messageType}-${Date.now()}-${Math.random()}`,
      ),
      type: messageType === "FRAUD_DANGER" ? "fraudDanger" : "fraudWarning",
      text: getFraudReasonText(message.reason || message.content),
      time: formatMessageTime(message.createdAt),
    };
  }

  if (message.senderId === null || message.senderNickname === "SYSTEM") {
    return {
      id: String(message.messageId ?? `system-${Date.now()}`),
      type: "system",
      text: message.content ?? "",
    };
  }

  if (messageType === "IMAGE") {
    const isMine =
      myUserId != null && String(message.senderId) === String(myUserId);
    const imageUrl = toAbsoluteImageUrl(
      message.content ?? message.imageUrl ?? "",
    );

    if (isMine) {
      return {
        id: String(message.messageId ?? `image-${Date.now()}`),
        type: "image",
        imageUrl,
        time: formatMessageTime(message.createdAt),
      };
    }

    const nickname = message.senderNickname || "상대방";

    return {
      id: String(message.messageId ?? `image-${Date.now()}`),
      type: "otherImage",
      nickname,
      initial: nickname.slice(0, 1),
      color: COLORS.yellowLight,
      initialColor: COLORS.gray700,
      imageUrl,
      time: formatMessageTime(message.createdAt),
    };
  }

  const isMine =
    myUserId != null && String(message.senderId) === String(myUserId);

  if (isMine) {
    return {
      id: String(message.messageId ?? `message-${Date.now()}`),
      type: "me",
      text: message.content ?? "",
      time: formatMessageTime(message.createdAt),
    };
  }

  const nickname = message.senderNickname || "상대방";

  return {
    id: String(message.messageId ?? `message-${Date.now()}`),
    type: "other",
    nickname,
    initial: nickname.slice(0, 1),
    color: COLORS.yellowLight,
    initialColor: COLORS.gray700,
    text: message.content ?? "",
    time: formatMessageTime(message.createdAt),
  };
}

function normalizeChatMessages(
  apiMessages: ChatMessageApiItem[],
  myUserId?: string | number | null,
): Message[] {
  return apiMessages
    .filter((message) => !isFraudApiMessage(message))
    .map((message) => normalizeChatMessage(message, myUserId))
    .filter((message): message is Message => message !== null);
}

export default function ChatRoomDetailScreen() {
  const insets = useSafeAreaInsets();

  const {
    chatRoomId,
    role,
    title,
    postTitle,
    communityTitle,
    roomName,
    sellerName,
    buyerName,
    opponentName,
    writerName,
    writerId,
    selectedMember,
    receiverName,
    phoneNumber,
    storeName,
    requestText,
    requestMessage,
    type,
    tradeEvent,
    status,
    reviewSubmitted,
    postId,
    postsId,
    id,
    communityId,
    sellerUserId: routeSellerUserId,
    targetUserId,
  } = useLocalSearchParams<{
    chatRoomId: string;
    role?: string;
    title?: string;
    postTitle?: string;
    communityTitle?: string;
    roomName?: string;
    sellerName?: string;
    buyerName?: string;
    opponentName?: string;
    writerName?: string;
    writerId?: string;
    selectedMember?: string;
    receiverName?: string;
    phoneNumber?: string;
    storeName?: string;
    requestText?: string;
    requestMessage?: string;
    type?: string;
    tradeEvent?: string;
    status?: string;
    reviewSubmitted?: string;
    postId?: string;
    postsId?: string;
    id?: string;
    communityId?: string;
    sellerUserId?: string;
    targetUserId?: string;
  }>();

  const normalizedRole = getParamString(role).trim().toLowerCase();
  const normalizedType = getParamString(type).trim().toLowerCase();

  const [myNickname, setMyNickname] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [menuTitle, setMenuTitle] = useState("");
  const [menuOpponentName, setMenuOpponentName] = useState("");
  const [menuCommunityPostId, setMenuCommunityPostId] = useState("");
  const [menuMyRole, setMenuMyRole] = useState("");
  const [sellerUserId, setSellerUserId] = useState(() =>
    getFirstValueText(targetUserId, routeSellerUserId),
  );
  const [isChatConnected, setIsChatConnected] = useState(false);

  const effectiveRole = normalizedRole || menuMyRole;

  const isNote =
    normalizedType === "note" ||
    normalizedType === "direct" ||
    normalizedType === "community" ||
    (!normalizedType && !effectiveRole);
  const isSeller = !isNote && effectiveRole === "seller";
  const isBuyer = !isNote && !isSeller;
  const currentRole = isSeller ? "seller" : "buyer";

  useEffect(() => {
    const loadMyProfile = async () => {
      try {
        const profile = await getMyProfile();
        setMyNickname(profile.nickname ?? "");
      } catch (error) {
        console.log("내 프로필 조회 실패:", error);
      }
    };

    const loadMyUserId = async () => {
      try {
        const storedUserId = await getStoredUserId();
        setMyUserId(storedUserId ? String(storedUserId) : null);
      } catch (error) {
        console.log("내 userId 조회 실패:", error);
      }
    };

    loadMyProfile();
    loadMyUserId();
  }, []);

  useEffect(() => {
    if (!chatRoomId || !myUserId) return;

    const loadChatRoomMenu = async () => {
      try {
        const menu = await getChatRoomMenuInfo(String(chatRoomId), String(myUserId));

        const nextTitle = getFirstText(
          menu?.title,
          (menu as any)?.postTitle,
          (menu as any)?.communityTitle,
          (menu as any)?.roomName,
          (menu as any)?.chatRoomTitle,
        );

        const nextOpponentName = getFirstText(
          menu?.participants?.[0]?.nickname,
          (menu as any)?.opponentNickname,
          (menu as any)?.opponentName,
          (menu as any)?.sellerNickname,
          (menu as any)?.buyerNickname,
        );

        const nextCommunityPostId = getFirstValueText(
          menu?.postId,
          menu?.postsId,
          menu?.communityPostId,
          menu?.communityId,
          menu?.post?.postId,
          menu?.post?.postsId,
          menu?.post?.id,
          menu?.post?.communityId,
        );

        const nextMyRole = getFirstText(
          (menu as any)?.myRole,
          (menu as any)?.role,
        ).toLowerCase();

        const sellerParticipant = menu?.participants?.find(
          (participant) =>
            String(participant.role ?? "").trim().toLowerCase() === "seller",
        );

        const nextSellerUserId = getFirstValueText(
          sellerParticipant?.userId,
          (menu as any)?.sellerUserId,
          (menu as any)?.sellerId,
          (menu as any)?.seller?.sellerId,
          (menu as any)?.seller?.userId,
        );

        if (nextTitle) setMenuTitle(nextTitle);
        if (nextOpponentName) setMenuOpponentName(nextOpponentName);
        if (nextCommunityPostId) setMenuCommunityPostId(nextCommunityPostId);
        if (nextMyRole === "seller" || nextMyRole === "buyer") {
          setMenuMyRole(nextMyRole);
        }

        if (nextMyRole === "seller") {
          setSellerUserId(String(myUserId));
        } else if (nextSellerUserId) {
          setSellerUserId(nextSellerUserId);
        }
      } catch (error) {
        console.log("채팅방 메뉴 정보 조회 실패:", error);
      }
    };

    loadChatRoomMenu();
  }, [chatRoomId, myUserId]);

  const routeTitle = getFirstText(
    getParamString(communityTitle),
    getParamString(postTitle),
    getParamString(roomName),
    getParamString(title),
  );

  const roomTitle =
    routeTitle || menuTitle || (isNote ? "쪽지" : "분철 채팅방");

  const currentCommunityPostId = getFirstValueText(
    postId,
    postsId,
    communityId,
    id,
    menuCommunityPostId,
  );

  const routeOpponentName = getFirstText(
    cleanParamName(opponentName),
    cleanParamName(writerName),
    cleanParamName(writerId),
    cleanParamName(sellerName),
    cleanParamName(buyerName),
  );

  const sellerDisplayName =
    cleanParamName(sellerName) ||
    (isBuyer ? routeOpponentName : "") ||
    menuOpponentName ||
    "상대방";

  const rawBuyerName =
    cleanParamName(buyerName) ||
    (isBuyer ? cleanParamName(myNickname) : "") ||
    (isSeller ? routeOpponentName : "") ||
    menuOpponentName;

  const buyerDisplayName =
    rawBuyerName && rawBuyerName !== sellerDisplayName ? rawBuyerName : "";

  const opponentDisplayName =
    menuOpponentName ||
    routeOpponentName ||
    (isBuyer ? sellerDisplayName : buyerDisplayName) ||
    "상대방";

  const selectedMemberName = getParamString(selectedMember);
  const receiver = getParamString(receiverName);
  const phone = getParamString(phoneNumber);
  const store = getParamString(storeName);
  const request = getParamString(requestMessage) || getParamString(requestText);

  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const startDragY = useRef(0);
  const appliedTradeEvent = useRef<string | null>(null);
  const stompClientRef = useRef<Client | null>(null);

  const lastKeyboardHeight = useRef(DEFAULT_PANEL_HEIGHT);
  const openedPlusFromKeyboard = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isReturningKeyboard, setIsReturningKeyboard] = useState(false);
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [storedTradeStatus, setStoredTradeStatusState] =
    useState<TradeStatus | null>(null);
  const [isReviewSubmittedState, setIsReviewSubmittedState] = useState(
    reviewSubmitted === "true",
  );

  const routeStatus: TradeStatus = normalizeTradeStatus(status);
  const currentStatus: TradeStatus = storedTradeStatus ?? routeStatus;
  const hasCompletedTradeMessage = messages.some(
    (message) => message.type === "trade" && message.text === TRADE_COMPLETE_TEXT,
  );

  const effectiveTradeStatus: TradeStatus =
    currentStatus !== "거래 취소" && hasCompletedTradeMessage
      ? "거래 완료"
      : currentStatus;
  const isCompleted = effectiveTradeStatus === "거래 완료";
  const isReviewSubmitted = reviewSubmitted === "true" || isReviewSubmittedState;

  const keyboardSpace = Math.max(keyboardHeight - insets.bottom, 0);

  const plusPanelHeight = Math.max(
    lastKeyboardHeight.current - insets.bottom,
    DEFAULT_PANEL_HEIGHT,
  );

  const bottomSpace = isKeyboardVisible
    ? keyboardSpace
    : isPlusOpen || isReturningKeyboard
      ? plusPanelHeight
      : 0;

  const scrollExtraSpace = isKeyboardVisible || isPlusOpen ? bottomSpace : 0;

  const runLayout = (duration = 210) => {
    LayoutAnimation.configureNext({
      duration,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  };

  const scrollToBottom = (delay = 70) => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  useEffect(() => {
    if (!chatRoomId || isNote) return;

    const loadStoredTradeState = async () => {
      const savedStatus = await getStoredTradeStatus(String(chatRoomId));
      const savedReviewSubmitted = await getStoredReviewSubmitted(String(chatRoomId));

      if (savedStatus) {
        setStoredTradeStatusState(savedStatus);
      }

      if (savedReviewSubmitted) {
        setIsReviewSubmittedState(true);
      }
    };

    loadStoredTradeState();
  }, [chatRoomId, isNote]);

  useEffect(() => {
    if (!chatRoomId) return;
    if (reviewSubmitted !== "true") return;

    setIsReviewSubmittedState(true);
    saveStoredReviewSubmitted(String(chatRoomId));
  }, [chatRoomId, reviewSubmitted]);

  useEffect(() => {
    if (!chatRoomId || !myUserId) return;

    const loadMessages = async () => {
      try {
        const response = await getChatMessages(chatRoomId);
        const normalized = normalizeChatMessages(response, myUserId);
        const hasServerCompleteMessage = normalized.some(
          (message) =>
            message.type === "trade" && message.text === TRADE_COMPLETE_TEXT,
        );

        if (hasServerCompleteMessage) {
          setStoredTradeStatusState("거래 완료");
          saveStoredTradeStatus(String(chatRoomId), "거래 완료");
        }

        if (normalized.length > 0) {
          setMessages(
            hasServerCompleteMessage
              ? normalized
              : storedTradeStatus === "거래 완료"
                ? ensureStatusMessage(normalized, "거래 완료")
                : normalized,
          );
        } else {
          const startText = opponentDisplayName
            ? `${opponentDisplayName} 님과의 채팅방이 시작되었어요`
            : "채팅방이 시작되었어요";

          setMessages([
            {
              id: "system-created",
              type: "system",
              text: startText,
            },
          ]);
        }
      } catch (error) {
        console.log("채팅 메시지 조회 실패:", error);

        const startText = isBuyer
          ? `${sellerDisplayName} 님과의 채팅방이 시작되었어요`
          : buyerDisplayName
            ? `${buyerDisplayName} 님과의 채팅방이 시작되었어요`
            : "채팅방이 시작되었어요";

        setMessages([
          {
            id: "system-created",
            type: "system",
            text: startText,
          },
        ]);
      } finally {
        appliedTradeEvent.current = null;
        scrollToBottom(120);
      }
    };

    loadMessages();
  }, [chatRoomId, opponentDisplayName, myUserId, storedTradeStatus]);

  useEffect(() => {
    if (!chatRoomId || !myUserId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as any,
      reconnectDelay: 3000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,

      onConnect: () => {
        setIsChatConnected(true);
        console.log("채팅 연결됨:", WS_URL);

        client.subscribe(`/sub/chat/rooms/${chatRoomId}`, (frame) => {
          try {
            const apiMessage = JSON.parse(frame.body);

            const normalized = normalizeChatMessage(apiMessage, myUserId);

            if (!normalized) return;

            setMessages((prev) => {
              const alreadyExists = prev.some(
                (message) => message.id === normalized.id,
              );

              if (alreadyExists) return prev;

              return [...prev, normalized];
            });

            scrollToBottom(80);
          } catch (error) {
            console.log("채팅 수신 파싱 오류:", error);
          }
        });
      },

      onDisconnect: () => {
        setIsChatConnected(false);
        console.log("채팅 연결 해제");
      },

      onStompError: (frame) => {
        setIsChatConnected(false);
        console.log("STOMP 오류:", frame.headers?.message, frame.body);
      },

      onWebSocketError: (error) => {
        setIsChatConnected(false);
        console.log("WebSocket 오류:", error);
      },

      onWebSocketClose: (event) => {
        setIsChatConnected(false);
        console.log("채팅 소켓 닫힘:", event.code, event.reason);
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      setIsChatConnected(false);
      stompClientRef.current = null;
      client.deactivate();
    };
  }, [chatRoomId, myUserId]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const nextHeight = e.endCoordinates?.height ?? DEFAULT_PANEL_HEIGHT;

      if (Keyboard.scheduleLayoutAnimation && Platform.OS === "ios") {
        Keyboard.scheduleLayoutAnimation(e);
      } else {
        runLayout(210);
      }

      lastKeyboardHeight.current = nextHeight;
      setKeyboardHeight(nextHeight);
      setIsKeyboardVisible(true);
      setIsReturningKeyboard(false);

      if (isPlusOpen) {
        setIsPlusOpen(false);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      if (Keyboard.scheduleLayoutAnimation && Platform.OS === "ios") {
        Keyboard.scheduleLayoutAnimation(e);
      } else {
        runLayout(210);
      }

      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isPlusOpen]);

  useEffect(() => {
    if (isNote) return;
    if (!tradeEvent) return;
    if (appliedTradeEvent.current === tradeEvent) return;

    appliedTradeEvent.current = tradeEvent;

    const nextStatus: TradeStatus | null =
      tradeEvent === "completed"
        ? "거래 완료"
        : tradeEvent === "canceled"
          ? "거래 취소"
          : null;

    if (!nextStatus) return;

    setStoredTradeStatusState(nextStatus);
    saveStoredTradeStatus(String(chatRoomId), nextStatus);
    setMessages((prev: Message[]) => ensureStatusMessage(prev, nextStatus));
    scrollToBottom(100);
  }, [tradeEvent, isNote]);

  useEffect(() => {
    if (isNote) return;
    if (effectiveTradeStatus !== "거래 완료") return;

    setStoredTradeStatusState("거래 완료");
    saveStoredTradeStatus(String(chatRoomId), "거래 완료");
    setMessages((prev: Message[]) => ensureStatusMessage(prev, "거래 완료"));
    scrollToBottom(100);
  }, [chatRoomId, effectiveTradeStatus, isNote]);

  const handleBack = () => {
    if (!isNote && isCompleted) {
      router.replace({
        pathname: "/(tabs)/chats",
        params: {
          completedChatRoomId: chatRoomId,
          reviewSubmittedChatRoomId: isReviewSubmitted ? chatRoomId : "",
        },
      } as any);
      return;
    }

    router.back();
  };

  const handleOpenMenu = () => {
    router.push({
      pathname: "/chat/menu",
      params: {
        chatRoomId,
        type: isNote ? "note" : "divide",
        role: currentRole,
        title: roomTitle,
        status: effectiveTradeStatus,
        reviewSubmitted: isReviewSubmitted ? "true" : "false",

        opponentName: isSeller ? buyerDisplayName : sellerDisplayName,
        sellerName: sellerDisplayName,
        buyerName: buyerDisplayName,
        myNickname,
        currentUserNickname: myNickname,

        selectedMember: selectedMemberName,
        receiverName: receiver,
        phoneNumber: phone,
        storeName: store,
        requestMessage: request,
        postId: currentCommunityPostId,
        postsId: currentCommunityPostId,
        id: currentCommunityPostId,
        communityId: currentCommunityPostId,
      },
    } as any);
  };

  const closePlusMenu = () => {
    if (!isPlusOpen) return;

    runLayout(210);
    openedPlusFromKeyboard.current = false;
    setIsReturningKeyboard(false);
    setIsPlusOpen(false);
  };

  const handlePlusPress = () => {
    if (isPlusOpen) {
      const shouldReturnKeyboard = openedPlusFromKeyboard.current;

      runLayout(210);
      setIsPlusOpen(false);

      if (shouldReturnKeyboard) {
        setIsReturningKeyboard(true);

        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });

        scrollToBottom(140);
      } else {
        openedPlusFromKeyboard.current = false;
        setIsReturningKeyboard(false);
        scrollToBottom(80);
      }

      return;
    }

    if (isKeyboardVisible) {
      openedPlusFromKeyboard.current = true;

      runLayout(210);
      setIsPlusOpen(true);
      inputRef.current?.blur();
      Keyboard.dismiss();

      scrollToBottom(100);
      return;
    }

    openedPlusFromKeyboard.current = false;
    setIsReturningKeyboard(false);

    runLayout(210);
    setIsPlusOpen(true);
    scrollToBottom(100);
  };

  const handleInputFocus = () => {
    if (isPlusOpen) {
      runLayout(210);
      setIsPlusOpen(false);
    }

    openedPlusFromKeyboard.current = false;
    setIsReturningKeyboard(false);
    scrollToBottom(100);
  };

  const handleSend = () => {
    const content = inputText.trim();
    if (!content) return;

    if (!myUserId) {
      Alert.alert("전송 실패", "로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    if (!stompClientRef.current || !stompClientRef.current.connected) {
      Alert.alert("전송 실패", "채팅 서버에 연결되지 않았습니다.");
      return;
    }

    try {
      stompClientRef.current.publish({
        destination: "/pub/chat/message",
        body: JSON.stringify({
          chatRoomId: Number(chatRoomId),
          senderId: Number(myUserId),
          content,
          messageType: "TEXT",
        }),
      });

      setInputText("");
      scrollToBottom(90);
    } catch (error) {
      console.log("메시지 전송 실패:", error);
      Alert.alert("전송 실패", "메시지를 보내지 못했습니다.");
    }
  };

  const handleImagePress = async () => {
    closePlusMenu();

    if (!myUserId) {
      Alert.alert("전송 실패", "로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    if (!stompClientRef.current || !stompClientRef.current.connected) {
      Alert.alert("전송 실패", "채팅 서버에 연결되지 않았습니다.");
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "권한 필요",
          "사진을 보내려면 앨범 접근 권한이 필요합니다.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setIsSendingImage(true);

      const imageUrl = await uploadImageToServer(result.assets[0].uri);

      stompClientRef.current.publish({
        destination: "/pub/chat/message",
        body: JSON.stringify({
          chatRoomId: Number(chatRoomId),
          senderId: Number(myUserId),
          content: imageUrl,
          messageType: "IMAGE",
        }),
      });

      scrollToBottom(100);
    } catch (error: any) {
      console.log("이미지 전송 실패:", error);
      Alert.alert("전송 실패", error?.message || "사진을 보내지 못했습니다.");
    } finally {
      setIsSendingImage(false);
    }
  };

  const handleTrackingPress = () => {
    closePlusMenu();

    router.push({
      pathname: "/chat/tracking-share",
      params: {
        chatRoomId,
        role: currentRole,
      },
    } as any);
  };

  const handleDeliveryStatusPress = () => {
    closePlusMenu();

    router.push({
      pathname: "/chat/tracking-status",
      params: {
        chatRoomId,
        role: "buyer",
        title: roomTitle,
        status: effectiveTradeStatus,
        sellerName: sellerDisplayName,
        buyerName: buyerDisplayName,
        selectedMember: selectedMemberName,
        mode: "view",
      },
    } as any);
  };

  const handleReviewPress = () => {
    if (isReviewSubmitted) return;

    if (!myUserId) {
      Alert.alert("오류", "로그인 정보를 찾지 못했어요.");
      return;
    }

    if (!sellerUserId) {
      Alert.alert(
        "오류",
        "후기 대상 판매자 정보를 찾지 못했어요. 채팅방을 다시 열어주세요.",
      );
      return;
    }

    router.push({
      pathname: "/chat/review-write",
      params: {
        chatRoomId,
        role: currentRole,
        title: roomTitle,
        status: "거래 완료",
        reviewerId: String(myUserId),
        targetUserId: String(sellerUserId),
        sellerName: sellerDisplayName || "판매자",
        reviewSubmitted: isReviewSubmitted ? "true" : "false",
      },
    } as any);
  };

  const handleChatAreaTouch = () => {
    closePlusMenu();
  };

  const handleScrollBeginDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    startDragY.current = event.nativeEvent.contentOffset.y;

    if (isPlusOpen) {
      closePlusMenu();
    }
  };

  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const endY = event.nativeEvent.contentOffset.y;

    if (endY < startDragY.current - 8) {
      Keyboard.dismiss();
      closePlusMenu();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {roomTitle}
          </Text>

          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={handleOpenMenu}
          >
            <Ionicons name="menu" size={24} color={COLORS.gray700} />
          </TouchableOpacity>
        </View>

        <View style={styles.chatPressArea} onTouchStart={handleChatAreaTouch}>
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={[
              styles.chatContent,
              {
                paddingBottom: INPUT_BAR_HEIGHT + 10 + scrollExtraSpace,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
          >
            <View style={styles.dateWrap}>
              <Text style={styles.dateText}>오늘</Text>
            </View>

            {messages.map((message) => {
              if (
                message.type === "fraudWarning" ||
                message.type === "fraudDanger"
              ) {
                return (
                  <FraudMessage
                    key={message.id}
                    level={message.type === "fraudDanger" ? "danger" : "warning"}
                    text={message.text ?? ""}
                  />
                );
              }

              if (message.type === "system") {
                return (
                  <SystemMessage key={message.id} text={message.text ?? ""} />
                );
              }

              if (message.type === "trade" && !isNote) {
                return (
                  <TradeMessage
                    key={message.id}
                    text={message.text ?? ""}
                    showReviewButton={
                      isBuyer &&
                      isCompleted &&
                      message.text === TRADE_COMPLETE_TEXT
                    }
                    reviewSubmitted={isReviewSubmitted}
                    onReviewPress={handleReviewPress}
                  />
                );
              }

              if (message.type === "me") {
                return (
                  <MyMessage
                    key={message.id}
                    text={message.text ?? ""}
                    time={message.time}
                  />
                );
              }

              if (message.type === "image") {
                return (
                  <ImageMessage
                    key={message.id}
                    imageUrl={message.imageUrl}
                    time={message.time}
                  />
                );
              }

              if (message.type === "otherImage") {
                return (
                  <OtherImageMessage
                    key={message.id}
                    nickname={message.nickname ?? opponentDisplayName}
                    initial={message.initial ?? opponentDisplayName.slice(0, 1)}
                    color={message.color ?? COLORS.yellowLight}
                    initialColor={message.initialColor ?? COLORS.gray700}
                    imageUrl={message.imageUrl}
                    time={message.time}
                  />
                );
              }

              return (
                <OtherMessage
                  key={message.id}
                  nickname={message.nickname ?? opponentDisplayName}
                  initial={message.initial ?? opponentDisplayName.slice(0, 1)}
                  color={message.color ?? COLORS.yellowLight}
                  initialColor={message.initialColor ?? COLORS.gray700}
                  text={message.text ?? ""}
                  time={message.time}
                />
              );
            })}
          </ScrollView>
        </View>


        {isPlusOpen && (
          <View style={[styles.bottomPanel, { height: plusPanelHeight }]}>
            <View style={styles.plusMenu}>
              <TouchableOpacity
                style={styles.plusMenuItem}
                activeOpacity={0.75}
                onPress={handleImagePress}
                disabled={isSendingImage}
              >
                <View
                  style={[
                    styles.plusMenuIcon,
                    { backgroundColor: "#FFD8CE" },
                    isSendingImage && styles.plusMenuIconDisabled,
                  ]}
                >
                  {isSendingImage ? (
                    <ActivityIndicator size="small" color={COLORS.black} />
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={21}
                      color={COLORS.black}
                    />
                  )}
                </View>
                <Text style={styles.plusMenuText}>
                  {isSendingImage ? "전송 중" : "사진"}
                </Text>
              </TouchableOpacity>

              {!isNote &&
                (isSeller ? (
                  <TouchableOpacity
                    style={styles.plusMenuItem}
                    activeOpacity={0.75}
                    onPress={handleTrackingPress}
                  >
                    <View
                      style={[
                        styles.plusMenuIcon,
                        { backgroundColor: "#DCEEFF" },
                      ]}
                    >
                      <Ionicons
                        name="cube-outline"
                        size={21}
                        color={COLORS.black}
                      />
                    </View>
                    <Text style={styles.plusMenuText}>운송장 번호 공유</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.plusMenuItem}
                    activeOpacity={0.75}
                    onPress={handleDeliveryStatusPress}
                  >
                    <View
                      style={[
                        styles.plusMenuIcon,
                        { backgroundColor: "#DCEEFF" },
                      ]}
                    >
                      <Ionicons
                        name="cube-outline"
                        size={21}
                        color={COLORS.black}
                      />
                    </View>
                    <Text style={styles.plusMenuText}>배송 현황 확인</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        <View style={[styles.inputSection, { bottom: bottomSpace }]}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.plusButton}
              activeOpacity={0.7}
              onPress={handlePlusPress}
            >
              <Ionicons
                name={isPlusOpen ? "close" : "add"}
                size={27}
                color={COLORS.gray700}
              />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="메시지를 입력하세요"
              placeholderTextColor={COLORS.gray400}
              value={inputText}
              onChangeText={setInputText}
              onFocus={handleInputFocus}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !isChatConnected && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleSend}
            >
              <Ionicons name="send" size={19} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FraudMessage({
  level,
  text,
}: {
  level: "warning" | "danger";
  text: string;
}) {
  const isDanger = level === "danger";

  return (
    <View style={styles.fraudMessageWrap}>
      <View
        style={[
          styles.fraudMessageCard,
          isDanger ? styles.fraudDangerCard : styles.fraudWarningCard,
        ]}
      >
        <View
          style={[
            styles.fraudMessageIconBox,
            isDanger ? styles.fraudDangerIconBox : styles.fraudWarningIconBox,
          ]}
        >
          <Ionicons
            name={isDanger ? "warning-outline" : "alert-circle-outline"}
            size={18}
            color={isDanger ? "#D92D20" : "#B54708"}
          />
        </View>

        <View style={styles.fraudMessageContent}>
          <Text
            style={[
              styles.fraudMessageTitle,
              isDanger ? styles.fraudDangerTitle : styles.fraudWarningTitle,
            ]}
          >
            {isDanger ? "위험 문구가 감지됐어요" : "주의가 필요한 문구예요"}
          </Text>

          <Text style={styles.fraudMessageText}>
            {text || "거래 안전 확인이 필요한 문구예요."}
          </Text>

          <Text style={styles.fraudMessageGuide}>
            앱 밖 결제나 선입금 요청은 꼭 한 번 더 확인해 주세요.
          </Text>
        </View>
      </View>
    </View>
  );
}

function SystemMessage({ text }: { text: string }) {
  return (
    <View style={styles.systemWrap}>
      <View style={styles.systemBubble}>
        <Text style={styles.systemText}>{text}</Text>
      </View>
    </View>
  );
}

function TradeMessage({
  text,
  showReviewButton,
  reviewSubmitted,
  onReviewPress,
}: {
  text: string;
  showReviewButton?: boolean;
  reviewSubmitted?: boolean;
  onReviewPress?: () => void;
}) {
  return (
    <View style={styles.tradeOuterWrap}>
      <View style={styles.tradeLine} />
      <Text style={styles.tradeMessageText}>{text}</Text>

      {showReviewButton && (
        <TouchableOpacity
          style={[
            styles.reviewButton,
            reviewSubmitted && styles.reviewButtonDisabled,
          ]}
          activeOpacity={reviewSubmitted ? 1 : 0.85}
          disabled={reviewSubmitted}
          onPress={onReviewPress}
        >
          <Text style={styles.reviewButtonText}>
            {reviewSubmitted ? "거래 후기 작성 완료" : "거래 후기 작성하기"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MyMessage({ text, time }: { text: string; time?: string }) {
  return (
    <View style={styles.myMessageWrap}>
      <View style={styles.myMessageRow}>
        {time && <Text style={styles.myTime}>{time}</Text>}
        <View style={styles.myBubble}>
          <Text style={styles.myBubbleText}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

function ImageMessage({
  imageUrl,
  time,
}: {
  imageUrl?: string;
  time?: string;
}) {
  return (
    <View style={styles.myMessageWrap}>
      <View style={styles.myMessageRow}>
        {time && <Text style={styles.myTime}>{time}</Text>}
        <View style={styles.imageBubble}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.chatImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={24} color="#B8A34A" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function OtherImageMessage({
  nickname,
  initial,
  color,
  initialColor,
  imageUrl,
  time,
}: {
  nickname: string;
  initial: string;
  color: string;
  initialColor: string;
  imageUrl?: string;
  time?: string;
}) {
  return (
    <View style={styles.otherMessageWrap}>
      <View style={[styles.profileCircle, { backgroundColor: color }]}>
        <Text style={[styles.profileInitial, { color: initialColor }]}>
          {initial}
        </Text>
      </View>

      <View style={styles.otherContent}>
        <Text style={styles.nickname}>{nickname}</Text>
        <View style={styles.otherBubbleRow}>
          <View style={styles.otherImageBubble}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.chatImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={24} color="#B8A34A" />
              </View>
            )}
          </View>
          {time && <Text style={styles.otherTime}>{time}</Text>}
        </View>
      </View>
    </View>
  );
}

function OtherMessage({
  nickname,
  initial,
  color,
  initialColor,
  text,
  time,
}: {
  nickname: string;
  initial: string;
  color: string;
  initialColor: string;
  text: string;
  time?: string;
}) {
  return (
    <View style={styles.otherMessageWrap}>
      <View style={[styles.profileCircle, { backgroundColor: color }]}>
        <Text style={[styles.profileInitial, { color: initialColor }]}>
          {initial}
        </Text>
      </View>

      <View style={styles.otherContent}>
        <Text style={styles.nickname}>{nickname}</Text>

        <View style={styles.otherBubbleRow}>
          <View style={styles.otherBubble}>
            <Text style={styles.otherBubbleText}>{text}</Text>
          </View>
          {time && <Text style={styles.otherTime}>{time}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
    position: "relative",
  },
  header: {
    height: 58,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    zIndex: 10,
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
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.black,
  },
  chatPressArea: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateWrap: {
    alignItems: "center",
    marginBottom: 13,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: "500",
  },

  fraudMessageWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 14,
  },
  fraudMessageCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  fraudWarningCard: {
    backgroundColor: "#FFFAEB",
    borderColor: "#FEDF89",
  },
  fraudDangerCard: {
    backgroundColor: "#FFF4F3",
    borderColor: "#FDA29B",
  },
  fraudMessageIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  fraudWarningIconBox: {
    backgroundColor: "#FEF0C7",
  },
  fraudDangerIconBox: {
    backgroundColor: "#FEE4E2",
  },
  fraudMessageContent: {
    flex: 1,
  },
  fraudMessageTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  fraudWarningTitle: {
    color: "#B54708",
  },
  fraudDangerTitle: {
    color: "#D92D20",
  },
  fraudMessageText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: COLORS.gray700,
    letterSpacing: -0.2,
  },
  fraudMessageGuide: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: COLORS.gray700,
    letterSpacing: -0.2,
  },
  systemWrap: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  systemBubble: {
    maxWidth: "88%",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F3F3F3",
  },
  systemText: {
    textAlign: "center",
    fontSize: 11.5,
    color: COLORS.gray500,
    lineHeight: 16,
    fontWeight: "500",
  },
  tradeOuterWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 20,
  },
  tradeLine: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.line,
    marginBottom: 18,
  },
  tradeMessageText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.gray500,
    marginBottom: 14,
  },
  reviewButton: {
    width: "78%",
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewButtonDisabled: {
    backgroundColor: COLORS.yellowDisabled,
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.white,
  },
  myMessageWrap: {
    alignItems: "flex-end",
    marginTop: 14,
  },
  myMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "86%",
  },
  myBubble: {
    maxWidth: 260,
    backgroundColor: COLORS.yellow,
    borderRadius: 14,
    borderTopRightRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  myBubbleText: {
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    color: COLORS.black,
  },
  myTime: {
    fontSize: 11,
    color: COLORS.gray500,
    marginRight: 7,
    marginBottom: 3,
  },
  imageBubble: {
    width: 146,
    height: 112,
    borderRadius: 14,
    backgroundColor: COLORS.yellowLight,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  otherImageBubble: {
    width: 146,
    height: 112,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  chatImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  otherMessageWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileInitial: {
    fontSize: 15,
    fontWeight: "800",
  },
  otherContent: {
    flex: 1,
  },
  nickname: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray700,
    marginBottom: 5,
  },
  otherBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  otherBubble: {
    maxWidth: 235,
    backgroundColor: COLORS.gray100,
    borderRadius: 13,
    borderTopLeftRadius: 2,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  otherBubbleText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.black,
    fontWeight: "500",
  },
  otherTime: {
    fontSize: 11,
    color: COLORS.gray500,
    marginLeft: 7,
    marginBottom: 3,
  },
  inputSection: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingHorizontal: 16,
    paddingTop: 7,
    paddingBottom: 7,
    zIndex: 30,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  plusButton: {
    width: 34,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 22,
    backgroundColor: "#F3F1ED",
    paddingHorizontal: 16,
    fontSize: 13,
    color: COLORS.black,
  },
  sendButton: {
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    zIndex: 20,
  },
  plusMenu: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 18,
    paddingLeft: 18,
    gap: 18,
    backgroundColor: COLORS.white,
  },
  plusMenuItem: {
    width: 72,
    alignItems: "center",
  },
  plusMenuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  plusMenuIconDisabled: {
    opacity: 0.55,
  },
  plusMenuText: {
    width: 84,
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 14,
    color: COLORS.gray700,
    fontWeight: "500",
  },
});
