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

const baseMessages: Message[] = [
  {
    id: "1",
    type: "system",
    text: "분철의달인 님이 단톡방을 만들었어요",
  },
  {
    id: "2",
    type: "system",
    text: "윈터러버 님이 단톡방에 들어왔어요",
  },
  {
    id: "3",
    type: "system",
    text: "닝구르트 님이 단톡방에 들어왔어요",
  },
  {
    id: "4",
    type: "me",
    text: "안녕하세요! Drama 분철 참여해주셔서 감사합니다 🙌 아래 계좌로 입금 부탁드려요.",
    time: "2:01 PM",
  },
  {
    id: "5",
    type: "me",
    text: "입금 계좌\n카카오뱅크: 3333-01-1234567\n예금주: 김○철\n입금 시 닉네임 + 멤버명 기재",
    time: "2:01 PM",
  },
  {
    id: "6",
    type: "image",
    time: "2:22 PM",
  },
  {
    id: "7",
    type: "other",
    nickname: "닝구르트",
    initial: "닝",
    color: "#FFF3CD",
    initialColor: "#D98B00",
    text: "카리나 슬롯 입금 완료했어요!",
    time: "2:10 PM",
  },
  {
    id: "8",
    type: "other",
    nickname: "윈터러버",
    initial: "윈",
    color: "#DDF7EB",
    initialColor: "#1E8E61",
    text: "저도 윈터 슬롯 방금 보냈습니다 :)",
    time: "2:18 PM",
  },
];

export default function ChatRoomDetailScreen() {
  const insets = useSafeAreaInsets();

  const {
    chatRoomId,
    role,
    title,
    tradeEvent,
    status,
    reviewSubmitted,
  } = useLocalSearchParams<{
    chatRoomId: string;
    role?: string;
    title?: string;
    tradeEvent?: string;
    status?: string;
    reviewSubmitted?: string;
  }>();

  const isSeller = role !== "buyer";
  const isBuyer = !isSeller;

  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const startDragY = useRef(0);
  const appliedTradeEvent = useRef<string | null>(null);

  const lastKeyboardHeight = useRef(DEFAULT_PANEL_HEIGHT);
  const openedPlusFromKeyboard = useRef(false);

  const [messages, setMessages] = useState<Message[]>(baseMessages);
  const [inputText, setInputText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isReturningKeyboard, setIsReturningKeyboard] = useState(false);

  const roomTitle =
    typeof title === "string" && title.length > 0
      ? title
      : "에스파 Drama 정규 1집";

  const currentStatus: TradeStatus =
    status === "모집 완료" ||
    status === "배송 중" ||
    status === "거래 완료" ||
    status === "거래 취소"
      ? status
      : "모집 중";

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
    scrollToBottom(120);

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

      return [
        ...prev,
        {
          id: `trade-${Date.now()}`,
          type: "trade",
          text,
        },
      ];
    });

    scrollToBottom(100);
  }, [tradeEvent]);

  useEffect(() => {
    if (currentStatus !== "거래 완료") return;

    setMessages((prev) => {
      const alreadyExists = prev.some(
        (message) =>
          message.type === "trade" &&
          message.text === "거래가 완료되었습니다."
      );

      if (alreadyExists) return prev;

      return [
        ...prev,
        {
          id: `trade-completed-${Date.now()}`,
          type: "trade",
          text: "거래가 완료되었습니다.",
        },
      ];
    });

    scrollToBottom(100);
  }, [currentStatus]);

  const handleBack = () => {
    if (currentStatus === "거래 완료") {
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
        chatRoomId,
        role: isSeller ? "seller" : "buyer",
        title: roomTitle,
        status: currentStatus,
        reviewSubmitted: isReviewSubmitted ? "true" : "false",
      },
    });
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
        role,
      },
    });
  };

  const handleDeliveryStatusPress = () => {
    closePlusMenu();

    Alert.alert(
      "배송 현황 확인",
      "나중에 배송사와 운송장 번호를 받아와 배송 조회 URL로 연결하면 돼."
    );
  };

  const handleReviewPress = () => {
    router.push({
      pathname: "/chat/review-write",
      params: {
        chatRoomId,
        role,
        title: roomTitle,
        status: currentStatus,
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

              if (message.type === "trade") {
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
                  nickname={message.nickname ?? ""}
                  initial={message.initial ?? ""}
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

              {isSeller ? (
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
              )}
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
          <Text
            style={[
              styles.reviewButtonText,
              reviewSubmitted && styles.reviewButtonTextDisabled,
            ]}
          >
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
  reviewButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.white,
  },
  reviewButtonDisabled: {
    backgroundColor: "#E8D38E",
  },
  reviewButtonTextDisabled: {
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