// 마이페이지 - 받은 후기

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyReviews, MyReview } from "../services/user";

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

type ReviewItem = {
  id: number;
  name: string;
  date: string;
  text: string;
  profileImage?: string | null;
};

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10).replaceAll("-", ".");
  }

  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

function getImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (!trimmedUrl) return "";

  if (
    trimmedUrl.startsWith("http://") ||
    trimmedUrl.startsWith("https://") ||
    trimmedUrl.startsWith("file://")
  ) {
    return trimmedUrl;
  }

  if (!API_BASE_URL) {
    return trimmedUrl;
  }

  const baseUrl = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  const path = trimmedUrl.startsWith("/") ? trimmedUrl : `/${trimmedUrl}`;

  return `${baseUrl}${path}`;
}

function mapReview(review: MyReview): ReviewItem {
  const reviewAny = review as any;

  return {
    id: review.reviewId,
    name: review.reviewerNickname,
    date: formatDate(review.createdAt),
    text: review.content,
    profileImage:
      reviewAny.reviewerProfileImage ||
      reviewAny.profileImage ||
      reviewAny.reviewerImage ||
      null,
  };
}

export default function ReceivedReviewsScreen() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getMyReviews();

        console.log("받은 후기 응답:", data);

        setReviews(data.map(mapReview));
      } catch (error: any) {
        console.log("받은 후기 조회 실패:", error);
        setReviews([]);
        setErrorMessage(error?.message || "받은 후기를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, []);

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

          {isLoading ? (
            <View style={styles.emptyArea} />
          ) : reviews.length > 0 ? (
            reviews.map((review) => {
              const profileImageUrl = getImageUrl(review.profileImage);
              const hasProfileImage =
                !!profileImageUrl && imageErrorMap[review.id] !== true;

              return (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <View style={styles.profileCircle}>
                      {hasProfileImage ? (
                        <Image
                          source={{ uri: profileImageUrl }}
                          style={styles.profileImage}
                          resizeMode="cover"
                          onError={() => {
                            console.log(
                              "후기 프로필 이미지 로드 실패:",
                              profileImageUrl
                            );

                            setImageErrorMap((prev) => ({
                              ...prev,
                              [review.id]: true,
                            }));
                          }}
                        />
                      ) : (
                        <Text style={styles.profileInitial}>
                          {review.name?.slice(0, 1) || "?"}
                        </Text>
                      )}
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
              );
            })
          ) : (
            <View style={styles.emptyArea}>
              <Text style={styles.emptyText}>
                {errorMessage || "받은 후기가 없어요"}
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
    overflow: "hidden",
  },

  profileImage: {
    width: "100%",
    height: "100%",
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

  emptyArea: {
    alignItems: "center",
    paddingTop: 80,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    marginTop: 140,
    marginBottom: 6,
  },
});