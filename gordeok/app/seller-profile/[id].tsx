import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const YELLOW = "#F3C24F";

type SaleItem = {
  id: number;
  title: string;
};

type ReviewItem = {
  id: number;
  initial: string;
  nickname: string;
  date: string;
  content: string;
};

type SellerProfile = {
  id: string;
  nickname: string;
  joinedAt: string;
  followerCount: number;
  followingCount: number;
  trustScore: number;
  hasFraudReport: boolean;
  sales: SaleItem[];
  reviews: ReviewItem[];
};

export default function SellerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const sellerProfile: SellerProfile = {
    id: id ?? "1",
    nickname: "범규와이프",
    joinedAt: "2023.08.12",
    followerCount: 5,
    followingCount: 13,
    trustScore: 78,
    hasFraudReport: true,
    sales: [
      { id: 1, title: "럽홀더 포카 양도" },
      { id: 2, title: "범규 포카 분철" },
      { id: 3, title: "투바투 앨범 분철" },
      { id: 4, title: "미공포 양도" },
    ],
    reviews: [
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
    ],
  };

  const closeMenu = () => {
    if (menuVisible) setMenuVisible(false);
  };

  const goReport = () => {
    setMenuVisible(false);

    router.push({
      pathname: "./report",
      params: {
        sellerId: sellerProfile.id,
        sellerName: sellerProfile.nickname,
      },
    });
  };

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
            <TouchableOpacity
              style={styles.moreButton}
              activeOpacity={0.65}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="ellipsis-horizontal" size={17} color="#555555" />
            </TouchableOpacity>

            <View style={styles.profileTop}>
              <View style={styles.profileCircle}>
                <Text style={styles.profileInitial}>
                  {sellerProfile.nickname.slice(0, 1)}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.nickname}>{sellerProfile.nickname}</Text>
                <Text style={styles.subText}>가입 {sellerProfile.joinedAt}</Text>
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
                  <Text style={styles.trustScore}>
                    {sellerProfile.trustScore}
                  </Text>
                  <Text style={styles.trustPoint}>점</Text>
                </View>
              </View>

              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${sellerProfile.trustScore}%` },
                  ]}
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
                })
              }
            >
              <Text style={styles.sectionTitle}>판매 목록</Text>
              <Ionicons name="chevron-forward" size={18} color="#B5B5B5" />
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.saleList}
            >
              {sellerProfile.sales.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  style={styles.saleItem}
                >
                  <View style={styles.saleThumb} />
                  <Text numberOfLines={1} style={styles.saleTitle}>
                    {item.title}
                  </Text>
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
                })
              }
            >
              <Text style={styles.sectionTitle}>받은 후기</Text>
              <Ionicons name="chevron-forward" size={18} color="#B5B5B5" />
            </TouchableOpacity>

            <View style={styles.reviewList}>
              {sellerProfile.reviews.map((review, index) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  isLast={index === sellerProfile.reviews.length - 1}
                />
              ))}
            </View>
          </View>
        </ScrollView>

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

function ReviewRow({
  review,
  isLast,
}: {
  review: ReviewItem;
  isLast: boolean;
}) {
  return (
    <View style={[styles.reviewItem, isLast && styles.reviewItemLast]}>
      <View style={styles.reviewProfile}>
        <Text style={styles.reviewInitial}>{review.initial}</Text>
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
    backgroundColor: "#FFFFFF",
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
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 34,
  },

  warningBanner: {
    backgroundColor: "#F6DADA",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: -22,
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
    borderWidth: 1,
    borderColor: "#F0F0F0",
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
    color: "black",
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
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    zIndex: 1,
  },

  sectionHeader: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
  },

  saleList: {
    paddingTop: 15,
    gap: 12,
  },

  saleItem: {
    width: 86,
  },

  saleThumb: {
    width: 86,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#FFF1CC",
  },

  saleTitle: {
    marginTop: 8,
    fontSize: 12,
    color: "#222222",
    fontWeight: "700",
    textAlign: "center",
  },

  reviewList: {
    marginTop: 10,
  },

  reviewItem: {
    flexDirection: "row",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },

  reviewItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },

  reviewProfile: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F7F5EF",
    borderWidth: 1,
    borderColor: "#E8E4D8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  reviewInitial: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: "800",
    color: "#222222",
    flex: 1,
    marginRight: 8,
  },

  reviewDate: {
    fontSize: 11,
    color: "#999999",
    fontWeight: "600",
  },

  reviewText: {
    marginTop: 7,
    fontSize: 13,
    color: "#555555",
    lineHeight: 18,
    fontWeight: "600",
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
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});