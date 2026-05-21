import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray100: "#F6F6F6",
  profileGray: "#F1F1F1",
  profileText: "#555555",
  line: "#F2EDE6",
};

export default function ReceivedReviewsScreen() {
  const reviews = [
    {
      name: "덕질왕",
      date: "2025.04.22",
      text: "응답도 빠르고 친절하게 거래해주셔서 너무 좋았어요. 믿을 수 있는 판매자!",
    },
    {
      name: "껌규",
      date: "2025.04.11",
      text: "포카 상태 너무 좋아요 굿굿 감사합니다",
    },
    {
      name: "꿔바로우많이두개더",
      date: "2025.03.24",
      text: "믿고 분철 탑니다~ 항상 빠른 응답 감사해요",
    },
    {
      name: "수빈이라고 나 수빈",
      date: "2025.03.12",
      text: "다음에도 또 분철 타겠습니다 열어주세요~",
    },
    {
      name: "강태현왜안해?",
      date: "2025.02.14",
      text: "투바투 분철은 역시 범규와이프님!!",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>받은 후기 목록</Text>

          <View style={styles.headerIcon} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          <View style={styles.summaryArea}>
            <Text style={styles.summaryTitle}>후기 {reviews.length}개</Text>
          </View>

          {reviews.map((review, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.profileCircle}>
                  <Text style={styles.profileInitial}>
                    {review.name.slice(0, 1)}
                  </Text>
                </View>

                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName} numberOfLines={1}>
                    {review.name}
                  </Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              </View>

              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
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
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
  },

  listContent: {
    paddingBottom: 36,
  },

  summaryArea: {
    marginTop: 12,
    marginBottom: 14,
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
  },

  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
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

  profileInitial: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.profileText,
  },

  reviewInfo: {
    flex: 1,
  },

  reviewName: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 2,
  },

  reviewDate: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },

  reviewText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray700,
    lineHeight: 20,
  },
});