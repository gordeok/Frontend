import { Ionicons } from "@expo/vector-icons";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
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

import { getChatMessages } from "../../services/chat";
import { API_BASE_URL, getStoredUserId } from "../../utils/api";

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

type TradeStatus =
  | "모집 중"
  | "모집 완료"
  | "배송 중"
  | "거래 완료"
  | "거래 취소";

type MessageType = "system" | "me" | "other" | "image" | "trade";

type Message = {
  id: string;
  type: MessageType;
  text?: string;
  time?: string;
  nickname?: string;
  initial?: string;
  color?: string;
  initialColor?: string;
};

const noteMessages: Message[] = [
  {
    id: "note-1",
    type: "system",
    text: "쪽지가 시작되었어요",
  },
];

function getParamString(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function extractUserId(value: any): number {
  if (value === null || value === undefined) {
    throw new Error("로그인된 userId가 없습니다.");
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error("로그인된 userId가 없습니다.");
    }

    const parsed = Number(trimmed);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    try {
      return extractUserId(JSON.parse(trimmed));
    } catch {
      throw new Error("userId를 숫자로 변환할 수 없습니다.");
    }
  }

  if (typeof value === "object") {
    if (value.userId !== undefined) return extractUserId(value.userId);
    if (value.id !== undefined) return extractUserId(value.id);
    if (value.user?.userId !== undefined) {
      return extractUserId(value.user.userId);
    }
    if (value.user?.id !== undefined) {
      return extractUserId(value.user.id);
    }
    if (value.data?.userId !== undefined) {
      return extractUserId(value.data.userId);
    }
    if (value.data?.id !== undefined) {
      return extractUserId(value.data.id);
    }
    if (value.result?.userId !== undefined) {
      return extractUserId(value.result.userId);
    }
    if (value.result?.id !== undefined) {
      return extractUserId(value.result.id);
    }
  }

  throw new Error("userId를 찾을 수 없습니다.");
}


function formatMessageTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeTradeStatus(value: string | string[] | undefined): TradeStatus {
  const raw = getParamString(value).trim();
  const normalized = raw.replace(/\s/g, "").toUpperCase();

  if (
    normalized === "거래완료" ||
    normalized === "COMPLETED" ||
    normalized === "COMPLETE" ||
    normalized === "DONE" ||
    normalized === "TRADECOMPLETED" ||
    normalized === "TRADE_COMPLETE"
  ) {
    return "거래 완료";
  }

  if (
    normalized === "거래취소" ||
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "CANCEL"
  ) {
    return "거래 취소";
  }

  if (
    normalized === "배송중" ||
    normalized === "SHIPPING" ||
    normalized === "DELIVERING"
  ) {
    return "배송 중";
  }

  if (
    normalized === "모집완료" ||
    normalized === "RECRUITCLOSED" ||
    normalized === "RECRUIT_CLOSED" ||
    normalized === "CLOSED"
  ) {
    return "모집 완료";
  }

  return "모집 중";
}

function getDefaultSystemMessage(
  isSeller: boolean,
  opponentDisplayName: string
): Message {
  return {
    id: "system-created",
    type: "system",
    text: isSeller
      ? "분철 채팅방이 생성되었어요."
      : `${opponentDisplayName} 님과의 채팅방이 시작되었어요`,
  };
}

function ensureStatusMessage(
  messages: Message[],
  status: TradeStatus
): Message[] {
  const statusText =
    status === "거래 완료"
      ? "거래가 완료되었습니다."
      : status === "거래 취소"
      ? "거래가 취소되었습니다."
      : "";

  if (!statusText) return messages;

  const alreadyExists = messages.some(
    (message) => message.type === "trade" && message.text === statusText
  );

  if (alreadyExists) return messages;

  const statusMessage: Message = {
    id: `trade-${status.replace(/\s/g, "-")}`,
    type: "trade",
    text: statusText,
  };

  return [...messages, statusMessage];
}

function normalizeApiMessages(
  apiMessages: any[],
  myUserId: number | null,
  opponentDisplayName: string
): Message[] {
  if (!Array.isArray(apiMessages)) return [];

  return apiMessages.map((message: any) => {
    const messageType = String(message.messageType ?? "").toUpperCase();

    if (
      messageType === "TRANSACTION_COMPLETE" ||
      messageType === "TRACKING_SHARED"
    ) {
      return {
        id: String(message.messageId ?? `trade-${Date.now()}`),
        type: "trade",
        text: message.content ?? "",
        time: formatMessageTime(message.createdAt),
      };
    }

    if (messageType === "FRAUD_WARNING" || messageType === "FRAUD_DANGER") {
      return {
        id: String(message.messageId ?? `fraud-${Date.now()}`),
        type: "system",
        text:
          message.reason ||
          message.content ||
          "사기 의심 알림이 도착했어요.",
        time: formatMessageTime(message.createdAt),
      };
    }

    if (message.senderId === null || message.senderNickname === "SYSTEM") {
      return {
        id: String(message.messageId ?? `system-${Date.now()}`),
        type: "system",
        text: message.content ?? "",
        time: formatMessageTime(message.createdAt),
      };
    }

    if (messageType === "IMAGE") {
      return {
        id: String(message.messageId ?? `image-${Date.now()}`),
        type: "image",
        time: formatMessageTime(message.createdAt),
      };
    }

    const isMine =
      myUserId !== null && Number(message.senderId) === Number(myUserId);

    if (isMine) {
      return {
        id: String(message.messageId ?? `me-${Date.now()}`),
        type: "me",
        text: message.content ?? "",
        time: formatMessageTime(message.createdAt),
      };
    }

    const nickname = message.senderNickname || opponentDisplayName || "상대방";

    return {
      id: String(message.messageId ?? `other-${Date.now()}`),
      type: "other",
      nickname,
      initial: nickname.slice(0, 1),
      color: COLORS.yellowLight,
      initialColor: COLORS.gray700,
      text: message.content ?? "",
      time: formatMessageTime(message.createdAt),
    };
  });
}

function normalizeSocketMessage(
  socketMessage: any,
  myUserId: number | null,
  opponentDisplayName: string
): Message {
  const messageType = String(socketMessage?.messageType ?? "").toUpperCase();

  if (
    messageType === "TRANSACTION_COMPLETE" ||
    messageType === "TRACKING_SHARED"
  ) {
    return {
      id: String(socketMessage.messageId ?? `trade-${Date.now()}`),
      type: "trade",
      text: socketMessage.content || "거래 상태가 변경되었습니다.",
      time: formatMessageTime(socketMessage.createdAt) || "지금",
    };
  }

  if (messageType === "FRAUD_WARNING" || messageType === "FRAUD_DANGER") {
    return {
      id: String(socketMessage.messageId ?? `fraud-${Date.now()}`),
      type: "system",
      text:
        socketMessage.reason ||
        socketMessage.content ||
        "사기 의심 알림이 도착했어요.",
      time: formatMessageTime(socketMessage.createdAt) || "지금",
    };
  }

  if (
    socketMessage.senderId === null ||
    socketMessage.senderNickname === "SYSTEM"
  ) {
    return {
      id: String(socketMessage.messageId ?? `system-${Date.now()}`),
      type: "system",
      text: socketMessage.content || "",
      time: formatMessageTime(socketMessage.createdAt) || "지금",
    };
  }

  const isMine =
    myUserId !== null && Number(socketMessage.senderId) === Number(myUserId);

  if (isMine) {
    return {
      id: String(socketMessage.messageId ?? `socket-me-${Date.now()}`),
      type: "me",
      text: socketMessage.content || "",
      time: formatMessageTime(socketMessage.createdAt) || "지금",
    };
  }

  const nickname =
    socketMessage.senderNickname || opponentDisplayName || "상대방";

  return {
    id: String(socketMessage.messageId ?? `socket-other-${Date.now()}`),
    type: "other",
    nickname,
    initial: nickname.slice(0, 1),
    color: COLORS.yellowLight,
    initialColor: COLORS.gray700,
    text: socketMessage.content || "",
    time: formatMessageTime(socketMessage.createdAt) || "지금",
  };
}

export default function ChatRoomDetailScreen() {
  const insets = useSafeAreaInsets();

  const {
    chatRoomId,
    postId,
    memberItemId,
    role,
    title,
    roomName,
    sellerName,
    opponentName,
    buyerName,
    selectedMember,
    selectedPrice,
    receiverName,
    phoneNumber,
    storeName,
    requestText,
    type,
    tradeEvent,
    status,
    reviewSubmitted,
    canWriteReview,
  } = useLocalSearchParams<{
    chatRoomId: string;
    postId?: string;
    memberItemId?: string;
    role?: string;
    title?: string;
    roomName?: string;
    sellerName?: string;
    opponentName?: string;
    buyerName?: string;
    selectedMember?: string;
    selectedPrice?: string;
    receiverName?: string;
    phoneNumber?: string;
    storeName?: string;
    requestText?: string;
    type?: string;
    tradeEvent?: string;
    status?: string;
    reviewSubmitted?: string;
    canWriteReview?: string;
  }>();

  const normalizedRole = getParamString(role).trim().toLowerCase();

  const isNote = getParamString(type) === "note";
  const isSeller = !isNote && normalizedRole === "seller";
  const isBuyer = !isNote && !isSeller;
  const currentRole = isSeller ? "seller" : "buyer";

  const roomTitle =
    getParamString(title).trim().length > 0
      ? getParamString(title).trim()
      : getParamString(roomName).trim().length > 0
      ? getParamString(roomName).trim()
      : isNote
      ? "쪽지"
      : "분철 채팅방";

  const opponentDisplayName =
    getParamString(opponentName).trim().length > 0
      ? getParamString(opponentName).trim()
      : getParamString(sellerName).trim().length > 0
      ? getParamString(sellerName).trim()
      : isBuyer
      ? "판매자"
      : "구매자";

  const sellerDisplayName =
    getParamString(sellerName).trim().length > 0
      ? getParamString(sellerName).trim()
      : isBuyer
      ? opponentDisplayName
      : "판매자";

  const buyerDisplayName =
    getParamString(buyerName).trim().length > 0
      ? getParamString(buyerName).trim()
      : isBuyer
      ? "나"
      : opponentDisplayName;

  const selectedMemberName = getParamString(selectedMember);
  const selectedMemberPrice = getParamString(selectedPrice);

  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const startDragY = useRef(0);
  const appliedTradeEvent = useRef<string | null>(null);

  const lastKeyboardHeight = useRef(DEFAULT_PANEL_HEIGHT);
  const openedPlusFromKeyboard = useRef(false);

  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const myUserIdRef = useRef<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isReturningKeyboard, setIsReturningKeyboard] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const currentStatus: TradeStatus = normalizeTradeStatus(status);
  const isCompleted = currentStatus === "거래 완료";
  const isReviewSubmitted = getParamString(reviewSubmitted) === "true";
  const shouldShowReviewButton =
    isBuyer &&
    isCompleted &&
    !isReviewSubmitted &&
    getParamString(canWriteReview, "true") !== "false";

  const keyboardSpace = Math.max(keyboardHeight - insets.bottom, 0);

  const plusPanelHeight = Math.max(
    lastKeyboardHeight.current - insets.bottom,
    DEFAULT_PANEL_HEIGHT
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
    const loadMessages = async () => {
      if (isNote) {
        setMessages(noteMessages);
        appliedTradeEvent.current = null;
        scrollToBottom(120);
        return;
      }

      try {
        const storedUserId = await getStoredUserId();
        const myUserId = extractUserId(storedUserId);
        myUserIdRef.current = myUserId;

        const response = await getChatMessages(chatRoomId);
        const normalized = normalizeApiMessages(
          response as any[],
          myUserId,
          opponentDisplayName
        );

        const baseMessages: Message[] =
          normalized.length > 0
            ? normalized
            : [getDefaultSystemMessage(isSeller, opponentDisplayName)];

        setMessages(ensureStatusMessage(baseMessages, currentStatus));
      } catch (error) {
        console.log("채팅 메시지 조회 실패:", error);

        const fallbackMessages: Message[] = [
          getDefaultSystemMessage(isSeller, opponentDisplayName),
        ];

        setMessages(ensureStatusMessage(fallbackMessages, currentStatus));
      } finally {
        appliedTradeEvent.current = null;
        scrollToBottom(120);
      }
    };

    loadMessages();
  }, [isNote, chatRoomId, opponentDisplayName, currentStatus, isSeller]);

  useEffect(() => {
    if (isNote) return;

    let alive = true;

    const connectSocket = async () => {
      try {
        const storedUserId = await getStoredUserId();
        const myUserId = extractUserId(storedUserId);

        if (!alive) return;

        myUserIdRef.current = myUserId;

        subscriptionRef.current?.unsubscribe();
        subscriptionRef.current = null;

        if (stompClientRef.current?.active) {
          await stompClientRef.current.deactivate();
        }

        const client = new Client({
          webSocketFactory: () => {
            return new SockJS(`${API_BASE_URL}/ws`) as any;
          },
          reconnectDelay: 3000,
          heartbeatIncoming: 0,
          heartbeatOutgoing: 0,
          connectionTimeout: 8000,
          debug: () => {},
          onConnect: () => {
            if (!alive) return;

            console.log("채팅 소켓 연결 성공");
            setIsSocketConnected(true);

            subscriptionRef.current = client.subscribe(
              `/sub/chat/rooms/${chatRoomId}`,
              (frame: IMessage) => {
                try {
                  const body = JSON.parse(frame.body);
                  const nextMessage = normalizeSocketMessage(
                    body,
                    myUserIdRef.current,
                    opponentDisplayName
                  );

                  setMessages((prev) => {
                    const alreadyExists = prev.some(
                      (message) => message.id === nextMessage.id
                    );

                    if (alreadyExists) return prev;

                    return [...prev, nextMessage];
                  });

                  scrollToBottom(80);
                } catch (error) {
                  console.log("채팅 소켓 메시지 파싱 실패:", error, frame.body);
                }
              }
            );
          },
          onDisconnect: () => {
            setIsSocketConnected(false);
          },
          onStompError: (frame) => {
            console.log("STOMP 오류:", frame.headers, frame.body);
            setIsSocketConnected(false);
          },
          onWebSocketClose: (event) => {
            setIsSocketConnected(false);
            console.log("채팅 소켓 닫힘:", event.code, event.reason);
          },
          onWebSocketError: (error) => {
            console.log("채팅 소켓 오류:", error);
            setIsSocketConnected(false);
          },
        });

        stompClientRef.current = client;
        client.activate();
      } catch (error) {
        console.log("채팅 소켓 초기화 실패:", error);
        setIsSocketConnected(false);
      }
    };

    connectSocket();

    return () => {
      alive = false;
      setIsSocketConnected(false);
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      stompClientRef.current?.deactivate();
      stompClientRef.current = null;
    };
  }, [chatRoomId, opponentDisplayName, isNote]);

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

    const text =
      tradeEvent === "completed"
        ? "거래가 완료되었습니다."
        : tradeEvent === "canceled"
        ? "거래가 취소되었습니다."
        : "";

    if (!text) return;

    setMessages((prev) => {
      const alreadyExists = prev.some(
        (message) => message.type === "trade" && message.text === text
      );

      if (alreadyExists) return prev;

      const tradeMessage: Message = {
        id: `trade-${Date.now()}`,
        type: "trade",
        text,
      };

      return [...prev, tradeMessage];
    });

    scrollToBottom(100);
  }, [tradeEvent, isNote]);

  useEffect(() => {
    if (isNote) return;
    if (currentStatus !== "거래 완료") return;

    setMessages((prev) => ensureStatusMessage(prev, "거래 완료"));
    scrollToBottom(100);
  }, [currentStatus, isNote]);

  const handleBack = () => {
    if (!isNote && currentStatus === "거래 완료") {
      router.replace({
        pathname: "/(tabs)/chats",
        params: {
          completedChatRoomId: chatRoomId,
          reviewSubmittedChatRoomId: isReviewSubmitted ? chatRoomId : "",
        },
      });
      return;
    }

    router.back();
  };

  const handleOpenMenu = () => {
    router.push({
      pathname: "/chat/menu",
      params: {
        chatRoomId: String(chatRoomId),
        postId: getParamString(postId),
        memberItemId: getParamString(memberItemId),

        type: isNote ? "note" : "divide",
        role: currentRole,

        title: roomTitle,
        roomName: roomTitle,

        opponentName: opponentDisplayName,
        sellerName: sellerDisplayName,
        buyerName: buyerDisplayName,

        selectedMember: selectedMemberName,
        selectedPrice: selectedMemberPrice,

        receiverName: getParamString(receiverName),
        phoneNumber: getParamString(phoneNumber),
        storeName: getParamString(storeName),
        requestText: getParamString(requestText),

        status: currentStatus,
        reviewSubmitted: isReviewSubmitted ? "true" : "false",
        canWriteReview: shouldShowReviewButton ? "true" : "false",
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

    if (isNote) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: "me",
        text: content,
        time: "지금",
      };

      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
      scrollToBottom(90);
      return;
    }

    const senderId = myUserIdRef.current;

    if (!senderId) {
      Alert.alert("오류", "로그인 정보를 찾을 수 없어요. 다시 로그인해주세요.");
      return;
    }

    const client = stompClientRef.current;

    if (!client || !client.connected) {
      Alert.alert(
        "전송 실패",
        isSocketConnected
          ? "메시지 전송에 실패했어요."
          : "채팅 서버에 연결되지 않았어요. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    try {
      client.publish({
        destination: "/pub/chat/message",
        body: JSON.stringify({
          chatRoomId: Number(chatRoomId),
          senderId: Number(senderId),
          content,
          messageType: "TEXT",
        }),
      });

      setInputText("");
      scrollToBottom(90);
    } catch (error) {
      console.log("메시지 전송 실패:", error);
      Alert.alert("전송 실패", "메시지 전송에 실패했어요.");
    }
  };

  const handleImagePress = () => {
    Alert.alert("사진 / 동영상", "프론트 시연용 버튼입니다.");
    closePlusMenu();
  };

  const handleTrackingPress = () => {
    closePlusMenu();

    router.push({
      pathname: "/chat/tracking-share",
      params: {
        chatRoomId,
        role: currentRole,
      },
    });
  };

  const handleDeliveryStatusPress = () => {
    closePlusMenu();

    router.push({
      pathname: "/chat/tracking-status",
      params: {
        chatRoomId,
        role: currentRole,
        title: roomTitle,
      },
    } as any);
  };

  const handleReviewPress = () => {
    router.push({
      pathname: "/chat/review-write",
      params: {
        chatRoomId,
        role: currentRole,
        title: roomTitle,
        status: currentStatus,
        sellerName: sellerDisplayName,
        buyerName: buyerDisplayName,
        selectedMember: selectedMemberName,
      },
    });
  };

  const handleChatAreaTouch = () => {
    closePlusMenu();
  };

  const handleScrollBeginDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    startDragY.current = event.nativeEvent.contentOffset.y;

    if (isPlusOpen) {
      closePlusMenu();
    }
  };

  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
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
              <Text style={styles.dateText}>2026년 5월 11일 월요일</Text>
            </View>

            {messages.map((message) => {
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
                      shouldShowReviewButton &&
                      message.text === "거래가 완료되었습니다."
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
                return <ImageMessage key={message.id} time={message.time} />;
              }

              return (
                <OtherMessage
                  key={message.id}
                  nickname={message.nickname ?? opponentDisplayName}
                  initial={message.initial ?? opponentDisplayName.slice(0, 1)}
                  color={message.color ?? COLORS.gray200}
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
              >
                <View
                  style={[
                    styles.plusMenuIcon,
                    { backgroundColor: "#FFD8CE" },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={21}
                    color={COLORS.black}
                  />
                </View>
                <Text style={styles.plusMenuText}>사진 / 동영상</Text>
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
              style={styles.sendButton}
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

function ImageMessage({ time }: { time?: string }) {
  return (
    <View style={styles.myMessageWrap}>
      <View style={styles.myMessageRow}>
        {time && <Text style={styles.myTime}>{time}</Text>}
        <View style={styles.imageBubble}>
          <View style={styles.imageCircle}>
            <View style={styles.imageDot} />
          </View>
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
    width: 120,
    height: 88,
    borderRadius: 12,
    backgroundColor: COLORS.yellowLight,
    alignItems: "center",
    justifyContent: "center",
  },
  imageCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#B8A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#B8A34A",
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
  plusMenuText: {
    width: 84,
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 14,
    color: COLORS.gray700,
    fontWeight: "500",
  },
});