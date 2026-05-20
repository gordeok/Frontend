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
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#222222" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>받은 후기 목록</Text>

          <View style={styles.headerRight} />
        </View>

        <Text style={styles.countText}>후기 5개</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {reviews.map((review, index) => (
            <View
              key={index}
              style={[
                styles.reviewItem,
                index === reviews.length - 1 && styles.lastReviewItem,
              ]}
            >
              <View style={styles.reviewTop}>
                <View style={styles.profileCircle}>
                  <Text style={styles.profileInitial}>
                    {review.name.slice(0, 1)}
                  </Text>
                </View>

                <Text style={styles.reviewName}>{review.name}</Text>

                <Text style={styles.reviewDate}>{review.date}</Text>
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
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 26,
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
    width: 26,
  },

  countText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 14,
  },

  listContent: {
    paddingBottom: 40,
  },

  reviewItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E3D6",
  },

  lastReviewItem: {
    borderBottomWidth: 1,
  },

  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  profileCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8F6F0",
    borderWidth: 1,
    borderColor: "#E5E1D8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  profileInitial: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111111",
  },

  reviewName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },

  reviewDate: {
    fontSize: 12,
    color: "#999999",
  },

  reviewText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222222",
    lineHeight: 22,
  },
});