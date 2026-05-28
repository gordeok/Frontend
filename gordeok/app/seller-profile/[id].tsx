// 판매자 프로필 화면

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiRequest, getStoredUserId } from "../../utils/api";

const YELLOW = "#F3C24F";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://frostily-derby-underpass.ngrok-free.dev";

type SaleItem = {
  id: number;
  title: string;
  imageUrl?: string;
  isPlaceholder?: boolean;
};

type ReviewItem = {
  id: number;
  initial: string;
  nickname: string;
  date: string;
  content: string;
  rating?: number;
  profileImage?: string;
};

type SellerProfile = {
  id: string;
  nickname: string;
  profileImage?: string;
  joinedAt: string;
  followerCount: number;
  followingCount: number;
  trustScore: number;
  hasFraudReport: boolean;
  receivedReviewCount: number;
  sales: SaleItem[];
  reviews: ReviewItem[];
};

type MyReviewApiItem = {
  reviewId?: number;
  id?: number;
  reviewerId?: number;
  writerId?: number;
  reviewerNickname?: string;
  writerNickname?: string;
  nickname?: string;
  reviewerProfileImage?: string;
  profileImage?: string;
  profileImageUrl?: string;
  rating?: number;
  content?: string;
  createdAt?: string;
};

type ProfileApiResponse = {
  userId: number;
  email?: string;
  nickname: string;
  profileImage?: string;
  profileImageUrl?: string;
  trustScore?: number;
  hasScamReport?: boolean;
  createdAt?: string;
  receivedReviewCount?: number;
  reviewCount?: number;
  reviewsCount?: number;
  receivedReviews?: MyReviewApiItem[];
  reviews?: MyReviewApiItem[];
};

type MySaleApiItem = {
  postId: number;
  postTitle: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  albumImageUrl?: string;
  postImageUrl?: string;
  image?: string;
  imageUrls?: string[];
  images?: string[];
  postStatus?: string;
  participantCount?: number;
  createdAt?: string;
};

type PostListItem = {
  id?: number;
  postId?: number;
  userId?: number;
  sellerId?: number;
  authorId?: number;
  nickname?: string;
  sellerNickname?: string;
  authorNickname?: string;
  title?: string;
  postTitle?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  albumImageUrl?: string;
  postImageUrl?: string;
  image?: string;
  imageUrls?: string[];
  images?: string[];
  status?: string;
  createdAt?: string;
};

const EMPTY_SALE_SLOTS: SaleItem[] = [
  { id: -1, title: "", isPlaceholder: true },
  { id: -2, title: "", isPlaceholder: true },
  { id: -3, title: "", isPlaceholder: true },
  { id: -4, title: "", isPlaceholder: true },
];

function normalizeImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (!trimmedUrl) return "";

  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith("/")) {
    return `${API_BASE_URL}${trimmedUrl}`;
  }

  return `${API_BASE_URL}/${trimmedUrl}`;
}

function getSaleImageUrl(data: any) {
  const rawUrl =
    data?.thumbnailUrl ||
    data?.imageUrls?.[0] ||
    data?.images?.[0] ||
    data?.imageUrl ||
    data?.albumImageUrl ||
    data?.postImageUrl ||
    data?.thumbnailImageUrl ||
    data?.image ||
    "";

  return normalizeImageUrl(rawUrl);
}

function getPageContent<T>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function getReviewContent(response: any): MyReviewApiItem[] {
  const pageContent = getPageContent<MyReviewApiItem>(response);

  if (pageContent.length > 0) return pageContent;
  if (Array.isArray(response?.receivedReviews)) return response.receivedReviews;
  if (Array.isArray(response?.reviews)) return response.reviews;

  return [];
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10).replaceAll("-", ".");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

function getProfileReviewCount(data: any) {
  return (
    Number(
      data?.receivedReviewCount ??
        data?.reviewCount ??
        data?.reviewsCount ??
        data?.receivedReviews?.length ??
        data?.reviews?.length ??
        0
    ) || 0
  );
}

function normalizeReview(item: MyReviewApiItem): ReviewItem {
  const nickname =
    item.reviewerNickname || item.writerNickname || item.nickname || "구매자";

  return {
    id: Number(item.reviewId ?? item.id),
    initial: nickname.slice(0, 1),
    nickname,
    date: formatDate(item.createdAt),
    content: item.content || "",
    rating: item.rating,
    profileImage: normalizeImageUrl(
      item.reviewerProfileImage || item.profileImage || item.profileImageUrl
    ),
  };
}

function getProfileReviews(data: any): ReviewItem[] {
  const reviewList = Array.isArray(data?.receivedReviews)
    ? data.receivedReviews
    : Array.isArray(data?.reviews)
    ? data.reviews
    : [];

  return reviewList.map(normalizeReview).filter((review: ReviewItem) => {
    return Number.isFinite(review.id);
  });
}

function normalizeProfile(
  data: ProfileApiResponse,
  fallbackId: string
): SellerProfile {
  return {
    id: String(data.userId ?? fallbackId),
    nickname: data.nickname || "판매자",
    profileImage: normalizeImageUrl(data.profileImage || data.profileImageUrl),
    joinedAt: formatDate(data.createdAt),
    followerCount: 0,
    followingCount: 0,
    trustScore: data.trustScore ?? 0,
    hasFraudReport: Boolean(data.hasScamReport),
    receivedReviewCount: getProfileReviewCount(data),
    sales: [],
    reviews: [],
  };
}

function normalizeMySale(item: MySaleApiItem): SaleItem {
  return {
    id: Number(item.postId),
    title: item.postTitle || "제목 없음",
    imageUrl: getSaleImageUrl(item),
  };
}

function normalizePostSale(item: PostListItem): SaleItem {
  return {
    id: Number(item.postId ?? item.id),
    title: item.postTitle || item.title || "제목 없음",
    imageUrl: getSaleImageUrl(item),
  };
}

export default function SellerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null
  );
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSellerProfile = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const myUserId = await getStoredUserId();
        const routeSellerId = id ? String(id) : String(myUserId ?? "");

        if (!routeSellerId) {
          setSellerProfile(null);
          setErrorMessage("판매자 정보를 찾을 수 없습니다.");
          return;
        }

        const isMine = String(myUserId) === String(routeSellerId);
        setIsMyProfile(isMine);

        if (isMine && myUserId) {
          const [profileRes, openSalesRes, completedSalesRes, reviewsRes] =
            await Promise.all([
              apiRequest<ProfileApiResponse>("/api/users/me", {
                method: "GET",
                query: { userId: myUserId },
              }),
              apiRequest<any>("/api/users/me/sales", {
                method: "GET",
                query: {
                  userId: myUserId,
                  status: "OPEN",
                  page: 0,
                  size: 20,
                },
              }),
              apiRequest<any>("/api/users/me/sales", {
                method: "GET",
                query: {
                  userId: myUserId,
                  status: "COMPLETED",
                  page: 0,
                  size: 20,
                },
              }),
              apiRequest<any>("/api/users/me/reviews", {
                method: "GET",
                query: {
                  userId: myUserId,
                  page: 0,
                  size: 20,
                },
              }),
            ]);

          console.log("내 프로필 API 원본 응답:", profileRes);
          console.log("내 판매 목록 OPEN 응답:", openSalesRes);
          console.log("내 판매 목록 COMPLETED 응답:", completedSalesRes);
          console.log("현재 로그인 유저 ID:", myUserId);
          console.log("프로필 대상 유저 ID:", routeSellerId);

          const openSales = getPageContent<MySaleApiItem>(openSalesRes);
          const completedSales =
            getPageContent<MySaleApiItem>(completedSalesRes);
          const reviews = getReviewContent(reviewsRes);

          const mergedSales = [...openSales, ...completedSales]
            .map(normalizeMySale)
            .filter((item, index, array) => {
              return (
                array.findIndex((target) => target.id === item.id) === index
              );
            });

          console.log("내 판매 목록 이미지 확인:", mergedSales);
          console.log("내 판매 목록 이미지 원본 확인:", [
            ...openSales,
            ...completedSales,
          ].map((item) => ({
            postId: item.postId,
            postTitle: item.postTitle,
            thumbnailUrl: item.thumbnailUrl,
            imageUrls: item.imageUrls,
            imageUrl: item.imageUrl,
          })));

          const normalizedReviews = reviews.map(normalizeReview);

          setSellerProfile({
            ...normalizeProfile(profileRes, routeSellerId),
            receivedReviewCount: normalizedReviews.length,
            sales: mergedSales,
            reviews: normalizedReviews,
          });

          return;
        }

        const [profileRes, postsRes] = await Promise.all([
          apiRequest<ProfileApiResponse>(`/api/users/${routeSellerId}/profile`, {
            method: "GET",
          }),
          apiRequest<any>("/api/posts", {
            method: "GET",
            query: {
              page: 0,
              size: 100,
              sort: "latest",
            },
          }),
        ]);

        console.log("판매자 프로필 API 원본 응답:", profileRes);
        console.log("판매자 게시글 목록 응답:", postsRes);
        console.log("현재 로그인 유저 ID:", myUserId);
        console.log("프로필 대상 유저 ID:", routeSellerId);

        const normalizedProfile = normalizeProfile(profileRes, routeSellerId);
        const sellerNickname = normalizedProfile.nickname;

        const posts = getPageContent<PostListItem>(postsRes);
        const profileUserId = String(profileRes?.userId ?? "");

        const sellerPostItems = posts.filter((post) => {
          const postUserId = String(post.userId ?? "");
          const postSellerId = String(post.sellerId ?? "");
          const postAuthorId = String(post.authorId ?? "");
          const postNickname = String(
            post.nickname ?? post.sellerNickname ?? post.authorNickname ?? ""
          ).trim();

          const isSameRouteId =
            postUserId === routeSellerId ||
            postSellerId === routeSellerId ||
            postAuthorId === routeSellerId;

          const isSameProfileUserId =
            profileUserId.length > 0 &&
            (postUserId === profileUserId ||
              postSellerId === profileUserId ||
              postAuthorId === profileUserId);

          const isSameNickname =
            sellerNickname.length > 0 && postNickname === sellerNickname;

          return isSameRouteId || isSameProfileUserId || isSameNickname;
        });

        const sellerPosts = sellerPostItems.map(normalizePostSale);

        console.log("상대방 판매 목록 이미지 확인:", sellerPosts);
        console.log("상대방 판매 목록 이미지 원본 확인:", sellerPostItems.map((item) => ({
          id: item.id,
          postId: item.postId,
          title: item.title,
          postTitle: item.postTitle,
          thumbnailUrl: item.thumbnailUrl,
          imageUrls: item.imageUrls,
          imageUrl: item.imageUrl,
        })));

        let receivedReviews: ReviewItem[] = getProfileReviews(profileRes);

        try {
          const reviewsRes = await apiRequest<any>(
            `/api/users/${routeSellerId}/reviews`,
            {
              method: "GET",
            }
          );

          const reviewMap = new Map<number, ReviewItem>();

          receivedReviews.forEach((review) => {
            if (Number.isFinite(review.id)) {
              reviewMap.set(review.id, review);
            }
          });

          getReviewContent(reviewsRes).forEach((review) => {
            const normalized = normalizeReview(review);

            if (!Number.isFinite(normalized.id)) return;

            reviewMap.set(normalized.id, normalized);
          });

          receivedReviews = Array.from(reviewMap.values()).sort((a, b) => {
            const aTime = new Date(a.date.replaceAll(".", "-")).getTime();
            const bTime = new Date(b.date.replaceAll(".", "-")).getTime();

            if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
            return bTime - aTime;
          });
        } catch (error) {
          console.log("받은 후기 목록 조회 실패:", error);
        }

        const receivedReviewCount = Math.max(
          getProfileReviewCount(profileRes),
          receivedReviews.length
        );

        console.log("상대방 프로필 ID:", routeSellerId);
        console.log("상대방 프로필 userId:", profileRes?.userId);
        console.log("상대방 닉네임:", sellerNickname);
        console.log("상대방 판매글 개수:", sellerPostItems.length);
        console.log("상대방 받은 후기 개수:", receivedReviewCount);

        setSellerProfile({
          ...normalizedProfile,
          receivedReviewCount,
          sales: sellerPosts,
          reviews: receivedReviews,
        });
      } catch (error: any) {
        setSellerProfile(null);
        setErrorMessage(error?.message || "판매자 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSellerProfile();
  }, [id]);

  const closeMenu = () => {
    if (menuVisible) setMenuVisible(false);
  };

  const goReport = () => {
    if (!sellerProfile) return;

    setMenuVisible(false);

    router.push({
      pathname: "/seller-profile/report",
      params: {
        sellerId: sellerProfile.id,
        sellerName: sellerProfile.nickname,
      },
    } as any);
  };

  const trustScore = Math.max(0, Math.min(sellerProfile?.trustScore ?? 0, 100));

  const visibleSales = useMemo(() => {
    if (!sellerProfile?.sales || sellerProfile.sales.length === 0) {
      return EMPTY_SALE_SLOTS;
    }

    return sellerProfile.sales.slice(0, 8);
  }, [sellerProfile?.sales]);

  const visibleReviews = useMemo(() => {
    if (!sellerProfile?.reviews || sellerProfile.reviews.length === 0) {
      return [];
    }

    return sellerProfile.reviews.slice(0, 3);
  }, [sellerProfile?.reviews]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#111111" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>판매자 프로필</Text>

          <View style={styles.headerIcon} />
        </View>

        {isLoading ? (
          <View style={styles.centerState} />
        ) : errorMessage || !sellerProfile ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              sellerProfile.hasFraudReport && styles.scrollContentWithWarning,
            ]}
            onScrollBeginDrag={closeMenu}
          >
            {sellerProfile.hasFraudReport && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  사기 신고 이력이 있는 계정입니다.
                </Text>
              </View>
            )}

            <View style={styles.profileCard}>
              {!isMyProfile && (
                <TouchableOpacity
                  style={styles.moreButton}
                  activeOpacity={0.65}
                  onPress={() => setMenuVisible(true)}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={17}
                    color="#555555"
                  />
                </TouchableOpacity>
              )}

              <View style={styles.profileTop}>
                <View style={styles.profileCircle}>
                  {sellerProfile.profileImage ? (
                    <Image
                      source={{ uri: sellerProfile.profileImage }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.profileInitial}>
                      {sellerProfile.nickname.slice(0, 1)}
                    </Text>
                  )}
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.nickname}>{sellerProfile.nickname}</Text>
                  <Text style={styles.subText}>
                    가입 {sellerProfile.joinedAt}
                  </Text>
                  <Text style={styles.subText}>
                    팔로워 {sellerProfile.followerCount}명 · 팔로잉{" "}
                    {sellerProfile.followingCount}명
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.trustArea}
                activeOpacity={0.75}
                onPress={() => setScoreModalVisible(true)}
              >
                <View style={styles.trustTopRow}>
                  <View style={styles.trustTitleRow}>
                    <Text style={styles.trustLabel}>신뢰 점수</Text>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color="#A4A4A4"
                      style={styles.trustInfoIcon}
                    />
                  </View>

                  <View style={styles.trustScoreRow}>
                    <Text style={styles.trustScore}>{trustScore}</Text>
                    <Text style={styles.trustPoint}>점</Text>
                  </View>
                </View>

                <View style={styles.progressBg}>
                  <View
                    style={[styles.progressFill, { width: `${trustScore}%` }]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.sectionHeader}
                onPress={() =>
                  router.push({
                    pathname: "/seller-sales/[id]",
                    params: { id: sellerProfile.id },
                  } as any)
                }
              >
                <Text style={styles.sectionTitle}>판매 목록</Text>
                <Ionicons name="chevron-forward" size={17} color="#B6B6B6" />
              </TouchableOpacity>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.saleList}
              >
                {visibleSales.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={item.isPlaceholder ? 1 : 0.75}
                    style={styles.saleItem}
                    disabled={item.isPlaceholder}
                    onPress={() => {
                      if (item.isPlaceholder) return;

                      router.push({
                        pathname: "/divide-detail",
                        params: { postId: String(item.id) },
                      } as any);
                    }}
                  >
                    <View style={styles.saleThumb}>
                      {!item.isPlaceholder && item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.saleImage}
                          resizeMode="cover"
                          onError={(error) => {
                            console.log(
                              "판매 목록 이미지 로드 실패:",
                              item.imageUrl,
                              error.nativeEvent
                            );
                          }}
                        />
                      ) : null}
                    </View>

                    {!item.isPlaceholder && (
                      <Text numberOfLines={1} style={styles.saleTitle}>
                        {item.title}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionCard}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.sectionHeader}
                onPress={() =>
                  router.push({
                    pathname: "/seller-reviews/[id]",
                    params: { id: sellerProfile.id },
                  } as any)
                }
              >
                <Text style={styles.sectionTitle}>
                  받은 후기 {sellerProfile.receivedReviewCount}
                </Text>
                <Ionicons name="chevron-forward" size={17} color="#B6B6B6" />
              </TouchableOpacity>

              {visibleReviews.length > 0 ? (
                <View style={styles.reviewList}>
                  {visibleReviews.map((review, index) => (
                    <ReviewRow
                      key={review.id}
                      review={review}
                      isLast={index === visibleReviews.length - 1}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyReviewBox}>
                  <Text style={styles.emptyReviewText}>
                    {sellerProfile.receivedReviewCount > 0
                      ? "후기 개수는 확인됐지만 목록 데이터가 아직 없어요"
                      : "아직 받은 후기가 없어요"}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setMenuVisible(false)}
            onTouchMove={() => setMenuVisible(false)}
          >
            <Pressable
              style={styles.moreMenu}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.moreMenuItem}
                onPress={goReport}
              >
                <Text style={styles.moreMenuText}>사기 신고하기</Text>
                <Ionicons name="chevron-forward" size={15} color="#B5B5B5" />
              </TouchableOpacity>

              <View style={styles.moreMenuDivider} />

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.moreMenuItem}
                onPress={() => {
                  setMenuVisible(false);
                  console.log("팔로우 하기");
                }}
              >
                <Text style={styles.moreMenuText}>팔로우 하기</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={scoreModalVisible} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setScoreModalVisible(false)}
          >
            <Pressable style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.75}
                onPress={() => setScoreModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#777777" />
              </TouchableOpacity>

              <View style={styles.modalIcon}>
                <Ionicons name="shield-checkmark" size={28} color="#111111" />
              </View>

              <Text style={styles.modalTitle}>신뢰 점수란?</Text>

              <Text style={styles.modalDescription}>
                사용자의 거래 활동을 바탕으로 계산한 100점 만점의 신뢰
                지표예요.
              </Text>

              <View style={styles.criteriaBox}>
                <Text style={styles.criteriaTitle}>측정 기준</Text>

                <CriteriaItem title="거래 완료율" />
                <CriteriaItem title="채팅 응답 속도" />
                <CriteriaItem title="신고 이력" />
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                activeOpacity={0.8}
                onPress={() => setScoreModalVisible(false)}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function ReviewRow({ review, isLast }: { review: ReviewItem; isLast: boolean }) {
  return (
    <View style={[styles.reviewItem, isLast && styles.reviewItemLast]}>
      <View style={styles.reviewProfile}>
        {review.profileImage ? (
          <Image
            source={{ uri: review.profileImage }}
            style={styles.reviewProfileImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.reviewInitial}>{review.initial}</Text>
        )}
      </View>

      <View style={styles.reviewContent}>
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
    </View>
  );
}

function CriteriaItem({ title }: { title: string }) {
  return (
    <View style={styles.criteriaItem}>
      <View style={styles.dot} />
      <Text style={styles.criteriaText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  header: {
    height: 58,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
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

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111111",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
  },

  scrollContentWithWarning: {
    paddingTop: 0,
  },

  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  errorText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#999999",
    textAlign: "center",
  },

  warningBanner: {
    backgroundColor: "#F6DADA",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: -20,
    marginBottom: 18,
  },

  warningText: {
    color: "#C7352B",
    fontSize: 15,
    fontWeight: "900",
  },

  profileCard: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    zIndex: 20,
  },

  moreButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.01)",
  },

  moreMenu: {
    position: "absolute",
    top: 200,
    right: 38,
    width: 168,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  moreMenuItem: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  moreMenuText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555555",
  },

  moreMenuDivider: {
    height: 1,
    backgroundColor: "#EFEFEF",
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 48,
  },

  profileCircle: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: "#EEF1F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },

  profileImage: {
    width: "100%",
    height: "100%",
  },

  profileInitial: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4B5563",
  },

  profileInfo: {
    flex: 1,
  },

  nickname: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 6,
  },

  subText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9D9D9D",
    lineHeight: 19,
  },

  trustArea: {
    marginTop: 22,
    paddingTop: 4,
  },

  trustTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  trustTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  trustInfoIcon: {
    marginLeft: 5,
  },

  trustLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333333",
  },

  trustScoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  trustScore: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: -0.5,
    marginTop: 2,
  },

  trustPoint: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8A8A8A",
    marginLeft: 3,
    marginBottom: 3,
  },

  progressBg: {
    height: 5,
    backgroundColor: "#EFEFEF",
    borderRadius: 99,
    marginTop: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: YELLOW,
    borderRadius: 99,
  },

  sectionCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 22,
    shadowColor: "#000000",
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    overflow: "hidden",
  },

  sectionHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
    letterSpacing: -0.2,
  },

  saleList: {
    paddingTop: 18,
    paddingRight: 10,
    gap: 13,
  },

  saleItem: {
    width: 82,
    alignItems: "center",
  },

  saleThumb: {
    width: 82,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#FFF0CC",
    overflow: "hidden",
  },

  saleImage: {
    width: "100%",
    height: "100%",
  },

  saleTitle: {
    width: 86,
    marginTop: 9,
    fontSize: 12,
    color: "#222222",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },

  reviewList: {
    marginTop: 9,
  },

  reviewItem: {
    flexDirection: "row",
    paddingTop: 16,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#EFE7DB",
  },

  reviewItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },

  reviewProfile: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F4F0E8",
    borderWidth: 1,
    borderColor: "#E6DFD3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
    overflow: "hidden",
  },

  reviewProfileImage: {
    width: "100%",
    height: "100%",
  },

  reviewInitial: {
    fontSize: 11,
    fontWeight: "900",
    color: "#333333",
  },

  reviewContent: {
    flex: 1,
  },

  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reviewName: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#222222",
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },

  reviewDate: {
    fontSize: 11,
    color: "#9A9A9A",
    fontWeight: "600",
  },

  reviewText: {
    marginTop: 8,
    fontSize: 13,
    color: "#333333",
    lineHeight: 19,
    fontWeight: "500",
    letterSpacing: -0.2,
  },

  emptyReviewBox: {
    paddingTop: 34,
    paddingBottom: 20,
    alignItems: "center",
  },

  emptyReviewText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B0B0B0",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  modalContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingTop: 30,
    paddingHorizontal: 22,
    paddingBottom: 22,
  },

  closeButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  modalIcon: {
    alignSelf: "center",
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#FFF9E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111111",
    textAlign: "center",
  },

  modalDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#777777",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
  },

  criteriaBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 18,
    marginTop: 22,
  },

  criteriaTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 14,
  },

  criteriaItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: YELLOW,
    marginRight: 10,
  },

  criteriaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555555",
  },

  confirmButton: {
    height: 54,
    backgroundColor: YELLOW,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
  },
});