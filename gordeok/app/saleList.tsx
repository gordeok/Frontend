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

import { getMySales, MySale } from "../services/user";
import { apiRequest } from "../utils/api";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray100: "#F6F6F6",
  yellow: "#F7C94B",
  lightYellow: "#FFF4CC",
  green: "#31C48D",
  lightGreen: "#E7F8EF",
  blue: "#4C8DFF",
  lightBlue: "#EAF2FF",
  line: "#F2EDE6",
};

type SaleStatus = "모집중" | "배송중" | "거래완료";

type MemberItem = {
  id?: number;
  memberName?: string;
  name?: string;
  price?: number;
  status?: string;
};

type PostListItem = {
  id: number;
  postId?: number;
  userId?: number;
  title?: string;
  idolName?: string;
  albumName?: string;
  status?: string;
  participantCount?: number;
  currentMembers?: number;
  currentMemberCount?: number;
  maxMembers?: number;
  maxMemberCount?: number;
  memberItems?: MemberItem[];
};

type SaleItem = {
  id: number;
  title: string;
  subText: string;
  status: SaleStatus;
  idolName?: string;
  participantCount?: number;
  maxMemberCount?: number;
};

function getPageContent<T>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function formatDate(value?: string) {
  if (!value) return "작성일 없음";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10).replaceAll("-", ".");
  }

  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

function normalizeStatus(status?: string) {
  const raw = String(status ?? "")
    .trim()
    .replace(/\s/g, "")
    .toUpperCase();

  if (
    raw === "COMPLETED" ||
    raw === "CLOSED" ||
    raw === "DONE" ||
    raw === "COMPLETE" ||
    raw === "거래완료" ||
    raw === "모집완료"
  ) {
    return "COMPLETED";
  }

  return "OPEN";
}

function getPostId(post: PostListItem) {
  return Number(post.postId ?? post.id);
}

function makePostMap(posts: PostListItem[]) {
  const map = new Map<number, PostListItem>();

  posts.forEach((post) => {
    const postId = getPostId(post);

    if (Number.isFinite(postId)) {
      map.set(postId, post);
    }
  });

  return map;
}

function getCleanText(value?: string | number | null) {
  return String(value ?? "").trim();
}

function getRealIdolName(post?: PostListItem) {
  const idolName = getCleanText(post?.idolName);

  if (idolName) return idolName;

  const albumName = getCleanText(post?.albumName);

  if (albumName) return albumName;

  return "아이돌명 없음";
}

function getRecruitCount(post?: PostListItem) {
  const maxMembers = Number(post?.maxMembers ?? post?.maxMemberCount ?? 0);
  const memberItemCount = Array.isArray(post?.memberItems)
    ? post.memberItems.length
    : 0;

  if (Number.isFinite(maxMembers) && maxMembers > 0) {
    return maxMembers;
  }

  if (memberItemCount > 0) {
    return memberItemCount;
  }

  return 0;
}

function formatProgressSubText(item: {
  idolName?: string;
  participantCount?: number;
  maxMemberCount?: number;
}) {
  const idolName = getCleanText(item.idolName) || "아이돌명 없음";

  const participantCount = Number(item.participantCount ?? 0);
  const recruitCount = Number(item.maxMemberCount ?? 0);

  const currentCount =
    Number.isFinite(participantCount) && participantCount >= 0
      ? participantCount + 1
      : 1;

  const maxCount =
    Number.isFinite(recruitCount) && recruitCount > 0
      ? recruitCount + 1
      : currentCount;

  return `${idolName} · ${currentCount}/${maxCount}명`;
}

function formatDoneSubText(item: { idolName?: string }, createdAt?: string) {
  const idolName = getCleanText(item.idolName) || "아이돌명 없음";
  return `${idolName} · ${formatDate(createdAt)}`;
}

function mapSale(item: MySale, postMap: Map<number, PostListItem>): SaleItem {
  const postId = Number(item.postId);
  const matchedPost = postMap.get(postId);

  const isDone = normalizeStatus(item.postStatus) === "COMPLETED";

  const idolName = getRealIdolName(matchedPost);
  const participantCount = Number(item.participantCount ?? 0);
  const maxMemberCount = getRecruitCount(matchedPost);

  const baseItem = {
    id: item.postId,
    title: item.postTitle,
    status: isDone ? "거래완료" : "모집중",
    idolName,
    participantCount,
    maxMemberCount,
  } satisfies Omit<SaleItem, "subText">;

  return {
    ...baseItem,
    subText: isDone
      ? formatDoneSubText(baseItem, item.createdAt)
      : formatProgressSubText(baseItem),
  };
}

export default function SaleListScreen() {
  const [selectedTab, setSelectedTab] = useState<"progress" | "done">(
    "progress"
  );
  const [progressList, setProgressList] = useState<SaleItem[]>([]);
  const [doneList, setDoneList] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSales = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [openData, completedData, postsResponse] = await Promise.all([
          getMySales("OPEN"),
          getMySales("COMPLETED"),
          apiRequest<any>("/api/posts", {
            method: "GET",
            query: {
              page: 0,
              size: 100,
              sort: "latest",
            },
          }),
        ]);

        const posts = getPageContent<PostListItem>(postsResponse);
        const postMap = makePostMap(posts);

        setProgressList(openData.map((item) => mapSale(item, postMap)));
        setDoneList(completedData.map((item) => mapSale(item, postMap)));
      } catch (error: any) {
        console.log("판매 목록 조회 실패:", error);
        setProgressList([]);
        setDoneList([]);
        setErrorMessage(error?.message || "판매 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSales();
  }, []);

  const currentList = selectedTab === "progress" ? progressList : doneList;

  const getStatusStyle = (status: SaleStatus) => {
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

          <Text style={styles.headerTitle}>분철 판매 목록</Text>

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
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.yellow} />
            </View>
          ) : currentList.length > 0 ? (
            currentList.map((item) => {
              const statusStyle = getStatusStyle(item.status);
              const isProgressTab = selectedTab === "progress";

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
                      params: { postId: String(item.id) },
                    } as any)
                  }
                >
                  <View
                    style={[
                      styles.cardTop,
                      isProgressTab && styles.progressCardTop,
                    ]}
                  >
                    <View style={styles.imageBox}>
                      <Ionicons
                        name="albums-outline"
                        size={22}
                        color={COLORS.black}
                      />
                    </View>

                    <View
                      style={[
                        styles.itemInfo,
                        isProgressTab && styles.progressItemInfo,
                      ]}
                    >
                      {isProgressTab ? (
                        <>
                          <View style={styles.progressTitleRow}>
                            <Text style={styles.progressItemTitle}>
                              {item.title}
                            </Text>

                            <View style={statusStyle.box}>
                              <Text style={statusStyle.text}>
                                {item.status}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.itemSubText}>{item.subText}</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSubText}>{item.subText}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {selectedTab === "done" && (
                    <Pressable
                      style={({ pressed, hovered }) => [
                        styles.reviewButton,
                        (pressed || hovered) && styles.reviewButtonHover,
                      ]}
                    >
                      <Text style={styles.reviewButtonText}>받은 후기 보기</Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {errorMessage || "판매 내역이 없어요"}
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

  loadingBox: {
    alignItems: "center",
    paddingTop: 100,
  },

  emptyBox: {
    alignItems: "center",
    paddingTop: 100,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray500,
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

  progressCardTop: {
    minHeight: 50,
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

  progressItemInfo: {
    justifyContent: "center",
    paddingRight: 0,
    minWidth: 0,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
    lineHeight: 21,
    marginBottom: 4,
  },

  progressTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },

  progressItemTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
    lineHeight: 21,
  },

  itemSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 17,
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
    flexShrink: 0,
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
    marginTop: 0,
  },

  progressStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#009F63",
  },

  deliveryStatusBadge: {
    flexShrink: 0,
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
});