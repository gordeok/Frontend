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
import { getMyCommunityPosts, MyCommunityPost } from "../services/user";

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
  lightGreen: "#DDF8E8",
  blue: "#4C8DFF",
  lightBlue: "#E8F1FF",
  purple: "#8A5CD6",
  lightPurple: "#F1E6FF",
  line: "#F2EDE6",
};

type CommunityItem = {
  id: number;
  category: string;
  categoryColor: string;
  textColor: string;
  title: string;
  content: string;
  time: string;
};

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

function getCategoryStyle(category: string) {
  if (category === "포카교환") {
    return { categoryColor: COLORS.lightYellow, textColor: "#B89416" };
  }

  if (category === "오프동행") {
    return { categoryColor: COLORS.lightBlue, textColor: COLORS.blue };
  }

  if (category === "질문게시판") {
    return { categoryColor: COLORS.lightPurple, textColor: COLORS.purple };
  }

  return { categoryColor: COLORS.lightGreen, textColor: COLORS.green };
}

function mapCommunityPost(post: MyCommunityPost): CommunityItem {
  const categoryStyle = getCategoryStyle(post.category);

  return {
    id: post.postId,
    category: post.category,
    title: post.title,
    content: post.preview,
    time: formatTime(post.createdAt),
    ...categoryStyle,
  };
}

export default function MyCommunityPostsScreen() {
  const [selectedTab, setSelectedTab] = useState<"posts" | "comments">("posts");
  const [myPosts, setMyPosts] = useState<CommunityItem[]>([]);
  const [myComments] = useState<CommunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getMyCommunityPosts();
        setMyPosts(data.map(mapCommunityPost));
      } catch (error: any) {
        console.log("내 커뮤니티 글 조회 실패:", error);
        setMyPosts([]);
        setErrorMessage(error?.message || "커뮤니티 글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  const currentList = selectedTab === "posts" ? myPosts : myComments;

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
          {isLoading ? (
            <View style={{ alignItems: "center", paddingTop: 100 }}>
              <ActivityIndicator size="small" color={COLORS.yellow} />
            </View>
          ) : currentList.length > 0 ? (
            currentList.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed, hovered }) => [
                  styles.postCard,
                  (pressed || hovered) && styles.postCardHover,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/community/[postId]",
                    params: { postId: String(item.id) },
                  } as any)
                }
              >
                <View style={styles.profileRow}>
                  <View style={styles.profileCircle}>
                    <Text style={styles.profileText}>범</Text>
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={styles.name}>범규와이프</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>

                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: item.categoryColor },
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: item.textColor }]}>
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
            <View style={{ alignItems: "center", paddingTop: 100 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray500 }}>
                {errorMessage || (selectedTab === "posts" ? "작성한 글이 없어요" : "댓글 쓴 글 API가 아직 없어요")}
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
    backgroundColor: COLORS.lightYellow,
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