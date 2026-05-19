// 분철 상세 화면

import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookmark } from "@/contexts/BookmarkContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray300: "#DDDDDD",
  gray200: "#EEEEEE",
  gray100: "#F6F6F6",
  yellow: "#F7C94B",
  lightYellow: "#FFF4CC",
  green: "#31C48D",
  lightGreen: "#DDF8E8",
  orange: "#E7A533",
  blue: "#4C8DFF",
  lightBlue: "#E8F1FF",
  beige: "#EDE8DE",
  line: "#F2EDE6",
};

type MemberState = "모집중" | "예약중" | "모집완료";

type DivideMember = {
  name: string;
  state: MemberState;
  price: number;
};

type DividePost = {
  id: string;
  groupId: string;
  groupName: string;
  userName: string;
  title: string;
  albumName: string;
  time: string;
  date: string;
  status: string;
  completed: boolean;
  content: string;
  deliveryMethod: string;
  members: DivideMember[];
};

export default function DivideDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isBookmarked, toggleBookmark } = useBookmark();

  const postData = typeof params.postData === "string" ? params.postData : "";
  const groupParam = typeof params.groups === "string" ? params.groups : "";
  const memberParam = typeof params.members === "string" ? params.members : "";

  const post = useMemo<DividePost | null>(() => {
    if (!postData) return null;

    try {
      return JSON.parse(postData);
    } catch {
      return null;
    }
  }, [postData]);

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>분철 글을 찾을 수 없어요</Text>

          <Pressable style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const bookmarked = isBookmarked(post.id);

  const handleBookmark = () => {
    toggleBookmark({
      id: post.id,
      title: post.title,
      sellerName: post.userName,
      groupName: post.groupName,
      postData: JSON.stringify(post),
      groups: groupParam,
      members: memberParam,
    });
  };

  const handleSelectMember = () => {
    router.push({
      pathname: "/divide-join",
      params: {
        postId: post.id,
        postData: JSON.stringify(post),
        groups: groupParam,
        members: memberParam,
      },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageBox}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={COLORS.black} />
            </Pressable>

            <View style={styles.imageCount}>
              <Text style={styles.imageCountText}>1 / 2</Text>
            </View>
          </View>

          <Pressable style={styles.profileSection}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>{post.userName[0]}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.writer} numberOfLines={1}>
                {post.userName}
              </Text>

              <View style={styles.scoreRow}>
                <View style={styles.scoreBar}>
                  <View style={styles.scoreFill} />
                </View>

                <Text style={styles.score}>87점</Text>
                <Text style={styles.scoreLabel}> 신뢰점수</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={22} color={COLORS.black} />
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.contentSection}>
            <View style={styles.metaRow}>
              <Text style={styles.groupName}>{post.groupName}</Text>
              <Text style={styles.dateText}>{post.date}</Text>
            </View>

            <Text style={styles.title}>{post.title}</Text>

            <View style={styles.smallDivider} />

            <Text style={styles.contentText}>{post.content}</Text>

            <View style={styles.countRow}>
              <Text style={styles.countText}>
                북마크 {bookmarked ? "12" : "11"}
              </Text>
              <Text style={styles.countText}>조회 705</Text>
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>멤버별 모집 상태</Text>

            <View style={styles.memberGrid}>
              {post.members.map((member, index) => (
                <View key={`${member.name}-${index}`} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.name}
                    </Text>

                    <Text
                      style={[
                        styles.priceText,
                        member.state === "모집완료" && styles.donePriceText,
                      ]}
                    >
                      ₩{member.price.toLocaleString()}
                    </Text>
                  </View>

                  <StatusBadge state={member.state} />
                </View>
              ))}
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>분철 구성품</Text>

            <View style={styles.itemList}>
              {["앨범 본체", "엽서", "포스터"].map((item) => (
                <View key={item} style={styles.itemRow}>
                  <Ionicons name="checkmark" size={17} color={COLORS.green} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>배송 방법</Text>

            <View style={styles.deliveryTag}>
              <Text style={styles.deliveryText}>{post.deliveryMethod}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable style={styles.bookmarkButton} onPress={handleBookmark}>
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={28}
              color={bookmarked ? COLORS.yellow : COLORS.black}
            />
          </Pressable>

          <Pressable style={styles.selectButton} onPress={handleSelectMember}>
            <Text style={styles.selectButtonText}>분철 멤버 선택</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StatusBadge({ state }: { state: MemberState }) {
  const isOpen = state === "모집중";
  const isReserved = state === "예약중";
  const isDone = state === "모집완료";

  return (
    <View
      style={[
        styles.statusBadge,
        isOpen && styles.statusOpen,
        isReserved && styles.statusReserved,
        isDone && styles.statusDone,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          isOpen && styles.statusOpenText,
          isReserved && styles.statusReservedText,
          isDone && styles.statusDoneText,
        ]}
      >
        {state}
      </Text>
    </View>
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

  scrollContent: {
    paddingBottom: 120,
  },

  imageBox: {
    height: 300,
    backgroundColor: COLORS.beige,
    position: "relative",
  },

  backButton: {
    position: "absolute",
    top: 14,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  imageCount: {
    position: "absolute",
    right: 16,
    bottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  imageCountText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  profileSection: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: COLORS.white,
  },

  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D8D2C8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  profileInitial: {
    fontSize: 18,
    fontWeight: "900",
    color: "#69645D",
  },

  profileInfo: {
    flex: 1,
    justifyContent: "center",
    marginRight: 12,
  },

  writer: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 8,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  scoreBar: {
    width: 96,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#EFEAE2",
    overflow: "hidden",
    marginRight: 8,
  },

  scoreFill: {
    width: "87%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.yellow,
  },

  score: {
    fontSize: 12,
    fontWeight: "900",
    color: "#F2B600",
  },

  scoreLabel: {
    fontSize: 12,
    color: COLORS.gray400,
  },

  divider: {
    height: 0.7,
    backgroundColor: COLORS.line,
  },

  contentSection: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  groupName: {
    fontSize: 13,
    color: COLORS.gray400,
  },

  dateText: {
    fontSize: 13,
    color: COLORS.gray400,
  },

  title: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 27,
  },

  smallDivider: {
    height: 0.7,
    backgroundColor: COLORS.line,
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: -22,
  },

  contentText: {
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.black,
  },

  countRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  countText: {
    fontSize: 14,
    color: COLORS.gray400,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginTop: 20,
    marginBottom: 16,
    marginHorizontal: -22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 12,
  },

  memberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  memberCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    minHeight: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  memberInfo: {
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },

  memberName: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 19,
  },

  priceText: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.gray700,
    lineHeight: 17,
  },

  donePriceText: {
    color: COLORS.gray400,
    textDecorationLine: "line-through",
  },

  statusBadge: {
    minWidth: 54,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  statusOpen: {
    backgroundColor: COLORS.lightGreen,
  },

  statusReserved: {
    backgroundColor: COLORS.lightYellow,
  },

  statusDone: {
    backgroundColor: COLORS.gray100,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
  },

  statusOpenText: {
    color: COLORS.green,
  },

  statusReservedText: {
    color: COLORS.orange,
  },

  statusDoneText: {
    color: COLORS.gray400,
  },

  itemList: {
    gap: 8,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  itemText: {
    fontSize: 15,
    color: COLORS.black,
  },

  deliveryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.lightBlue,
    marginBottom: 8,
  },

  deliveryText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.blue,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  bookmarkButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#F7F5F2",
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },

  selectButton: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },

  selectButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 14,
  },

  emptyButton: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.white,
  },
});