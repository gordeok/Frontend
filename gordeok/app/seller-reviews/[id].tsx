// 판매자 받은 후기 조회 화면

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiRequest, getStoredUserId } from "../../utils/api";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  line: "#F0F0F0",
  avatarBg: "#F7F5EF",
  avatarBorder: "#E8E4D8",
  yellow: "#F3C24F",
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

type SellerReview = {
  id: number;
  initial: string;
  nickname: string;
  date: string;
  content: string;
  profileImage?: string | null;
};

type MyReviewApiItem = {
  reviewId?: number;
  id?: number;
  reviewerId?: number;
  reviewerNickname?: string;
  writerNickname?: string;
  nickname?: string;
  reviewerProfileImage?: string | null;
  profileImage?: string | null;
  writerProfileImage?: string | null;
  rating?: number;
  content?: string;
  createdAt?: string;
};

type ProfileApiResponse = {
  userId: number;
  nickname: string;
  profileImage?: string | null;
  trustScore?: number;
  hasScamReport?: boolean;
  createdAt?: string;
};

function getPageContent<T>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.reviews)) return response.reviews;
  if (Array.isArray(response?.receivedReviews)) return response.receivedReviews;
  return [];
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10).replaceAll("-", ".");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
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

function normalizeReview(item: MyReviewApiItem): SellerReview {
  const nickname =
    item.reviewerNickname ||
    item.writerNickname ||
    item.nickname ||
    "구매자";

  return {
    id: Number(item.reviewId ?? item.id),
    initial: nickname.slice(0, 1),
    nickname,
    date: formatDate(item.createdAt),
    content: item.content || "",
    profileImage:
      item.reviewerProfileImage ||
      item.profileImage ||
      item.writerProfileImage ||
      null,
  };
}

export default function SellerReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const sellerId = String(id ?? "");

  const [sellerName, setSellerName] = useState("판매자");
  const [reviews, setReviews] = useState<SellerReview[]>([]);
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

        const myUserId = await getStoredUserId();
        const routeSellerId = sellerId || String(myUserId ?? "");

        if (!routeSellerId) {
          setReviews([]);
          setErrorMessage("판매자 정보를 찾을 수 없습니다.");
          return;
        }

        const isMyPage = String(myUserId) === String(routeSellerId);

        if (isMyPage && myUserId) {
          const [profileRes, reviewsRes] = await Promise.all([
            apiRequest<ProfileApiResponse>("/api/users/me", {
              method: "GET",
              query: { userId: myUserId },
            }),
            apiRequest<any>("/api/users/me/reviews", {
              method: "GET",
              query: {
                userId: myUserId,
                page: 0,
                size: 50,
              },
            }),
          ]);

          setSellerName(profileRes?.nickname || "판매자");

          console.log("내 받은 후기 API 응답:", reviewsRes);

          const reviewList = getPageContent<MyReviewApiItem>(reviewsRes)
            .map(normalizeReview)
            .filter((review) => Number.isFinite(review.id));

          setReviews(reviewList);
          return;
        }

        const [profileRes, reviewsRes] = await Promise.all([
          apiRequest<ProfileApiResponse>(
            `/api/users/${routeSellerId}/profile`,
            {
              method: "GET",
            }
          ),
          apiRequest<any>(`/api/users/${routeSellerId}/reviews`, {
            method: "GET",
            query: {
              page: 0,
              size: 50,
            },
          }),
        ]);

        setSellerName(profileRes?.nickname || "판매자");

        const reviewList = getPageContent<MyReviewApiItem>(reviewsRes)
          .map(normalizeReview)
          .filter((review) => Number.isFinite(review.id));

        console.log("받은 후기 API 응답:", reviewsRes);
        console.log("받은 후기 개수:", reviewList.length);

        setReviews(reviewList);
      } catch (error: any) {
        setReviews([]);
        setErrorMessage(error?.message || "받은 후기를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [sellerId]);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const aTime = a.date ? new Date(a.date.replaceAll(".", "-")).getTime() : 0;
      const bTime = b.date ? new Date(b.date.replaceAll(".", "-")).getTime() : 0;
      return bTime - aTime;
    });
  }, [reviews]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.headerIcon,
              pressed && styles.headerIconHover,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </Pressable>

          <Text style={styles.headerTitle}>받은 후기</Text>

          <View style={styles.headerIcon} />
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={COLORS.yellow} />
            <Text style={styles.centerText}>받은 후기를 불러오는 중이에요</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.pageDescription}>
              {sellerName}님의 받은 후기입니다.
            </Text>

            {sortedReviews.length > 0 ? (
              sortedReviews.map((review) => {
                const profileImageUrl = getImageUrl(review.profileImage);
                const hasProfileImage =
                  !!profileImageUrl && imageErrorMap[review.id] !== true;

                return (
                  <Pressable
                    key={review.id}
                    style={({ pressed }) => [
                      styles.reviewCard,
                      pressed && styles.reviewCardHover,
                    ]}
                    onPress={() => {
                      console.log("받은 후기 선택", review.id, sellerId);
                    }}
                  >
                    <View style={styles.reviewProfile}>
                      {hasProfileImage ? (
                        <Image
                          source={{ uri: profileImageUrl }}
                          style={styles.reviewProfileImage}
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
                        <Text style={styles.reviewInitial}>
                          {review.initial}
                        </Text>
                      )}
                    </View>

                    <View style={styles.reviewInfo}>
                      <View style={styles.reviewTop}>
                        <Text numberOfLines={1} style={styles.reviewName}>
                          {review.nickname}
                        </Text>

                        <Text style={styles.reviewDate}>
                          {review.date || "작성일 없음"}
                        </Text>
                      </View>

                      <Text numberOfLines={3} style={styles.reviewText}>
                        {review.content || "후기 내용이 없습니다."}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>받은 후기가 없어요</Text>
                <Text style={styles.emptyText}>
                  아직 등록된 거래 후기가 없습니다.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
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

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  centerText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray500,
  },

  errorText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.gray500,
    textAlign: "center",
  },

  reviewCard: {
    minHeight: 86,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.avatarBg,
    borderWidth: 1,
    borderColor: COLORS.avatarBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    overflow: "hidden",
  },

  reviewProfileImage: {
    width: "100%",
    height: "100%",
  },

  reviewInitial: {
    fontSize: 11,
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
  },

  reviewName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.black,
    marginRight: 8,
  },

  reviewDate: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray500,
  },

  reviewText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.gray700,
    lineHeight: 18,
  },

  emptyBox: {
    marginTop: 90,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray500,
  },
});