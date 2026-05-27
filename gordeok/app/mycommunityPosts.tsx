import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getMyCommunityCommentPosts,
  getMyCommunityPosts,
  getMyProfile,
  MyCommunityCommentPost,
  MyCommunityPost,
} from "../services/user";
import { getCommunityPost } from "../services/community";
import { getStoredUserId } from "../utils/api";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B0B0B0",
  gray100: "#F6F6F6",
  yellow: "#F7C94B",
  line: "#F2EDE6",
};

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

type CommunityItem = {
  id: number;
  category: string;
  categoryColor: string;
  textColor: string;
  title: string;
  content: string;
  time: string;
  authorName?: string;
};

function convertCategoryLabel(category?: string | null) {
  switch (category) {
    case "PHOTO_EXCHANGE":
      return "포카교환";
    case "OFFLINE_COMPANION":
      return "오프동행";
    case "QUESTION":
      return "질문게시판";
    case "FREE":
      return "자유게시판";
    case "포카교환":
    case "오프동행":
    case "질문게시판":
    case "자유게시판":
      return category;
    default:
      return "자유게시판";
  }
}

function getCategoryStyle(category: string) {
  return (
    CATEGORY_BADGE_COLORS[category] ?? {
      backgroundColor: "#F2F2F2",
      textColor: "#666666",
    }
  );
}

function getPostAuthorName(post: any) {
  const nickname =
    post?.authorNickname ||
    post?.postAuthorNickname ||
    post?.writerNickname ||
    post?.authorName ||
    post?.postAuthorName ||
    post?.writerName;

  if (nickname) return String(nickname);

  const authorId = post?.authorId || post?.postAuthorId || post?.writerId;
  if (authorId) return String(authorId);

  return "작성자";
}

function uniquePostsById(items: CommunityItem[]) {
  const seen = new Set<number>();

  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function formatTime(createdAt?: string) {
  if (!createdAt) return "";

  const created = new Date(createdAt);
  const now = new Date();
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);

  if (Number.isNaN(diff)) return createdAt.slice(0, 10);
  if (diff < 1) return "방금 전";
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  if (diff < 2880) return "어제";
  return `${Math.floor(diff / 1440)}일 전`;
}

function mapCommunityPost(post: MyCommunityPost): CommunityItem {
  const categoryLabel = convertCategoryLabel(post.category);
  const categoryStyle = getCategoryStyle(categoryLabel);

  return {
    id: post.postId,
    category: categoryLabel,
    title: post.title,
    content: post.preview,
    time: formatTime(post.createdAt),
    categoryColor: categoryStyle.backgroundColor,
    textColor: categoryStyle.textColor,
  };
}

function mapCommunityCommentPost(post: MyCommunityCommentPost): CommunityItem {
  const categoryLabel = convertCategoryLabel(post.category);
  const categoryStyle = getCategoryStyle(categoryLabel);

  return {
    id: post.postId,
    category: categoryLabel,
    title: post.title,
    content:
      post.commentContent ||
      post.preview ||
      post.contentPreview ||
      "댓글을 작성한 게시글입니다.",
    time: formatTime(post.createdAt),
    authorName: getPostAuthorName(post),
    categoryColor: categoryStyle.backgroundColor,
    textColor: categoryStyle.textColor,
  };
}

async function fillCommentPostAuthors(items: CommunityItem[]) {
  return Promise.all(
    items.map(async (item) => {
      try {
        const detail = await getCommunityPost(item.id);
        return {
          ...item,
          authorName: getPostAuthorName(detail),
        };
      } catch (error) {
        console.log("댓글 쓴 글 작성자 조회 실패:", error);
        return item;
      }
    }),
  );
}

export default function MyCommunityPostsScreen() {
  const [selectedTab, setSelectedTab] = useState<"posts" | "comments">("posts");
  const [myPosts, setMyPosts] = useState<CommunityItem[]>([]);
  const [myComments, setMyComments] = useState<CommunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userLabel, setUserLabel] = useState("사용자");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        try {
          const profile = await getMyProfile();
          setUserLabel(profile.nickname || "사용자");
        } catch {
          setUserLabel("사용자");
        }

        const postsData = await getMyCommunityPosts();
        setMyPosts(postsData.map(mapCommunityPost));

        try {
          const commentsData = await getMyCommunityCommentPosts();
          const uniqueCommentPosts = uniquePostsById(
            commentsData.map(mapCommunityCommentPost),
          );
          const commentPostsWithAuthors =
            await fillCommentPostAuthors(uniqueCommentPosts);
          setMyComments(commentPostsWithAuthors);
        } catch (commentError) {
          console.log("댓글 쓴 글 조회 실패:", commentError);
          setMyComments([]);
        }
      } catch (error: any) {
        console.log("내 커뮤니티 글 조회 실패:", error);
        setMyPosts([]);
        setMyComments([]);
        setErrorMessage(error?.message || "커뮤니티 글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  const currentList = selectedTab === "posts" ? myPosts : myComments;
  const getDisplayName = (item: CommunityItem) =>
    selectedTab === "comments" ? item.authorName || "작성자" : userLabel;
  const getProfileText = (item: CommunityItem) =>
    getDisplayName(item).trim()?.[0] || "작";

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

          <Text style={styles.headerTitle}>작성한 커뮤니티 글</Text>

          <View style={styles.headerIcon} />
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.tabButton,
              selectedTab === "posts" && styles.activeTabButton,
              (pressed || hovered) && styles.tabButtonHover,
            ]}
            onPress={() => setSelectedTab("posts")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "posts" && styles.activeTabText,
              ]}
            >
              내가 작성한 글
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.tabButton,
              selectedTab === "comments" && styles.activeTabButton,
              (pressed || hovered) && styles.tabButtonHover,
            ]}
            onPress={() => setSelectedTab("comments")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "comments" && styles.activeTabText,
              ]}
            >
              댓글 쓴 글
            </Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {isLoading ? null : currentList.length > 0 ? (
            currentList.map((item) => (
              <Pressable
                key={`${selectedTab}-${item.id}`}
                style={({ pressed, hovered }) => [
                  styles.postCard,
                  (pressed || hovered) && styles.postCardHover,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/community/[postsId]",
                    params: { postsId: String(item.id) },
                  } as any)
                }
              >
                <View style={styles.profileRow}>
                  <View style={styles.profileCircle}>
                    <Text style={styles.profileText}>
                      {getProfileText(item)}
                    </Text>
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={styles.name}>{getDisplayName(item)}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>

                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: item.categoryColor },
                    ]}
                  >
                    <Text
                      style={[styles.categoryText, { color: item.textColor }]}
                    >
                      {item.category}
                    </Text>
                  </View>
                </View>

                <View style={styles.contentBox}>
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postContent} numberOfLines={2}>
                    {item.content}
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {errorMessage ||
                  (selectedTab === "posts"
                    ? "작성한 글이 없어요"
                    : "작성한 댓글이 없어요")}
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
  },

  listContent: {
    paddingBottom: 36,
  },

  emptyBox: {
    alignItems: "center",
    paddingTop: 100,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    marginTop: 140,
    marginBottom: 6,
  },

  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  postCardHover: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF4CC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  profileText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.black,
  },

  profileInfo: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 10,
  },

  name: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 2,
  },

  time: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },

  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 11,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "900",
  },

  contentBox: {
    marginTop: 14,
  },

  postTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
    lineHeight: 21,
    marginBottom: 6,
  },

  postContent: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray700,
    lineHeight: 20,
  },
});
