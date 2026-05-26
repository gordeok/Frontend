import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { getBookmarks, toggleBookmark } from "../services/bookmark";
import type { BookmarkItem } from "../types/bookmark";

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
  line: "#F2EDE6",
};

export default function BookmarkListScreen() {
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getBookmarks();
      setBookmarks(data ?? []);
    } catch (error: any) {
      console.log("북마크 목록 조회 실패:", error);
      setBookmarks([]);
      setErrorMessage(
        error?.message || "북마크 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goDetail = (post: BookmarkItem) => {
    const postData = {
      id: String(post.postId),
      groupId: post.idolName,
      groupName: post.idolName,
      userName: post.nickname,
      title: post.title,
      albumName: post.albumName || "",
      time: formatTime(post.createdAt),
      date: post.createdAt?.slice(0, 10) ?? "",
      status: normalizePostStatus(post.status),
      completed:
        post.status === "COMPLETED" ||
        post.status === "CLOSED" ||
        post.status === "모집완료",
      content: "",
      components: [],
      deliveryMethod: "",
      members: (post.memberItems || []).map((member) => ({
        name: member.memberName,
        state: normalizeMemberStatus(member.status),
        price: member.price,
      })),
    };

    router.push({
      pathname: "/divide-detail",
      params: {
        postId: String(post.postId),
        postData: JSON.stringify(postData),
        groups: "",
        members: "",
      },
    } as any);
  };

  const handleRemoveBookmark = async (post: BookmarkItem) => {
    try {
      setRemovingId(post.bookmarkId);

      await toggleBookmark(post.postId);

      setBookmarks((prev) =>
        prev.filter((item) => item.bookmarkId !== post.bookmarkId)
      );
    } catch (error: any) {
      console.log("북마크 취소 실패:", error);
      setErrorMessage(error?.message || "북마크 취소에 실패했습니다.");
    } finally {
      setRemovingId(null);
    }
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
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </Pressable>

          <Text style={styles.headerTitle}>북마크 목록</Text>

          <View style={styles.headerIcon} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>북마크를 불러오는 중이에요</Text>
            </View>
          ) : bookmarks.length > 0 ? (
            bookmarks.map((item) => (
              <Pressable
                key={String(item.bookmarkId)}
                style={({ pressed, hovered }) => [
                  styles.card,
                  (pressed || hovered) && styles.cardHover,
                ]}
                onPress={() => goDetail(item)}
              >
                <View style={styles.thumbnail}>
                  <Ionicons
                    name="albums-outline"
                    size={22}
                    color={COLORS.black}
                  />
                </View>

                <View style={styles.textBox}>
                  <Text style={styles.title}>{item.title}</Text>

                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.nickname}
                    {item.idolName ? ` · ${item.idolName}` : ""}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed, hovered }) => [
                    styles.bookmarkButton,
                    (pressed || hovered) && styles.bookmarkButtonHover,
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleRemoveBookmark(item);
                  }}
                  disabled={removingId === item.bookmarkId}
                  hitSlop={10}
                >
                  <Ionicons name="bookmark" size={22} color={COLORS.yellow} />
                </Pressable>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>저장한 북마크가 없어요</Text>
              {!!errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function normalizePostStatus(status: string) {
  if (status === "COMPLETED" || status === "CLOSED" || status === "모집완료") {
    return "모집완료";
  }

  return "모집중";
}

function normalizeMemberStatus(status: string) {
  if (status === "COMPLETED" || status === "모집완료") return "모집완료";
  if (status === "RESERVED" || status === "예약중") return "예약중";
  return "모집중";
}

function formatTime(createdAt: string) {
  if (!createdAt) return "";

  const created = new Date(createdAt);
  const now = new Date();
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);

  if (Number.isNaN(diff)) return "";
  if (diff < 1) return "방금 전";
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;

  return `${Math.floor(diff / 1440)}일 전`;
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

  scroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    paddingTop: 12,
    paddingBottom: 36,
  },

  card: {
    minHeight: 88,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  cardHover: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },

  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.lightYellow,
    alignItems: "center",
    justifyContent: "center",
  },

  textBox: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
    color: COLORS.gray900,
    marginBottom: 6,
  },

  sellerName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 18,
  },

  bookmarkButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  bookmarkButtonHover: {
    backgroundColor: COLORS.gray100,
    opacity: 0.85,
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 250,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    marginTop: 30,
    marginBottom: 6,
  },

  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 18,
  },
});
