import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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

type ChatTab = "divide" | "note";

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
  gray200: "#EEEEEE",
  yellow: "#F3C24F",
  red: "#FF5A5A",
  line: "#EEEEEE",
};

const SCREEN_PADDING = 22;
const LEAVE_WIDTH = 88;

const initialDivideRooms: DivideRoom[] = [
  {
    id: 1,
    title: "에스파 Drama 정규 1집",
    organizer: "분철의달인",
    memberCount: "4/4명",
    lastMessage: "카리나 슬롯 입금 완료했어요!",
    time: "오후 2:14",
    unreadCount: 3,
    status: "progress",
    color: "yellow",
  },
  {
    id: 2,
    title: "뉴진스 Get Up EP",
    organizer: "포카매니아",
    memberCount: "3/5명",
    lastMessage: "배송지 주소 보내드릴게요~",
    time: "오전 11:02",
    unreadCount: 1,
    status: "progress",
    color: "purple",
  },
  {
    id: 3,
    title: "아이브 I'VE MINE",
    organizer: "덕질러",
    memberCount: "5/6명",
    lastMessage: "안녕하세요~",
    time: "어제",
    unreadCount: 1,
    status: "progress",
    color: "pink",
  },
  {
    id: 4,
    title: "세븐틴 FML 미니 10집",
    organizer: "캐럿하우스",
    memberCount: "13/13명",
    lastMessage: "분철이 완료되었어요.",
    time: "05.08",
    unreadCount: 0,
    status: "done",
    color: "gray",
  },
];

const initialNoteRooms: NoteRoom[] = [
  {
    id: 101,
    title: "에스파 Drama 정규 1집",
    boardName: "질문 게시판",
    userName: "범규와이프",
    lastMessage: "카리나 슬롯 입금 완료했어요!",
    time: "오후 2:14",
    unreadCount: 3,
  },
  {
    id: 102,
    title: "투바투 포카 교환 문의",
    boardName: "질문 게시판",
    userName: "포카매니아",
    lastMessage: "혹시 연준 포카 아직 가능할까요?",
    time: "오후 12:40",
    unreadCount: 2,
  },
  {
    id: 103,
    title: "앤팀 미개봉 앨범 양도",
    boardName: "거래 게시판",
    userName: "덕메이트",
    lastMessage: "네! 편의점 반값택배 가능해요.",
    time: "오전 10:18",
    unreadCount: 1,
  },
  {
    id: 104,
    title: "아이브 포카 판매",
    boardName: "판매 게시판",
    userName: "포카정리중",
    lastMessage: "입금 확인되면 바로 보내드릴게요.",
    time: "어제",
    unreadCount: 0,
  },
  {
    id: 105,
    title: "보넥도 럭드 분철 문의",
    boardName: "질문 게시판",
    userName: "고르덕러",
    lastMessage: "자리 남아있어요!",
    time: "05.16",
    unreadCount: 0,
  },
];

async function leaveDivideRoomApi(chatRoomId: number) {
  // 백엔드 연결 시 여기만 실제 API로 교체
  // await fetch(`${API_URL}/api/chatrooms/${chatRoomId}/leave`, {
  //   method: "DELETE",
  //   headers: {
  //     Authorization: `Bearer ${accessToken}`,
  //   },
  // });

  return true;
}

async function leaveNoteRoomApi(noteRoomId: number) {
  // 백엔드 연결 시 여기만 실제 API로 교체
  // await fetch(`${API_URL}/api/notes/${noteRoomId}/leave`, {
  //   method: "DELETE",
  //   headers: {
  //     Authorization: `Bearer ${accessToken}`,
  //   },
  // });

  return true;
}

export default function ChatsScreen() {
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState<ChatTab>("divide");
  const [divideRooms, setDivideRooms] =
    useState<DivideRoom[]>(initialDivideRooms);
  const [noteRooms, setNoteRooms] = useState<NoteRoom[]>(initialNoteRooms);
  const [isAnyRowOpen, setIsAnyRowOpen] = useState(false);

  const swipeRefs = useRef<Record<string, Swipeable | null>>({});
  const openedRowKey = useRef<string | null>(null);

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

    router.push(`/chat/${room.id}`);
  };

  const handlePressNoteRoom = (room: NoteRoom) => {
    if (openedRowKey.current) {
      closeOpenedRow();
      return;
    }

    router.push(`/chat/${room.id}`);
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
            await leaveDivideRoomApi(room.id);
            setDivideRooms((prev) => prev.filter((item) => item.id !== room.id));
            closeOpenedRow();
          } catch (error) {
            Alert.alert("오류", "채팅방 나가기에 실패했어요. 다시 시도해주세요.");
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
            await leaveNoteRoomApi(room.id);
            setNoteRooms((prev) => prev.filter((item) => item.id !== room.id));
            closeOpenedRow();
          } catch (error) {
            Alert.alert("오류", "쪽지 나가기에 실패했어요. 다시 시도해주세요.");
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
                ListEmptyComponent={<EmptyState text="받은 쪽지가 없어요." />}
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
      <Text style={active ? styles.activeTabText : styles.tabText}>{title}</Text>
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
    paddingTop: 8,
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
    backgroundColor: COLORS.red,
  },

  leaveButton: {
    flex: 1,
    width: LEAVE_WIDTH,
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
    minHeight: 90,
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