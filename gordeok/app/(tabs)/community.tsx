// 커뮤니티 목록

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
const STORAGE_KEY = "communityPosts";

const categories = ["전체", "포카교환", "오프동행", "질문게시판", "자유게시판"];

type SortType = "latest" | "likes" | "views";

type CommunityPost = {
  id: string;
  category: string;
  name: string;
  profileText: string;
  profileColor: string;
  time: string;
  createdAt: number;
  title: string;
  content: string;
  likes: number;
  comments: number;
  views: number;
  photoCount?: number;
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

function getCategoryBadgeColor(category: string) {
  return (
    CATEGORY_BADGE_COLORS[category] ?? {
      backgroundColor: "#F2F2F2",
      textColor: "#666666",
    }
  );
}

const dummyPosts: CommunityPost[] = [
  {
    id: "1",
    category: "포카교환",
    name: "범규와이프",
    profileText: "범",
    profileColor: "#FFF1C6",
    time: "방금 전",
    createdAt: 6,
    title: "범규 포카 교환 구해요",
    content:
      "미니소드 럭드 범규 보유 중이고 수빈이나 연준 포카랑 교환 원해요. 상태 사진 바로 보내드릴게요.",
    likes: 18,
    comments: 5,
    views: 92,
  },
  {
    id: "2",
    category: "질문게시판",
    name: "포카초보",
    profileText: "초",
    profileColor: "#EAF1FF",
    time: "12분 전",
    createdAt: 5,
    title: "분철 입금 전 확인할 것 알려주세요",
    content:
      "처음 참여하는 분철이라 인증, 후기, 입금 방식 중에서 꼭 확인해야 할 부분이 궁금해요.",
    likes: 31,
    comments: 14,
    views: 208,
  },
  {
    id: "3",
    category: "오프동행",
    name: "콘서트가자",
    profileText: "콘",
    profileColor: "#E8F6EE",
    time: "35분 전",
    createdAt: 4,
    title: "이번 주 음악방송 같이 가실 분 있나요?",
    content:
      "혼자 가기 애매해서 같이 대기하고 끝나고 카페까지 갈 분 구해요. 너무 시끄러운 분위기는 아니었으면 좋겠어요.",
    likes: 12,
    comments: 3,
    views: 76,
  },
  {
    id: "4",
    category: "자유게시판",
    name: "앨깡요정",
    profileText: "앨",
    profileColor: "#FFE6F2",
    time: "1시간 전",
    createdAt: 3,
    title: "오늘 앨범깡 결과 진짜 레전드였어요",
    content:
      "중복 없이 최애까지 나와서 하루 종일 기분 좋음... 다들 앨깡 성공했나요?",
    likes: 45,
    comments: 11,
    views: 263,
  },
  {
    id: "5",
    category: "포카교환",
    name: "해찬찾아요",
    profileText: "해",
    profileColor: "#E7FFF7",
    time: "2시간 전",
    createdAt: 2,
    title: "NCT 해찬 포카 교환 가능하신 분 찾습니다",
    content:
      "재현 포카 여러 장 보유 중이고 해찬 위주로 교환 원합니다. 상태 사진이랑 하자 여부 먼저 공유드려요.",
    likes: 22,
    comments: 8,
    views: 141,
  },
  {
    id: "6",
    category: "자유게시판",
    name: "고르덕덕",
    profileText: "덕",
    profileColor: "#F0E7FF",
    time: "3시간 전",
    createdAt: 1,
    title: "슬리브까지 끼워도 잘 들어가는 포카 바인더 추천해줄 사람",
    content:
      "기존에 쓰던 건 슬리브 끼우면 너무 빡빡해서 꺼낼 때 포카 휘어질까 봐 무서워요.",
    likes: 16,
    comments: 9,
    views: 119,
  },
];

const sortOptions: { key: SortType; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "likes", label: "좋아요순" },
  { key: "views", label: "조회수순" },
];

export default function CommunityScreen() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedSort, setSelectedSort] = useState<SortType>("latest");
  const [savedPosts, setSavedPosts] = useState<CommunityPost[]>([]);

  const loadSavedPosts = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: CommunityPost[] = saved ? JSON.parse(saved) : [];
      setSavedPosts(parsed);
    } catch (error) {
      console.log("커뮤니티 저장 글 불러오기 실패", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedPosts();
    }, [])
  );

  const allPosts = useMemo(() => {
    return [...savedPosts, ...dummyPosts];
  }, [savedPosts]);

  const filteredPosts = useMemo(() => {
    const categoryFiltered =
      selectedCategory === "전체"
        ? allPosts
        : allPosts.filter((post) => post.category === selectedCategory);

    return [...categoryFiltered].sort((a, b) => {
      if (selectedSort === "likes") {
        return b.likes - a.likes;
      }

      if (selectedSort === "views") {
        return b.views - a.views;
      }

      return b.createdAt - a.createdAt;
    });
  }, [allPosts, selectedCategory, selectedSort]);

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
                style={[
                  styles.sortButton,
                  active && styles.sortButtonActive,
                ]}
                onPress={() => setSelectedSort(option.key)}
              >
                <Text
                  style={[
                    styles.sortText,
                    active && styles.sortTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const badgeColor = getCategoryBadgeColor(item.category);

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.postBox,
                  pressed && styles.postBoxPressed,
                ]}
                onPress={() => router.push(`/community/${item.id}`)}
              >
                <View style={styles.profileRow}>
                  <View
                    style={[
                      styles.profileCircle,
                      { backgroundColor: item.profileColor },
                    ]}
                  >
                    <Text style={styles.profileText}>{item.profileText}</Text>
                  </View>

                  <View style={styles.writerBox}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.time}>{item.time}</Text>
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
                      {item.category}
                    </Text>
                  </View>

                  <Text style={styles.title}>{item.title}</Text>
                </View>

                <Text style={styles.content} numberOfLines={2}>
                  {item.content}
                </Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="heart-outline"
                      size={15}
                      color={COLORS.gray500}
                    />
                    <Text style={styles.infoText}>{item.likes}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={14}
                      color={COLORS.gray500}
                    />
                    <Text style={styles.infoText}>{item.comments}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons
                      name="eye-outline"
                      size={16}
                      color={COLORS.gray500}
                    />
                    <Text style={styles.infoText}>{item.views}</Text>
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