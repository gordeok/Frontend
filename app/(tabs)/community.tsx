import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const categories = ["전체", "오프동행", "포카교환", "자유게시판", "질문게시판"];

const posts = [
  {
    id: 1,
    name: "김하영",
    category: "오프동행",
    categoryColor: "#DDE7FF",
    categoryText: "#5A73D8",
  },
  {
    id: 2,
    name: "하영이",
    category: "포카교환",
    categoryColor: "#F7EDB7",
    categoryText: "#B89A1E",
  },
  {
    id: 3,
    name: "기먕영",
    category: "자유게시판",
    categoryColor: "#DCEEDB",
    categoryText: "#5F8B5C",
  },
  {
    id: 4,
    name: "하용",
    category: "오프동행",
    categoryColor: "#DDE7FF",
    categoryText: "#5A73D8",
  },
];

export default function CommunityScreen() {
  const [selectedTab, setSelectedTab] = useState("전체");

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      {/* 탭 메뉴 */}
      <View style={styles.tabContainer}>
        {categories.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 사기꾼 명단 */}
        <TouchableOpacity style={styles.noticeBox} activeOpacity={0.8}>
          <Text style={styles.noticeTitle}>사기꾼 명단</Text>

          <View style={styles.noticeRow}>
            <Text style={styles.noticeText}>신고받은 사용자 확인하기</Text>

            <Ionicons name="chevron-forward" size={15} color="#B44D47" />
          </View>
        </TouchableOpacity>

        {/* 정렬 */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortText}>최신 등록순 ↕</Text>
        </View>

        {/* 게시글 */}
        {posts.map((post) => (
          <TouchableOpacity key={post.id} style={styles.postCard}>
            {/* 프로필 */}
            <View style={styles.profileRow}>
              <View style={styles.profileImage} />

              <View>
                <Text style={styles.name}>{post.name}</Text>
                <Text style={styles.time}>2시간 전</Text>
              </View>
            </View>

            {/* 카테고리 */}
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: post.categoryColor },
              ]}
            >
              <Text style={[styles.categoryText, { color: post.categoryText }]}>
                {post.category}
              </Text>
            </View>

            {/* 제목 */}
            <Text style={styles.postTitle}>
              BTS 콘서트 같이 가실 분 구해요!
            </Text>

            {/* 내용 */}
            <Text style={styles.postContent} numberOfLines={1}>
              오늘 저녁 6시 잠실 올림픽공원 콘서트 같이 가실 분...
            </Text>

            {/* 하단 정보 */}
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>♡ 24</Text>
              <Text style={styles.infoText}>💬 7</Text>
              <Text style={styles.infoText}>👁 156</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 글쓰기 버튼 */}
      <TouchableOpacity style={styles.writeButton}>
        <Ionicons name="add" size={18} color="white" />

        <Text style={styles.writeButtonText}>글쓰기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /* 헤더 */
  header: {
    paddingTop: 68,
    paddingBottom: 22,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
  },

  /* 탭 */
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },

  tabButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    height: "100%",
    marginRight: 8,
  },

  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#D7B847",
  },

  tabText: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },

  activeTabText: {
    color: "#D7B847",
    fontWeight: "700",
  },

  /* 공지 */
  noticeBox: {
    backgroundColor: "#F4E5E5",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  noticeTitle: {
    fontSize: 13,
    color: "#7A5B5B",
    marginBottom: 8,
    fontWeight: "600",
  },

  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  noticeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B44D47",
    marginRight: 2,
  },

  /* 정렬 */
  sortContainer: {
    alignItems: "flex-end",
    paddingHorizontal: 22,
    marginTop: 16,
    marginBottom: 4,
  },

  sortText: {
    fontSize: 13,
    color: "#555",
  },

  /* 게시글 */
  postCard: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#F3F3F3",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E6B3B3",
    marginRight: 10,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },

  time: {
    fontSize: 12,
    color: "#9A9A9A",
    marginTop: 2,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 8,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 6,
  },

  postContent: {
    fontSize: 14,
    color: "#8C8C8C",
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoText: {
    fontSize: 12,
    color: "#888888",
    marginRight: 10,
  },

  /* 글쓰기 버튼 */
  writeButton: {
    position: "absolute",
    right: 22,
    bottom: 18,
    backgroundColor: "#D7B847",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 24,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  writeButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 2,
  },
});
