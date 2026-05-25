import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyPurchases, MyPurchase } from "../services/user";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B0B0B0",
  gray100: "#F6F6F6",
  yellow: "#F7C94B",
  lightYellow: "#FFF4CC",
  green: "#31C48D",
  lightGreen: "#E7F8EF",
  blue: "#4C8DFF",
  lightBlue: "#EAF2FF",
  line: "#F2EDE6",
};

type PurchaseStatus = "예약중" | "배송중" | "거래완료";

type PurchaseItem = {
  id: number;
  postId: number;
  title: string;
  member: string;
  date: string;
  status: PurchaseStatus;
  canWriteReview: boolean;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10).replaceAll("-", ".");
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "");
}

function mapPurchase(item: MyPurchase): PurchaseItem {
  const isDone = item.postStatus === "COMPLETED" || item.postStatus === "CLOSED" || item.postStatus === "거래완료";

  return {
    id: item.participationId,
    postId: item.postId,
    title: item.postTitle,
    member: `${item.memberName} 참여`,
    date: formatDate(item.createdAt),
    status: isDone ? "거래완료" : "예약중",
    canWriteReview: item.canWriteReview,
  };
}

export default function PurchaseListScreen() {
  const [selectedTab, setSelectedTab] = useState<"progress" | "done">("progress");
  const [progressList, setProgressList] = useState<PurchaseItem[]>([]);
  const [doneList, setDoneList] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [openData, completedData] = await Promise.all([
          getMyPurchases("OPEN"),
          getMyPurchases("COMPLETED"),
        ]);

        setProgressList(openData.map(mapPurchase));
        setDoneList(completedData.map(mapPurchase));
      } catch (error: any) {
        console.log("구매 목록 조회 실패:", error);
        setProgressList([]);
        setDoneList([]);
        setErrorMessage(error?.message || "구매 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPurchases();
  }, []);

  const currentList = selectedTab === "progress" ? progressList : doneList;

  const getStatusStyle = (status: PurchaseStatus) => {
    if (status === "거래완료") {
      return {
        box: styles.doneStatusBadge,
        text: styles.doneStatusText,
      };
    }

    if (status === "배송중") {
      return {
        box: styles.deliveryStatusBadge,
        text: styles.deliveryStatusText,
      };
    }

    return {
      box: styles.progressStatusBadge,
      text: styles.progressStatusText,
    };
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.headerIcon,
              (pressed || hovered) && styles.headerIconHover,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </Pressable>

          <Text style={styles.headerTitle}>분철 구매 목록</Text>

          <View style={styles.headerIcon} />
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.tabButton,
              selectedTab === "progress" && styles.activeTabButton,
              (pressed || hovered) && styles.tabButtonHover,
            ]}
            onPress={() => setSelectedTab("progress")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "progress" && styles.activeTabText,
              ]}
            >
              거래 중
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.tabButton,
              selectedTab === "done" && styles.activeTabButton,
              (pressed || hovered) && styles.tabButtonHover,
            ]}
            onPress={() => setSelectedTab("done")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "done" && styles.activeTabText,
              ]}
            >
              거래 완료
            </Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {isLoading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator size="small" color={COLORS.yellow} />
              <Text style={styles.emptyTitle}>구매 목록을 불러오는 중이에요</Text>
            </View>
          ) : currentList.length > 0 ? (
            currentList.map((item) => {
              const statusStyle = getStatusStyle(item.status);

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed, hovered }) => [
                    styles.listCard,
                    selectedTab === "done" && styles.doneListCard,
                    (pressed || hovered) && styles.listCardHover,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/divide-detail",
                      params: { postId: String(item.postId) },
                    } as any)
                  }
                >
                  <View style={styles.cardTop}>
                    <View style={styles.imageBox}>
                      <Ionicons
                        name="albums-outline"
                        size={22}
                        color={COLORS.black}
                      />
                    </View>

                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.title}</Text>

                      <View style={styles.subRow}>
                        <Text style={styles.itemSubText}>{item.member}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.itemSubText}>{item.date}</Text>
                      </View>
                    </View>

                    {selectedTab === "progress" && (
                      <View style={statusStyle.box}>
                        <Text style={statusStyle.text}>{item.status}</Text>
                      </View>
                    )}
                  </View>

                  {selectedTab === "done" && item.canWriteReview && (
                    <Pressable
                      style={({ pressed, hovered }) => [
                        styles.reviewButton,
                        (pressed || hovered) && styles.reviewButtonHover,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        router.push({
                          pathname: "/review-write",
                          params: {
                            postId: String(item.postId),
                            participationId: String(item.id),
                          },
                        } as any);
                      }}
                    >
                      <Text style={styles.reviewButtonText}>후기 작성하기</Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons
                name="receipt-outline"
                size={34}
                color={COLORS.gray400}
              />
              <Text style={styles.emptyTitle}>구매 내역이 없어요</Text>
              <Text style={styles.emptyText}>
                {errorMessage || "참여한 분철이 생기면 여기에 표시돼요."}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerIconHover: {
    opacity: 0.55,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
  },

  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },

  tabButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },

  activeTabButton: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.yellow,
  },

  tabButtonHover: {
    opacity: 0.82,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.gray700,
  },

  activeTabText: {
    color: COLORS.white,
    fontWeight: "900",
  },

  listContent: {
    paddingBottom: 36,
  },

  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  doneListCard: {
    paddingBottom: 12,
  },

  listCardHover: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },

  cardTop: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
  },

  imageBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.lightYellow,
    justifyContent: "center",
    alignItems: "center",
  },

  itemInfo: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
    lineHeight: 21,
    marginBottom: 4,
  },

  subRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  itemSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 17,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.gray400,
    marginHorizontal: 6,
  },

  reviewButton: {
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  reviewButtonHover: {
    backgroundColor: COLORS.gray100,
    opacity: 0.9,
  },

  reviewButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.gray700,
  },

  progressStatusBadge: {
    backgroundColor: COLORS.lightYellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
  },

  progressStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#B89416",
  },

  deliveryStatusBadge: {
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
  },

  deliveryStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.blue,
  },

  doneStatusBadge: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
  },

  doneStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.green,
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    marginTop: 14,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray500,
  },
});