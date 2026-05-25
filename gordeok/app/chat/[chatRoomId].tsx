import { Ionicons } from "@expo/vector-icons";
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

import { getChatMessages, getTrackingInfo } from "../../services/chat";
import { getMyProfile } from "../../services/user";
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

function formatMessageTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function ensureStatusMessage(messages: Message[], status: TradeStatus) {
  const text =
    status === "거래 완료"
      ? "거래가 완료되었습니다."
      : status === "거래 취소"
      ? "거래가 취소되었습니다."
      : "";

  if (!text) return messages;

  const alreadyExists = messages.some(
    (message) => message.type === "trade" && message.text === text
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

function normalizeChatMessages(apiMessages: ChatMessageApiItem[]): Message[] {
  return apiMessages.map((message: any) => {
    const messageType = message.messageType;

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
        id: String(message.messageId ?? `system-${Date.now()}`),
        type: "system",
        text:
          message.reason ||
          message.content ||
          "사기 의심 알림이 도착했어요.",
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
      return {
        id: String(message.messageId ?? `image-${Date.now()}`),
        type: "image",
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
  });
}

export default function ChatRoomDetailScreen() {
  const insets = useSafeAreaInsets();

  const {
    chatRoomId,
    role,
    title,
    sellerName,
    buyerName,
    opponentName,
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
  } = useLocalSearchParams<{
    chatRoomId: string;
    role?: string;
    title?: string;
    sellerName?: string;
    buyerName?: string;
    opponentName?: string;
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
  }>();

  const normalizedRole = getParamString(role).trim().toLowerCase();

  const isNote = type === "note";
  const isSeller = !isNote && normalizedRole === "seller";
  const isBuyer = !isNote && !isSeller;
  const currentRole = isSeller ? "seller" : "buyer";

  const [myNickname, setMyNickname] = useState("");

  useEffect(() => {
    const loadMyProfile = async () => {
      try {
        const profile = await getMyProfile();
        setMyNickname(profile.nickname ?? "");
      } catch (error) {
        console.log("내 프로필 조회 실패:", error);
      }
    };

    loadMyProfile();
  }, []);

  const roomTitle =
    getParamString(title).trim().length > 0
      ? getParamString(title).trim()
      : isNote
      ? "쪽지"
      : "분철 채팅방";

  const sellerDisplayName =
    cleanParamName(sellerName) ||
    (isBuyer ? cleanParamName(opponentName) : "") ||
    "판매자";

  const rawBuyerName =
    cleanParamName(buyerName) ||
    (isBuyer ? cleanParamName(myNickname) : "") ||
    (isSeller ? cleanParamName(opponentName) : "");

  const buyerDisplayName =
    rawBuyerName && rawBuyerName !== sellerDisplayName ? rawBuyerName : "";

  const opponentDisplayName = isBuyer
    ? sellerDisplayName
    : buyerDisplayName || "구매자";

  const selectedMemberName = getParamString(selectedMember);
  const receiver = getParamString(receiverName);
  const phone = getParamString(phoneNumber);
  const store = getParamString(storeName);
  const request = getParamString(requestMessage) || getParamString(requestText);

  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const startDragY = useRef(0);
  const appliedTradeEvent = useRef<string | null>(null);

  const lastKeyboardHeight = useRef(DEFAULT_PANEL_HEIGHT);
  const openedPlusFromKeyboard = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isReturningKeyboard, setIsReturningKeyboard] = useState(false);

  const currentStatus: TradeStatus = normalizeTradeStatus(status);

  const isCompleted = currentStatus === "거래 완료";
  const isReviewSubmitted = reviewSubmitted === "true";

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
      try {
        const response = await getChatMessages(chatRoomId);
        const normalized = normalizeChatMessages(response);

        if (normalized.length > 0) {
          setMessages(normalized);
        } else {
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
  }, [chatRoomId, sellerDisplayName, buyerDisplayName, isBuyer]);

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

    setMessages((prev: Message[]) => ensureStatusMessage(prev, nextStatus));
    scrollToBottom(100);
  }, [tradeEvent, isNote]);

  useEffect(() => {
    if (isNote) return;
    if (currentStatus !== "거래 완료") return;

    setMessages((prev: Message[]) =>
      ensureStatusMessage(prev, "거래 완료")
    );
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
        status: currentStatus,
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
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "me",
      text: inputText.trim(),
      time: "지금",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    scrollToBottom(90);
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
        status: currentStatus,
        sellerName: sellerDisplayName,
        buyerName: buyerDisplayName,
        selectedMember: selectedMemberName,
        mode: "view",
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
      },
    } as any);
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
              <Text style={styles.dateText}>오늘</Text>
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
                      isBuyer &&
                      isCompleted &&
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