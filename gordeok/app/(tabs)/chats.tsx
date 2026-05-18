import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatStatus = "all" | "progress" | "done";

type ChatRoom = {
  id: number;
  title: string;
  organizer: string;
  memberCount: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  status: "progress" | "done";
  color: "yellow" | "purple" | "pink" | "gray";
};

const dummyChatRooms: ChatRoom[] = [
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
    lastMessage: "",
    time: "05.08",
    unreadCount: 0,
    status: "done",
    color: "gray",
  },
];

export default function ChatsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<ChatStatus>("all");

  const filteredChatRooms = dummyChatRooms.filter((room) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "progress") return room.status === "progress";
    if (selectedTab === "done") return room.status === "done";
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅</Text>

          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editText}>편집</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TabButton
            title="전체 4"
            active={selectedTab === "all"}
            onPress={() => setSelectedTab("all")}
          />

          <TabButton
            title="진행중 3"
            active={selectedTab === "progress"}
            onPress={() => setSelectedTab("progress")}
          />

          <TabButton
            title="완료 1"
            active={selectedTab === "done"}
            onPress={() => setSelectedTab("done")}
          />
        </View>

        <FlatList
          data={filteredChatRooms}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ChatRoomItem
              room={item}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
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
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Text style={active ? styles.activeTabText : styles.tabText}>{title}</Text>
      {active && <View style={styles.activeLine} />}
    </TouchableOpacity>
  );
}

function ChatRoomItem({
  room,
  onPress,
}: {
  room: ChatRoom;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chatItem,
        pressed && { opacity: 0.7 },
        room.status === "done" && styles.doneChatItem,
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
            style={[
              styles.chatTitle,
              room.status === "done" && styles.doneText,
            ]}
            numberOfLines={1}
          >
            {room.title}
          </Text>

          <Text style={styles.timeText}>{room.time}</Text>
        </View>

        <Text style={styles.metaText}>
          • {room.organizer} · {room.memberCount}
        </Text>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.lastMessage,
              room.status === "done" && styles.doneText,
            ]}
            numberOfLines={1}
          >
            {room.lastMessage}
          </Text>

          {room.status === "done" ? (
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

function getAlbumIconStyle(color: ChatRoom["color"]) {
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

function getAlbumCircleStyle(color: ChatRoom["color"]) {
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

function getAlbumDotStyle(color: ChatRoom["color"]) {
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

const YELLOW = "#F3C24F";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 64,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111111",
  },

  editButton: {
    backgroundColor: "#F1F1F1",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
  },

  editText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555555",
  },

  tabContainer: {
    height: 44,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  tabButton: {
    marginRight: 38,
    paddingBottom: 11,
    position: "relative",
  },

  tabText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#B5B5B5",
  },

  activeTabText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
  },

  activeLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -1,
    height: 3,
    borderRadius: 2,
    backgroundColor: YELLOW,
  },

  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 100,
  },

  chatItem: {
    minHeight: 106,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  doneChatItem: {
    opacity: 0.55,
  },

  albumIcon: {
    width: 62,
    height: 62,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  albumIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  chatTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    marginRight: 10,
  },

  timeText: {
    fontSize: 13,
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
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: YELLOW,
    justifyContent: "center",
    alignItems: "center",
  },

  unreadText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  doneBadge: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "#CFCFCF",
    justifyContent: "center",
    alignItems: "center",
  },

  doneBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  doneText: {
    color: "#9A9A9A",
  },
});