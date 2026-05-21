// 커뮤니티 목록

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const categories = ["전체", "포카교환", "오프동행", "질문게시판", "자유게시판"];

const posts = [
  {
    id: "1",
    category: "오프동행",
    name: "김하영",
    time: "2시간 전",
    title: "BTS 콘서트 같이 가실 분 구해요!",
    content: "오늘 저녁 6시 잠실 올림픽공원 콘서트 같이 가실 분 구해요.",
    color: "#EAF1FF",
    textColor: "#356EEA",
  },
  {
    id: "2",
    category: "포카교환",
    name: "하영이",
    time: "2시간 전",
    title: "정국 포카를 지민 포카로 교환 원해요",
    content: "앨범 포카 정국 보유 중이고 지민 포카랑 교환하고 싶어요.",
    color: "#FFF6CC",
    textColor: "#B99A00",
  },
  {
    id: "3",
    category: "자유게시판",
    name: "기마영",
    time: "2시간 전",
    title: "이번 앨범 컨셉 너무 예쁜 것 같아요",
    content: "포카랑 포스터 디자인 다 잘 나온 것 같아서 만족 중이에요.",
    color: "#E7F6EA",
    textColor: "#3A8B4C",
  },
  {
    id: "4",
    category: "질문게시판",
    name: "하용",
    time: "2시간 전",
    title: "분철 참여할 때 확인해야 할 게 뭐가 있나요?",
    content: "처음 분철 타보는데 입금 전 꼭 확인해야 하는 점 알려주세요.",
    color: "#F1E8FF",
    textColor: "#7A4FD8",
  },
];

export default function CommunityScreen() {
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const filteredPosts =
    selectedCategory === "전체"
      ? posts
      : posts.filter((post) => post.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      <View style={styles.categoryWrap}>
        {categories.map((category) => (
          <Pressable
            key={category}
            style={styles.categoryButton}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>

            {selectedCategory === category && (
              <View style={styles.activeLine} />
            )}
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.sortWrap, pressed && { opacity: 0.6 }]}
        onPress={() => {
          console.log("최신등록순 클릭");
        }}
      >
        <Text style={styles.sortText}>최신 등록순</Text>
        <Ionicons name="swap-vertical" size={15} color="#111" />
      </Pressable>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.postBox}
            onPress={() => router.push(`/community/${item.id}`)}
          >
            <View style={styles.profileRow}>
              <View style={styles.profileCircle} />

              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>

            <View style={styles.titleRow}>
              <View style={[styles.badge, { backgroundColor: item.color }]}>
                <Text style={[styles.badgeText, { color: item.textColor }]}>
                  {item.category}
                </Text>
              </View>

              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
            </View>

            <Text style={styles.content} numberOfLines={1}>
              {item.content}
            </Text>

            <Text style={styles.info}>좋아요 24 댓글 7 조회수 156</Text>
          </Pressable>
        )}
      />

      <Pressable
        style={({ pressed }) => [
          styles.writeButton,
          pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
        ]}
        onPress={() => {
          console.log("글쓰기 버튼 클릭");
        }}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.writeText}>글쓰기</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 80,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111111",
  },

  categoryWrap: {
    height: 39,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  categoryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: "100%",
  },

  categoryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#777777",
  },

  categoryTextActive: {
    color: "#C8A900",
    fontWeight: "800",
  },

  activeLine: {
    position: "absolute",
    bottom: 0,
    width: "70%",
    height: 4,
    backgroundColor: "#D4B72C",
  },

  sortWrap: {
    height: 40,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  sortText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },

  listContent: {
    paddingBottom: 75,
  },

  postBox: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8A7A7",
    marginRight: 14,
  },

  name: {
    fontSize: 13,
    fontWeight: "800",
    color: "#222222",
  },

  time: {
    fontSize: 11,
    color: "#888888",
    marginTop: 3,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    marginRight: 10,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
  },

  content: {
    fontSize: 13,
    color: "#888888",
    marginBottom: 12,
  },

  info: {
    fontSize: 11,
    color: "#999999",
  },

  writeButton: {
    position: "absolute",
    right: 28,
    bottom: 15,
    backgroundColor: "#E7C85A",
    borderRadius: 25,
    paddingVertical: 11,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },

  writeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 4,
  },
});
