import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyCommunityPostsScreen() {
  const [selectedTab, setSelectedTab] = useState<"posts" | "comments">("posts");

  const myPosts = [
    {
      category: "포카교환",
      categoryColor: "#F8EFCF",
      textColor: "#B89416",
      title: "BTS 콘서트 같이 가실 분 구해요!",
      content: "오늘 저녁 6시 잠실 올림픽공원 콘서트 같이 가실 분...",
    },
    {
      category: "오프동행",
      categoryColor: "#E7EEFF",
      textColor: "#4D73D9",
      title: "BTS 콘서트 같이 가실 분 구해요!",
      content: "오늘 저녁 6시 잠실 올림픽공원 콘서트 같이 가실 분...",
    },
    {
      category: "자유게시판",
      categoryColor: "#E7F5E8",
      textColor: "#3F8B50",
      title: "BTS 콘서트 같이 가실 분 구해요!",
      content: "오늘 저녁 6시 잠실 올림픽공원 콘서트 같이 가실 분...",
    },
  ];

  const myComments = [
    {
      category: "질문게시판",
      categoryColor: "#F1E6FF",
      textColor: "#8A5CD6",
      title: "콘서트 몇층이 제일 좋을까요?",
      content: "저는 2층이 무대 전체 보기에는 좋다고 생각해요!",
    },
    {
      category: "자유게시판",
      categoryColor: "#E7F5E8",
      textColor: "#3F8B50",
      title: "올림픽공원 주차 꿀팁 공유해요",
      content: "저는 P3 주차장에 주차했는데 가까워서 좋았어요!",
    },
    {
      category: "자유게시판",
      categoryColor: "#E7F5E8",
      textColor: "#3F8B50",
      title: "BTS 앨범 나눔해요😊",
      content: "새 앨범 중복이 있어서 나눔합니다! DM 주세요~",
    },
  ];

  const currentList = selectedTab === "posts" ? myPosts : myComments;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#222222" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>작성한 커뮤니티 글 보기</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "posts" && styles.activeTabButton,
            ]}
            activeOpacity={0.8}
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
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "comments" && styles.activeTabButton,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedTab("comments")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "comments" && styles.activeTabText,
              ]}
            >
              내가 댓글 쓴 글
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {currentList.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.postCard}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={styles.profileCircle}>
                  <Text style={styles.profileText}>하</Text>
                </View>

                <View>
                  <Text style={styles.name}>하영이</Text>
                  <Text style={styles.time}>
                    {selectedTab === "posts" ? "2시간 전" : "1시간 전"}
                  </Text>
                </View>
              </View>

              <View style={styles.postInfoRow}>
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

                <Text style={styles.postTitle}>{item.title}</Text>
              </View>

              <Text style={styles.postContent}>{item.content}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },

  header: {
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111111",
  },

  headerRight: {
    width: 28,
  },

  tabRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    marginBottom: 22,
  },

  tabButton: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E1D2",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  activeTabButton: {
    backgroundColor: "#EACB59",
    borderColor: "#EACB59",
  },

  tabText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#777777",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  listContent: {
    paddingBottom: 40,
  },

  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 18,
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4F2EC",
    borderWidth: 1,
    borderColor: "#E1DED7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  profileText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },

  name: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 2,
  },

  time: {
    fontSize: 12,
    color: "#999999",
  },

  postInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "800",
  },

  postTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: "#111111",
  },

  postContent: {
    fontSize: 14,
    color: "#888888",
    lineHeight: 22,
  },
});