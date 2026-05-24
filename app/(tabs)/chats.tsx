import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
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

import { getChatRooms, leaveChatRoom } from "../../services/chat";

type ChatTab = "divide" | "note";
type UserRole = "seller" | "buyer";

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
};

type NoteRoom = {
  id: number;
  title: string;
  boardName: string;
  userName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
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

const SCREEN_PADDING = 22;
const LEAVE_WIDTH = 88;

// TODO: 로그인 연동 후 실제 로그인한 userId로 교체
const USER_ID = 1;

function formatChatTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function getRoomColor(status: "progress" | "done", index: number) {
  if (status === "done") return "gray";

  const colors: DivideRoom["color"][] = ["yellow", "purple", "pink"];
  return colors[index % colors.length];
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
  const [loading, setLoading] = useState(true);
  const [isAnyRowOpen, setIsAnyRowOpen] = useState(false);

  const swipeRefs = useRef<Record<string, Swipeable | null>>({});
  const openedRowKey = useRef<string | null>(null);
  const removedIdRef = useRef<string | null>(null);
  const completedIdRef = useRef<string | null>(null);
  const reviewSubmittedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        setLoading(true);

        const rooms = await getChatRooms(USER_ID);

        const divideData: DivideRoom[] = rooms
          .filter((room) => room.type === "GROUP")
          .map((room, index) => {
            const status = room.status === "done" ? "done" : "progress";

            return {
              id: room.chatRoomId,
              title: room.title,
              organizer: room.sellerName,
              memberCount: `${room.currentMembers}/${room.maxMembers}명`,
              lastMessage: room.lastMessage || "아직 메시지가 없어요.",
              time: formatChatTime(room.lastMessageTime),
              unreadCount: room.unreadCount,
              status,
              color: getRoomColor(status, index),
              role: room.myRole === "SELLER" ? "seller" : "buyer",
              reviewSubmitted: false,
            };
          });

        const noteData: NoteRoom[] = rooms
          .filter((room) => room.type === "DIRECT")
          .map((room) => ({
            id: room.chatRoomId,
            title: room.title,
            boardName: "쪽지",
            userName: room.sellerName,
            lastMessage: room.lastMessage || "아직 메시지가 없어요.",
            time: formatChatTime(room.lastMessageTime),
            unreadCount: room.unreadCount,
          }));

        setDivideRooms(divideData);
        setNoteRooms(noteData);
      } catch (error) {
        setDivideRooms([]);
        setNoteRooms([]);
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();
  }, []);

  useEffect(() => {
    if (!removedChatRoomId) return;
    if (removedIdRef.current === removedChatRoomId) return;

    removedIdRef.current = removedChatRoomId;

    const targetId = Number(removedChatRoomId);

    setDivideRooms((prev) => prev.filter((room) => room.id !== targetId));
    setNoteRooms((prev) => prev.filter((room) => room.id !== targetId));
  }, [removedChatRoomId]);

  useEffect(() => {
    if (!completedChatRoomId) return;
    if (completedIdRef.current === completedChatRoomId) return;

    completedIdRef.current = completedChatRoomId;

    const targetId = Number(completedChatRoomId);

    setDivideRooms((prev) =>
      prev.map((room) =>
        room.id === targetId
          ? {
              ...room,
              status: "done",
              unreadCount: 0,
              lastMessage: "거래가 완료되었습니다.",
              time: "방금",
              color: "gray",
            }
          : room
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
        role: room.role,
        title: room.title,
        status: room.status === "done" ? "거래 완료" : "모집 중",
        reviewSubmitted: room.reviewSubmitted ? "true" : "false",
      },
    });
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
        role: "buyer",
        title: room.title,
      },
    });
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
            await leaveChatRoom(room.id, USER_ID);
            setDivideRooms((prev) => prev.filter((item) => item.id !== room.id));
            closeOpenedRow();
          } catch (error) {
            Alert.alert(
              "오류",
              "채팅방 나가기에 실패했어요. 다시 시도해주세요."
            );
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
            setNoteRooms((prev) => prev.filter((item) => item.id !== room.id));
            closeOpenedRow();
          } catch (error) {
            Alert.alert(
              "오류",
              "쪽지 나가기에 실패했어요. 다시 시도해주세요."
            );
          }
        },
      },
    ]);
  };

  const divideEmptyText = loading
    ? "채팅방을 불러오는 중이에요."
    : "참여 중인 분철 채팅이 없어요.";

  const noteEmptyText = loading
    ? "쪽지를 불러오는 중이에요."
    : "받은 쪽지가 없어요.";

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>채팅</Text>
          </View>

          <View style={styles.tabContainer}>
            <TabButton
              title={`분철 ${divideRooms.length}`}
              active={selectedTab === "divide"}
              onPress={() => handleChangeTab("divide")}
            />

            <TabButton
              title={`쪽지 ${noteRooms.length}`}
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
                ListEmptyComponent={<EmptyState text={divideEmptyText} />}
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
                ListEmptyComponent={<EmptyState text={noteEmptyText} />}
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
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.tabButton}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={active ? styles.activeTabText : styles.tabText}>
        {title}
      </Text>
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
        <View style={[styles.albumIconCircle, getAlbumCircleStyle(room.color)]}>
          <View style={[styles.albumIconDot, getAlbumDotStyle(room.color)]} />
        </View>
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
            {room.lastMessage}
          </Text>

          {isDone ? (
            <View style={styles.doneBadge}>
              <Text style={styles.doneBadgeText}>완료</Text>
            </View>
          ) : (
            room.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{room.unreadCount}</Text>
              </View>
            )
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
            {room.lastMessage}
          </Text>

          {room.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{room.unreadCount}</Text>
            </View>
          )}
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
  unreadBadge: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: COLORS.yellow,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
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
    color: COLORS.gray500,
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
    color: COLORS.gray700,
    marginRight: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray400,
  },
});