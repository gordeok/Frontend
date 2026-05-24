// 커뮤니티 목록

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CommunityCategory,
  CommunityPost,
  getCommunityPosts,
} from "../../services/community";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray100: "#F7F7F7",
  yellow: "#F7C94B",
  line: "#EEEEEE",
};

const SCREEN_PADDING = 22;

const categories = ["전체", "포카교환", "오프동행", "질문게시판", "자유게시판"];

type SortType = "latest" | "likes" | "views";

const sortOptions: { key: SortType; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "likes", label: "좋아요순" },
  { key: "views", label: "조회수순" },
];

const CATEGORY_BADGE_COLORS: Record<
  string,
  {
    backgroundColor: string;
    textColor: string;
  }
> = {
  포카교환: {
    backgroundColor: "#FFF5D6",
    textColor: "#B58900",
  },
  질문게시판: {
    backgroundColor: "#F1E8FF",
    textColor: "#7A4FD8",
  },
  오프동행: {
    backgroundColor: "#E7F6EA",
    textColor: "#3A8B4C",
  },
  자유게시판: {
    backgroundColor: "#FFEAF3",
    textColor: "#D64F8B",
  },
};

function convertCategory(category: string): CommunityCategory {
  switch (category) {
    case "포카교환":
      return "PHOTO_EXCHANGE";
    case "오프동행":
      return "OFFLINE_COMPANION";
    case "질문게시판":
      return "QUESTION";
    case "자유게시판":
      return "FREE";
    default:
      return "ALL";
  }
}

function convertCategoryLabel(category: string) {
  switch (category) {
    case "PHOTO_EXCHANGE":
      return "포카교환";
    case "OFFLINE_COMPANION":
      return "오프동행";
    case "QUESTION":
      return "질문게시판";
    case "FREE":
      return "자유게시판";
    default:
      return "전체";
  }
}

function getCategoryBadgeColor(category: string) {
  return (
    CATEGORY_BADGE_COLORS[category] ?? {
      backgroundColor: "#F2F2F2",
      textColor: "#666666",
    }
  );
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getMonth() + 1}.${date.getDate()}`;
}

export default function CommunityScreen() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedSort, setSelectedSort] = useState<SortType>("latest");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);

        const response = await getCommunityPosts({
          category: convertCategory(selectedCategory),
          sort: selectedSort === "likes" ? "likes" : "latest",
          page: 0,
          size: 10,
        });

        setPosts(response.content);
      } catch (error) {
        console.log("커뮤니티 목록 불러오기 실패", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [selectedCategory, selectedSort]);

  const filteredPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (selectedSort === "likes") {
        return b.likeCount - a.likeCount;
      }

      if (selectedSort === "views") {
        return b.viewCount - a.viewCount;
      }

      return 0;
    });
  }, [posts, selectedSort]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>커뮤니티</Text>
        </View>

        <View style={styles.categoryWrap}>
          {categories.map((category) => {
            const active = selectedCategory === category;

            return (
              <Pressable
                key={category}
                style={styles.categoryButton}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>

                {active && <View style={styles.activeLine} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sortWrap}>
          {sortOptions.map((option) => {
            const active = selectedSort === option.key;

            return (
              <Pressable
                key={option.key}
                style={[styles.sortButton, active && styles.sortButtonActive]}
                onPress={() => setSelectedSort(option.key)}
              >
                <Text style={[styles.sortText, active && styles.sortTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => String(item.postId)}
          contentContainerStyle={[
            styles.listContent,
            filteredPosts.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {loading
                  ? "게시글을 불러오는 중이에요."
                  : "게시글이 없어요."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const categoryLabel = convertCategoryLabel(item.category);
            const badgeColor = getCategoryBadgeColor(categoryLabel);

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.postBox,
                  pressed && styles.postBoxPressed,
                ]}
                onPress={() => router.push(`/community/${item.postId}`)}
              >
                <View style={styles.profileRow}>
                  <View style={styles.profileCircle}>
                    <Text style={styles.profileText}>
                      {item.authorNickname?.[0] ?? "덕"}
                    </Text>
                  </View>

                  <View style={styles.writerBox}>
                    <Text style={styles.name}>{item.authorNickname}</Text>
                    <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>

                <View style={styles.titleRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: badgeColor.backgroundColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: badgeColor.textColor },
                      ]}
                    >
                      {categoryLabel}
                    </Text>
                  </View>

                  <Text style={styles.title}>{item.title}</Text>
                </View>

                <Text style={styles.content} numberOfLines={2}>
                  {item.contentPreview}
                </Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="heart-outline"
                      size={15}
                      color={COLORS.gray500}
                    />
                    <Text style={styles.infoText}>{item.likeCount}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={14}
                      color={COLORS.gray500}
                    />
                    <Text style={styles.infoText}>{item.commentCount}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons
                      name="eye-outline"
                      size={16}
                      color={COLORS.gray500}
                    />
                    <Text style={styles.infoText}>{item.viewCount}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />

        <Pressable
          style={({ pressed }) => [
            styles.writeButton,
            pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
          ]}
          onPress={() => router.push("/community-create")}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.writeText}>글쓰기</Text>
        </Pressable>
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

  categoryWrap: {
    height: 48,
    paddingHorizontal: SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },

  categoryButton: {
    marginRight: 22,
    paddingBottom: 12,
    position: "relative",
  },

  categoryText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.gray400,
  },

  categoryTextActive: {
    color: COLORS.black,
    fontWeight: "900",
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

  sortWrap: {
    height: 50,
    paddingHorizontal: SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  sortButton: {
    height: 31,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },

  sortButtonActive: {
    backgroundColor: COLORS.black,
  },

  sortText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.gray500,
  },

  sortTextActive: {
    color: COLORS.white,
  },

  listContent: {
    paddingBottom: 105,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  emptyBox: {
    flex: 1,
    paddingTop: 120,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.gray400,
    fontWeight: "600",
  },

  postBox: {
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  postBoxPressed: {
    opacity: 0.72,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#FFF1C6",
  },

  profileText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.black,
  },

  writerBox: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.gray900,
  },

  time: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray400,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  badge: {
    minHeight: 24,
    paddingHorizontal: 9,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
    marginTop: 1,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 22,
  },

  content: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray700,
    marginBottom: 12,
    lineHeight: 20,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },

  infoText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },

  writeButton: {
    position: "absolute",
    right: 22,
    bottom: 28,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.yellow,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  writeText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.white,
    marginLeft: 5,
  },
});