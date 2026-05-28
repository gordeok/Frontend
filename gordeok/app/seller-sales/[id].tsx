// 판매자 판매 목록 화면

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiRequest, getStoredUserId } from "../../utils/api";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray100: "#F6F6F6",
  line: "#F2EDE6",
  yellow: "#F7C94B",
  lightYellow: "#FFF4CC",
  green: "#31C48D",
  lightGreen: "#E7F8EF",
  grayBadgeBg: "#EFEFEF",
  grayBadgeText: "#888888",
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

type TabType = "OPEN" | "COMPLETED";

type MemberItem = {
  id?: number;
  memberName?: string;
  name?: string;
  price?: number;
  status?: string;
};

type SaleItem = {
  id: number;
  title: string;
  idolName: string;
  status: string;
  createdAt?: string;
  participantCount?: number;
  currentCount?: number;
  maxMemberCount?: number;
  imageUrl?: string;
};

type MySaleApiItem = {
  postId: number;
  postTitle: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
  postStatus?: string;
  participantCount?: number;
  createdAt?: string;
};

type PostListItem = {
  id: number;
  userId: number;
  title: string;
  idolName?: string;
  albumName?: string;
  status?: string;
  createdAt?: string;
  imageUrl?: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  participantCount?: number;
  currentMembers?: number;
  currentMemberCount?: number;
  maxMembers?: number;
  maxMemberCount?: number;
  memberItems?: MemberItem[];
};

type ProfileApiResponse = {
  userId: number;
  nickname: string;
  profileImage?: string;
  trustScore?: number;
  hasScamReport?: boolean;
  createdAt?: string;
};

function getPageContent<T>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function formatDate(value?: string) {
  if (!value) return "";

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
  if (!status) return "OPEN";

  const raw = String(status).trim().replace(/\s/g, "").toUpperCase();

  if (
    raw === "COMPLETED" ||
    raw === "CLOSED" ||
    raw === "DONE" ||
    raw === "COMPLETE" ||
    raw === "완료" ||
    raw === "모집완료" ||
    raw === "거래완료"
  ) {
    return "COMPLETED";
  }

  return "OPEN";
}

function getStatusText(status?: string) {
  return normalizeStatus(status) === "COMPLETED" ? "거래완료" : "모집중";
}

function getCleanText(value?: string | number | null) {
  const text = String(value ?? "").trim();
  return text;
}

function getMemberItemCount(memberItems?: MemberItem[]) {
  if (!Array.isArray(memberItems)) return 0;
  return memberItems.length;
}

function getPostId(post: PostListItem) {
  return Number(post.id);
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

function getRealIdolName(post?: PostListItem | null) {
  const idolName = getCleanText(post?.idolName);

  if (idolName) return idolName;

  const albumName = getCleanText(post?.albumName);

  if (albumName) return albumName;

  return "아이돌명 없음";
}

function getRecruitCount(post?: PostListItem | null) {
  const maxMembers = Number(post?.maxMembers ?? post?.maxMemberCount ?? 0);
  const memberItemsCount = getMemberItemCount(post?.memberItems);

  if (Number.isFinite(maxMembers) && maxMembers > 0) return maxMembers;
  if (memberItemsCount > 0) return memberItemsCount;

  return 0;
}

function getCurrentCountFromPost(post?: PostListItem | null) {
  const currentMembers = Number(
    post?.currentMembers ?? post?.currentMemberCount ?? 0
  );

  if (Number.isFinite(currentMembers) && currentMembers > 0) {
    return currentMembers;
  }

  const participantCount = Number(post?.participantCount ?? 0);

  if (Number.isFinite(participantCount) && participantCount >= 0) {
    return participantCount + 1;
  }

  return 1;
}

function formatMemberCount(item: SaleItem) {
  const currentCount = Number(item.currentCount ?? 1);
  const recruitCount = Number(item.maxMemberCount ?? 0);

  const displayCurrentCount =
    Number.isFinite(currentCount) && currentCount > 0 ? currentCount : 1;

  const displayMaxCount =
    Number.isFinite(recruitCount) && recruitCount > 0
      ? recruitCount + 1
      : displayCurrentCount;

  return `${displayCurrentCount}/${displayMaxCount}명`;
}

function toImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (!trimmedUrl) return "";

  if (
    trimmedUrl.startsWith("http://") ||
    trimmedUrl.startsWith("https://") ||
    trimmedUrl.startsWith("file://")
  ) {
    return trimmedUrl;
  }

  if (!API_BASE_URL) {
    return trimmedUrl;
  }

  const baseUrl = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  const path = trimmedUrl.startsWith("/") ? trimmedUrl : `/${trimmedUrl}`;

  return `${baseUrl}${path}`;
}

function getPostImageUrl(post?: any) {
  const rawUrl =
    post?.imageUrls?.[0] ||
    post?.imageUrl ||
    post?.thumbnailUrl ||
    post?.postImageUrl ||
    post?.thumbnailImageUrl ||
    "";

  return toImageUrl(rawUrl);
}

function normalizeMySale(
  item: MySaleApiItem,
  postMap: Map<number, PostListItem>,
  forcedStatus?: TabType
): SaleItem {
  const postId = Number(item.postId);
  const matchedPost = postMap.get(postId);

  const participantCount = Number(item.participantCount ?? 0);
  const currentCountFromPost = getCurrentCountFromPost(matchedPost);
  const currentCount =
    currentCountFromPost > 1 ? currentCountFromPost : participantCount + 1;

  return {
    id: postId,
    title: item.postTitle || matchedPost?.title || "제목 없음",
    idolName: getRealIdolName(matchedPost),
    status:
      forcedStatus ?? normalizeStatus(item.postStatus || matchedPost?.status),
    createdAt: item.createdAt || matchedPost?.createdAt,
    participantCount,
    currentCount,
    maxMemberCount: getRecruitCount(matchedPost),
    imageUrl: getPostImageUrl(item) || getPostImageUrl(matchedPost),
  };
}

function normalizeOtherSale(item: PostListItem): SaleItem {
  return {
    id: Number(item.id),
    title: item.title || "제목 없음",
    idolName: getRealIdolName(item),
    status: normalizeStatus(item.status),
    createdAt: item.createdAt,
    participantCount: Number(item.participantCount ?? 0),
    currentCount: getCurrentCountFromPost(item),
    maxMemberCount: getRecruitCount(item),
    imageUrl: getPostImageUrl(item),
  };
}

export default function SellerSalesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [sellerName, setSellerName] = useState("판매자");
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabType>("OPEN");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    const loadSales = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const myUserId = await getStoredUserId();
        const sellerId = id ? String(id) : String(myUserId ?? "");

        if (!sellerId) {
          setSales([]);
          setErrorMessage("판매자 정보를 찾을 수 없습니다.");
          return;
        }

        const isMyPage = String(myUserId) === String(sellerId);

        const postsRes = await apiRequest<any>("/api/posts", {
          method: "GET",
          query: {
            page: 0,
            size: 100,
            sort: "latest",
          },
        });

        console.log("판매 목록용 전체 게시글 응답:", postsRes);

        const posts = getPageContent<PostListItem>(postsRes);
        const postMap = makePostMap(posts);

        if (isMyPage && myUserId) {
          const [profileRes, openRes, completedRes] = await Promise.all([
            apiRequest<ProfileApiResponse>("/api/users/me", {
              method: "GET",
              query: { userId: myUserId },
            }),
            apiRequest<any>("/api/users/me/sales", {
              method: "GET",
              query: {
                userId: myUserId,
                status: "OPEN",
                page: 0,
                size: 50,
              },
            }),
            apiRequest<any>("/api/users/me/sales", {
              method: "GET",
              query: {
                userId: myUserId,
                status: "COMPLETED",
                page: 0,
                size: 50,
              },
            }),
          ]);

          console.log("내 판매 목록 OPEN 응답:", openRes);
          console.log("내 판매 목록 COMPLETED 응답:", completedRes);

          setSellerName(profileRes?.nickname || "판매자");

          const openSales = getPageContent<MySaleApiItem>(openRes).map((item) =>
            normalizeMySale(item, postMap, "OPEN")
          );

          const completedSales = getPageContent<MySaleApiItem>(
            completedRes
          ).map((item) => normalizeMySale(item, postMap, "COMPLETED"));

          const merged = [...openSales, ...completedSales].filter(
            (item, index, array) =>
              array.findIndex((target) => target.id === item.id) === index
          );

          setSales(merged);
          return;
        }

        const profileRes = await apiRequest<ProfileApiResponse>(
          `/api/users/${sellerId}/profile`,
          {
            method: "GET",
          }
        );

        setSellerName(profileRes?.nickname || "판매자");

        const filteredSales = posts
          .filter((post) => String(post.userId) === String(sellerId))
          .map(normalizeOtherSale);

        setSales(filteredSales);
      } catch (error: any) {
        setSales([]);
        setErrorMessage(error?.message || "판매 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSales();
  }, [id]);

  const openSales = useMemo(() => {
    return sales
      .filter((sale) => normalizeStatus(sale.status) === "OPEN")
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [sales]);

  const completedSales = useMemo(() => {
    return sales
      .filter((sale) => normalizeStatus(sale.status) === "COMPLETED")
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [sales]);

  const visibleSales = selectedTab === "OPEN" ? openSales : completedSales;

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

          <Text style={styles.headerTitle}>판매 목록</Text>

          <View style={styles.headerIcon} />
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={COLORS.yellow} />
            <Text style={styles.centerText}>판매 목록을 불러오는 중이에요</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.pageDescription}>
              {sellerName}님의 판매 목록입니다.
            </Text>

            <View style={styles.tabRow}>
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.tabButton,
                  selectedTab === "OPEN" && styles.activeTabButton,
                  (pressed || hovered) && styles.tabButtonHover,
                ]}
                onPress={() => setSelectedTab("OPEN")}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === "OPEN" && styles.activeTabText,
                  ]}
                >
                  거래 중
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed, hovered }) => [
                  styles.tabButton,
                  selectedTab === "COMPLETED" && styles.activeTabButton,
                  (pressed || hovered) && styles.tabButtonHover,
                ]}
                onPress={() => setSelectedTab("COMPLETED")}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === "COMPLETED" && styles.activeTabText,
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
              {visibleSales.length > 0 ? (
                visibleSales.map((sale) => {
                  const isDone = normalizeStatus(sale.status) === "COMPLETED";
                  const hasImage =
                    !!sale.imageUrl && imageErrorMap[sale.id] !== true;

                  return (
                    <Pressable
                      key={sale.id}
                      style={({ pressed, hovered }) => [
                        styles.listCard,
                        (pressed || hovered) && styles.listCardHover,
                      ]}
                      onPress={() => {
                        router.push({
                          pathname: "/divide-detail",
                          params: { postId: String(sale.id) },
                        } as any);
                      }}
                    >
                      <View style={styles.cardRow}>
                        <View style={styles.imageBox}>
                          {hasImage ? (
                            <Image
                              source={{ uri: sale.imageUrl }}
                              style={styles.albumImage}
                              resizeMode="cover"
                              onError={() => {
                                console.log(
                                  "판매 목록 앨범 이미지 로드 실패:",
                                  sale.imageUrl
                                );

                                setImageErrorMap((prev) => ({
                                  ...prev,
                                  [sale.id]: true,
                                }));
                              }}
                            />
                          ) : (
                            <Ionicons
                              name="albums-outline"
                              size={22}
                              color={COLORS.black}
                            />
                          )}
                        </View>

                        <View style={styles.itemInfo}>
                          <View style={styles.titleBadgeRow}>
                            <Text style={styles.itemTitle}>{sale.title}</Text>

                            {selectedTab === "OPEN" && (
                              <View style={styles.progressStatusBadge}>
                                <Text style={styles.progressStatusText}>
                                  {getStatusText(sale.status)}
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.itemSubText}>
                            {isDone
                              ? `${sale.idolName} · ${
                                  formatDate(sale.createdAt) || "작성일 없음"
                                }`
                              : `${sale.idolName} · ${formatMemberCount(sale)}`}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>
                    {selectedTab === "OPEN"
                      ? "거래 중인 판매글이 없어요"
                      : "거래 완료된 판매글이 없어요"}
                  </Text>
                  <Text style={styles.emptyText}>
                    {selectedTab === "OPEN"
                      ? "현재 진행 중인 분철 게시글이 없습니다."
                      : "아직 완료된 분철 게시글이 없습니다."}
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
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

  pageDescription: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray500,
    marginTop: 4,
    marginBottom: 10,
  },

  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
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

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  centerText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray500,
  },

  errorText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.gray500,
    textAlign: "center",
  },

  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  listCardHover: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },

  cardRow: {
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
    marginRight: 12,
    overflow: "hidden",
  },

  albumImage: {
    width: "100%",
    height: "100%",
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  itemTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
    lineHeight: 21,
    marginBottom: 4,
  },

  itemSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 17,
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

  doneStatusBadge: {
    backgroundColor: COLORS.grayBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
  },

  doneStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.grayBadgeText,
  },

  emptyBox: {
    alignItems: "center",
    paddingTop: 100,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray500,
  },
});