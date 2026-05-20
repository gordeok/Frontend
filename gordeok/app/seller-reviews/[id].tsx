import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  line: "#F0F0F0",
  avatarBg: "#F7F5EF",
  avatarBorder: "#E8E4D8",
};

type SellerReview = {
  id: number;
  initial: string;
  nickname: string;
  date: string;
  content: string;
};

export default function SellerReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const sellerName = "범규와이프";

  const reviews: SellerReview[] = [
    {
      id: 1,
      initial: "껌",
      nickname: "껌규",
      date: "2025.04.11",
      content: "포카 상태 너무 좋아요 굿굿 감사합니다",
    },
    {
      id: 2,
      initial: "쮜",
      nickname: "쮜바로우많이투개더",
      date: "2025.03.24",
      content: "믿고 분철 탑니다~ 항상 빠른 응답 감사해요",
    },
    {
      id: 3,
      initial: "수",
      nickname: "수빈이라고 나 수빈",
      date: "2025.03.12",
      content: "다음에도 또 분철 타겠습니다 열어주세요~",
    },
    {
      id: 4,
      initial: "텬",
      nickname: "텬프",
      date: "2025.02.28",
      content: "포장 꼼꼼하고 설명도 친절했어요!",
    },
  ];

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
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </Pressable>

          <Text style={styles.headerTitle}>받은 후기</Text>

          <View style={styles.headerIcon} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.pageDescription}>
            {sellerName}님의 받은 후기입니다.
          </Text>

          {reviews.map((review) => (
            <Pressable
              key={review.id}
              style={({ pressed, hovered }) => [
                styles.reviewCard,
                (pressed || hovered) && styles.reviewCardHover,
              ]}
              onPress={() => {
                console.log("상대방 후기 선택", review.id, id);
              }}
            >
              <View style={styles.reviewProfile}>
                <Text style={styles.reviewInitial}>{review.initial}</Text>
              </View>

              <View style={styles.reviewInfo}>
                <View style={styles.reviewTop}>
                  <Text numberOfLines={1} style={styles.reviewName}>
                    {review.nickname}
                  </Text>

                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>

                <Text numberOfLines={2} style={styles.reviewText}>
                  {review.content}
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
  },

  header: {
    height: 58,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
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

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },

  pageDescription: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray500,
    marginBottom: 12,
  },

  reviewCard: {
    minHeight: 88,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  reviewCardHover: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  reviewProfile: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.avatarBg,
    borderWidth: 1,
    borderColor: COLORS.avatarBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  reviewInitial: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
  },

  reviewInfo: {
    flex: 1,
    justifyContent: "center",
  },

  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  reviewName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    marginRight: 10,
  },

  reviewDate: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray500,
  },

  reviewText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray700,
    lineHeight: 18,
  },
});