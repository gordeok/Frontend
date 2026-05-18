import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type ChatStatus = "진행중" | "완료";
type FilterType = "전체" | "진행중" | "완료";

const chatRooms = [
  {
    id: "1",
    title: "에스파 Drama 정규 1집",
    seller: "분철의달인",
    members: "4/4명",
    message: "카리나 슬롯 입금 완료했어요!",
    time: "오후 2:14",
    unread: 3,
    status: "진행중" as ChatStatus,
    color: "#F8D85A",
    bgColor: "#FFFBE8",
  },
  {
    id: "2",
    title: "뉴진스 Get Up EP",
    seller: "포카매니아",
    members: "3/5명",
    message: "배송지 주소 보내드릴게요~",
    time: "오전 11:02",
    unread: 1,
    status: "진행중" as ChatStatus,
    color: "#6B63BD",
    bgColor: "#F0EEFF",
  },
  {
    id: "3",
    title: "아이브 I'VE MINE",
    seller: "덕질러",
    members: "5/6명",
    message: "안녕하세요~",
    time: "어제",
    unread: 1,
    status: "진행중" as ChatStatus,
    color: "#C84D73",
    bgColor: "#FFF0F5",
  },
  {
    id: "4",
    title: "세븐틴 FML 미니 10집",
    seller: "캐럿하우스",
    members: "13/13명",
    message: "거래가 완료되었습니다.",
    time: "05.08",
    unread: 0,
    status: "완료" as ChatStatus,
    color: "#999999",
    bgColor: "#F1F1F1",
  },
  {
    id: "5",
    title: "르세라핌 EASY 앨범",
    seller: "핌둥이",
    members: "5/5명",
    message: "수령 완료했습니다.",
    time: "05.06",
    unread: 0,
    status: "완료" as ChatStatus,
    color: "#999999",
    bgColor: "#F1F1F1",
  },
  {
    id: "6",
    title: "라이즈 Get A Guitar",
    seller: "브리즈마켓",
    members: "6/6명",
    message: "감사합니다!",
    time: "05.03",
    unread: 0,
    status: "완료" as ChatStatus,
    color: "#999999",
    bgColor: "#F1F1F1",
  },
  {
    id: "7",
    title: "투어스 Sparkling Blue",
    seller: "분철러버",
    members: "4/4명",
    message: "분철 완료되었습니다.",
    time: "05.01",
    unread: 0,
    status: "완료" as ChatStatus,
    color: "#999999",
    bgColor: "#F1F1F1",
  },
];

export default function ChatsScreen() {
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState<FilterType>("전체");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const filteredChats =
    selectedTab === "전체"
      ? chatRooms
      : chatRooms.filter((chat) => chat.status === selectedTab);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>채팅</Text>

        <View style={styles.editArea}>
          <Pressable
            style={styles.editButton}
            onPress={() => {
              setIsEditMode(!isEditMode);
              setSelectedChatId(null);
            }}
          >
            <Text style={styles.editText}>{isEditMode ? "완료" : "편집"}</Text>
          </Pressable>

          {isEditMode && selectedChatId !== null && (
            <View style={styles.editPopup}>
              <Pressable style={styles.popupRow}>
                <Text style={styles.deleteIcon}>×</Text>
                <Text style={styles.deleteText}>삭제 및 나가기</Text>
              </Pressable>

              <View style={styles.popupDivider} />

              <Pressable
                style={styles.popupRow}
                onPress={() => setSelectedChatId(null)}
              >
                <Text style={styles.cancelText}>취소하기</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setSelectedTab("전체")} style={styles.tab}>
          <Text
            style={[
              styles.tabText,
              selectedTab === "전체" && styles.activeTabText,
            ]}
          >
            전체 7
          </Text>
          {selectedTab === "전체" && <View style={styles.activeLine} />}
        </Pressable>

        <Pressable onPress={() => setSelectedTab("진행중")} style={styles.tab}>
          <Text
            style={[
              styles.tabText,
              selectedTab === "진행중" && styles.activeTabText,
            ]}
          >
            진행중 3
          </Text>
          {selectedTab === "진행중" && <View style={styles.activeLine} />}
        </Pressable>

        <Pressable onPress={() => setSelectedTab("완료")} style={styles.tab}>
          <Text
            style={[
              styles.tabText,
              selectedTab === "완료" && styles.activeTabText,
            ]}
          >
            완료 4
          </Text>
          {selectedTab === "완료" && <View style={styles.activeLine} />}
        </Pressable>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedChatId === item.id;
          const isDimmed = isEditMode && selectedChatId !== null && !isSelected;

          return (
            <View style={styles.chatItemWrapper}>
              {isSelected && (
                <View pointerEvents="none" style={styles.selectedOutline} />
              )}

              <Pressable
                style={[styles.chatItem, isDimmed && styles.dimmedChatItem]}
                onPress={() => {
                  if (isEditMode) {
                    setSelectedChatId(item.id);
                  } else {
                    router.push(`/chat/${item.id}` as any);
                  }
                }}
              >
                <View
                  style={[styles.profileBox, { backgroundColor: item.bgColor }]}
                >
                  <View
                    style={[styles.profileCircle, { borderColor: item.color }]}
                  >
                    <View
                      style={[
                        styles.profileDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.chatContent}>
                  <View style={styles.chatTop}>
                    <Text
                      style={[
                        styles.chatTitle,
                        item.status === "완료" && styles.completedText,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>

                    <Text style={styles.time}>{item.time}</Text>
                  </View>

                  <Text style={styles.info}>
                    • {item.seller} · {item.members}
                  </Text>

                  <View style={styles.chatBottom}>
                    <Text style={styles.message} numberOfLines={1}>
                      {item.message}
                    </Text>

                    {item.status === "완료" ? (
                      <View style={styles.doneBadge}>
                        <Text style={styles.doneText}>완료</Text>
                      </View>
                    ) : (
                      item.unread > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{item.unread}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              </Pressable>

              <View style={styles.divider} />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 26,
    paddingTop: 70,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    zIndex: 999,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111111",
  },

  editArea: {
    position: "relative",
    alignItems: "flex-end",
  },

  editButton: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },

  editText: {
    fontSize: 15,
    color: "#666666",
    fontWeight: "600",
  },

  editPopup: {
    position: "absolute",
    right: 0,
    top: 48,
    width: 180,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 999,
    elevation: 10,
  },

  popupRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  popupDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
  },

  deleteIcon: {
    fontSize: 20,
    color: "#D85A52",
    marginRight: 18,
    marginTop: -2,
  },

  deleteText: {
    fontSize: 14,
    color: "#D85A52",
    fontWeight: "500",
  },

  cancelText: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "500",
  },

  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginBottom: 18,
  },

  tab: {
    marginRight: 36,
    paddingBottom: 10,
  },

  tabText: {
    fontSize: 17,
    color: "#A6A6A6",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#111111",
    fontWeight: "800",
  },

  activeLine: {
    height: 3,
    backgroundColor: "#E7C84F",
    borderRadius: 10,
    marginTop: 8,
  },

  listContent: {
    paddingBottom: 20,
  },

  chatItemWrapper: {
    position: "relative",
    paddingHorizontal: 10,
  },

  selectedOutline: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 8,
    bottom: 8,
    borderWidth: 2,
    borderColor: "#E7C84F",
    borderRadius: 18,
    zIndex: 10,
  },

  chatItem: {
    flexDirection: "row",
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
  },

  dimmedChatItem: {
    opacity: 0.35,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginLeft: 88,
  },

  profileBox: {
    width: 62,
    height: 62,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  profileCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  profileDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },

  chatContent: {
    flex: 1,
  },

  chatTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  chatTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    marginRight: 8,
  },

  completedText: {
    color: "#AFAFAF",
  },

  time: {
    fontSize: 13,
    color: "#B0B0B0",
  },

  info: {
    marginTop: 6,
    fontSize: 13,
    color: "#9A9A9A",
  },

  chatBottom: {
    marginTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  message: {
    flex: 1,
    fontSize: 15,
    color: "#777777",
    marginRight: 10,
  },

  unreadBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EAC95B",
    justifyContent: "center",
    alignItems: "center",
  },

  unreadText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  doneBadge: {
    backgroundColor: "#CFCFCF",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
  },

  doneText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
