import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.52;

const LOCAL_CHAT_ROOMS_KEY = "localChatRooms";
const REMOVED_CHAT_ROOMS_KEY = "GO_REUDEOK_REMOVED_CHAT_ROOMS";

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
  isSeller?: boolean;
  receiver?: string;
  phone?: string;
  store?: string;
  request?: string;
};

type LocalChatRoom = {
  id: string;
  title?: string;
  status?: string;
  postStatus?: string;
  sellerName?: string;
  buyerName?: string;
  selectedMember?: string;
  totalMemberCount?: number;
  completedMemberCount?: number;
  allMembersCompleted?: boolean;
};

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
  }>();

  const [localRoom, setLocalRoom] = useState<LocalChatRoom | null>(null);

  useEffect(() => {
    const loadLocalRoom = async () => {
      try {
        if (!chatRoomId) return;

        const raw = await AsyncStorage.getItem(LOCAL_CHAT_ROOMS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const found = Array.isArray(parsed)
          ? parsed.find((room) => String(room.id) === String(chatRoomId))
          : null;

        setLocalRoom(found ?? null);
      } catch (error) {
        console.log("로컬 채팅방 정보 불러오기 실패:", error);
        setLocalRoom(null);
      }
    };

    loadLocalRoom();
  }, [chatRoomId]);

  const normalizedRole =
    typeof role === "string" ? role.trim().toLowerCase() : "";

  const isNote = type === "note";
  const isSeller = !isNote && normalizedRole === "seller";
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
      : localRoom?.title && localRoom.title.trim().length > 0
      ? localRoom.title.trim()
      : isNote
      ? "쪽지"
      : "분철 채팅방";

  const sellerDisplayName =
    cleanName(sellerName) ||
    cleanName(localRoom?.sellerName) ||
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

  const hasBuyerParticipant = isBuyer || rawBuyerName.length > 0;

  const buyerDisplayName = isBuyer
    ? rawBuyerName || "나"
    : rawBuyerName;

  const buyerMemberName =
    typeof selectedMember === "string" && selectedMember.trim().length > 0
      ? selectedMember.trim()
      : localRoom?.selectedMember && localRoom.selectedMember.trim().length > 0
      ? localRoom.selectedMember.trim()
      : "";

  const parsedTotalMemberCount = Number(
    totalMemberCount ?? localRoom?.totalMemberCount ?? 0
  );
  const parsedCompletedMemberCount = Number(
    completedMemberCount ?? localRoom?.completedMemberCount ?? 0
  );

  const effectivePostStatus = postStatus ?? localRoom?.postStatus ?? localRoom?.status;

  const isAllMembersCompleted =
    allMembersCompleted === "true" ||
    localRoom?.allMembersCompleted === true ||
    effectivePostStatus === "모집 완료" ||
    (parsedTotalMemberCount > 0 &&
      parsedCompletedMemberCount >= parsedTotalMemberCount);

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

  const sellerMember: Member = {
    id: "seller",
    nickname: sellerDisplayName,
    member: "개설자",
    initial: sellerDisplayName.slice(0, 1),
    color: "#FFF1B8",
    initialColor: "#D09A00",
    isSeller: true,
  };

  const buyerMember: Member = {
    id: "buyer",
    nickname: buyerDisplayName,
    member: buyerMemberName || "선택 멤버",
    initial: buyerDisplayName.slice(0, 1),
    color: "#DDF7EB",
    initialColor: "#1E8E61",
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

  const noteMembers: Member[] = [
    {
      id: "note-me",
      nickname: "나",
      member: "",
      initial: "나",
      color: "#FFE0CA",
      initialColor: "#E0702A",
    },
    {
      id: "note-other",
      nickname: cleanName(opponentName) || "상대방",
      member: "",
      initial: (cleanName(opponentName) || "상대방").slice(0, 1),
      color: "#DDF7EB",
      initialColor: "#1E8E61",
    },
  ];

  const visibleMembers = isNote
    ? noteMembers
    : isSeller
    ? hasBuyerParticipant
      ? [sellerMember, buyerMember]
      : [sellerMember]
    : [buyerMember, sellerMember];

  const getIsMe = (member: Member) => {
    if (isNote) return member.id === "note-me";
    if (isSeller) return member.id === "seller";
    return member.id === "buyer";
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

  const openBuyerSheet = (member: Member) => {
    setSelectedBuyerInfo(member);
    setIsSheetVisible(true);
  };

  const openSheetAnimation = () => {
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
  };

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
  }, [isSheetVisible]);

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

  const moveToChatWithCompletedStatus = () => {
    const nextStatus: TradeStatus = "거래 완료";

    setTradeStatus(nextStatus);

    router.replace({
      pathname: "/chat/[chatRoomId]",
      params: {
        chatRoomId: typeof chatRoomId === "string" ? chatRoomId : "1",
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

            moveToChatWithCompletedStatus();
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
          <TouchableOpacity style={styles.notePostCard} activeOpacity={0.8}>
            <View style={styles.notePostTextBox}>
              <Text style={styles.notePostLabel}>쪽지 글</Text>
              <Text style={styles.notePostTitle} numberOfLines={2}>
                {roomTitle}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={COLORS.gray700} />
          </TouchableOpacity>
        ) : (
          <View style={styles.tradeCard}>
            <View style={styles.tradeTop}>
              <View style={styles.thumbnail} />

              <View style={styles.tradeInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.tradeTitle}>{roomTitle}</Text>

                  <View style={[styles.statusBadge, statusStyle.badge]}>
                    <Text style={[styles.statusText, statusStyle.text]}>
                      {tradeStatus}
                    </Text>
                  </View>
                </View>

                {!isNote && buyerMemberName ? (
                  <View style={styles.buyerInfoBox}>
                    <Text style={styles.buyerInfoLabel}>
                      {isSeller ? "선택 멤버" : "내 참여 멤버"}
                    </Text>
                    <Text style={styles.buyerInfoValue}>{buyerMemberName}</Text>
                  </View>
                ) : null}
              </View>
            </View>

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
                      <Text
                        style={[
                          styles.memberInitial,
                          { color: member.initialColor },
                        ]}
                      >
                        {member.initial}
                      </Text>
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
                <Text
                  style={[styles.sheetInitial, { color: member.initialColor }]}
                >
                  {member.initial}
                </Text>
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
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: "900",
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
  },
  sheetInitial: {
    fontSize: 17,
    fontWeight: "900",
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
    fontWeight: "400",
  },
});