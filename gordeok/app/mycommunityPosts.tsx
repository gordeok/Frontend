import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
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
  category: string;
  categoryColor: string;
  textColor: string;
  title: string;
  content: string;
  time: string;
};

export default function MyCommunityPostsScreen() {
  const [selectedTab, setSelectedTab] = useState<"posts" | "comments">("posts");

  const myPosts: CommunityItem[] = [
    {
      category: "포카교환",
      categoryColor: COLORS.lightYellow,
      textColor: "#B89416",
      title: "투바투 포카 교환 구해요",
      content: "범규 포카 보유 중이고 수빈 포카로 교환 원해요. 직거래 가능해요.",
      time: "2시간 전",
    },
    {
      category: "오프동행",
      categoryColor: COLORS.lightBlue,
      textColor: COLORS.blue,
      title: "MOA CON 같이 입장하실 분",
      content: "혼자 가는 게 처음이라 같이 대기하고 입장하실 분 구해요.",
      time: "어제",
    },
    {
      category: "자유게시판",
      categoryColor: COLORS.lightGreen,
      textColor: COLORS.green,
      title: "이번 앨범 포카 너무 예쁘지 않나요",
      content: "컨셉도 좋고 포카 퀄리티도 좋아서 분철 기다리는 중이에요.",
      time: "3일 전",
    },
  ];

  const myComments: CommunityItem[] = [
    {
      category: "질문게시판",
      categoryColor: COLORS.lightPurple,
      textColor: COLORS.purple,
      title: "콘서트 MD 현장 구매 많이 빡센가요?",
      content: "저번에는 오전에 가도 줄이 꽤 길었어요. 가능하면 일찍 가는 거 추천해요.",
      time: "1시간 전",
    },
    {
      category: "자유게시판",
      categoryColor: COLORS.lightGreen,
      textColor: COLORS.green,
      title: "앨범깡 결과 공유해요",
      content: "범규 나오면 진짜 기분 좋죠... 저는 아직 교환 구하는 중이에요.",
      time: "어제",
    },
    {
      category: "오프동행",
      categoryColor: COLORS.lightBlue,
      textColor: COLORS.blue,
      title: "콘서트 끝나고 같이 지하철역 가실 분",
      content: "끝나고 사람이 많아서 같이 이동하면 좋을 것 같아요.",
      time: "4일 전",
    },
  ];

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
          {currentList.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed, hovered }) => [
                styles.postCard,
                (pressed || hovered) && styles.postCardHover,
              ]}
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
          ))}
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