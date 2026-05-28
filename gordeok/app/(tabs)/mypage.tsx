// 마이페이지 화면

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

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

import {
  getMyProfile,
  getTrustScore,
  MyProfile,
  TrustScoreDetail,
} from "../../services/user";

const YELLOW = "#F3C24F";

const DEFAULT_PROFILE = require("../../assets/img/profile.jpg");

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://frostily-derby-underpass.ngrok-free.dev";

function normalizeImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmed = String(url).trim();

  if (!trimmed) return "";

  if (trimmed.startsWith("http://localhost:8080")) {
    return trimmed.replace("http://localhost:8080", API_BASE_URL);
  }

  if (trimmed.startsWith("https://localhost:8080")) {
    return trimmed.replace("https://localhost:8080", API_BASE_URL);
  }

  if (trimmed.startsWith("http://127.0.0.1:8080")) {
    return trimmed.replace("http://127.0.0.1:8080", API_BASE_URL);
  }

  if (trimmed.startsWith("https://127.0.0.1:8080")) {
    return trimmed.replace("https://127.0.0.1:8080", API_BASE_URL);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`;
  }

  return `${API_BASE_URL}/${trimmed}`;
}

function getProfileImageUrl(profile: any) {
  return normalizeImageUrl(
    profile?.profileImage ||
      profile?.profileImageUrl ||
      profile?.profileImg ||
      profile?.imageUrl ||
      profile?.image ||
      profile?.userProfileImage
  );
}

function formatJoinDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ko-KR");
}

export default function MyPageScreen() {
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScoreDetail | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadMyPage = async () => {
      try {
        setLoading(true);

        const profileData = await getMyProfile();

        console.log("마이페이지 프로필 응답:", profileData);
        console.log("마이페이지 프로필 이미지:", getProfileImageUrl(profileData));

        setProfile(profileData);

        const trustData = await getTrustScore(profileData.userId);
        setTrustScore(trustData);
      } catch (error) {
        console.log("마이페이지 불러오기 실패", error);
        setProfile(null);
        setTrustScore(null);
      } finally {
        setLoading(false);
      }
    };

    loadMyPage();
  }, []);

  const score = trustScore?.totalScore ?? profile?.trustScore ?? 0;
  const profileImageUrl = getProfileImageUrl(profile);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#F6F6F6" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이페이지</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileCard}>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.75}
              onPress={() => router.push("/editProfile" as any)}
            >
              <Text style={styles.editButtonText}>편집</Text>
            </TouchableOpacity>

            <View style={styles.profileTop}>
              <View style={styles.profileCircle}>
                <Image
                  key={profileImageUrl || "default"}
                  source={profileImageUrl ? { uri: profileImageUrl } : DEFAULT_PROFILE}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.nickname}>
                  {profile?.nickname ?? "사용자"}
                </Text>
                <Text style={styles.subText}>
                  가입 {formatJoinDate(profile?.createdAt)}
                </Text>
                <Text style={styles.subText}>팔로워 0명 · 팔로잉 0명</Text>
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
                  <Text style={styles.trustScore}>{score}</Text>
                  <Text style={styles.trustPoint}>점</Text>
                </View>
              </View>

              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${score}%`,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.menuCard}>
            <Text style={styles.cardTitle}>나의 거래</Text>

            <MenuItem
              icon="list-outline"
              title="구매 목록"
              onPress={() => router.push("/purchaseList" as any)}
            />

            <MenuItem
              icon="pricetag-outline"
              title="판매 목록"
              onPress={() => router.push("/saleList" as any)}
            />

            <MenuItem
              icon="bookmark-outline"
              title="북마크 목록"
              onPress={() => router.push("/bookmark-list" as any)}
              isLast
            />
          </View>

          <View style={styles.menuCard}>
            <Text style={styles.cardTitle}>나의 활동</Text>

            <MenuItem
              icon="chatbubble-ellipses-outline"
              title="받은 후기"
              onPress={() => router.push("/receivedReviews" as any)}
            />

            <MenuItem
              icon="people-outline"
              title="작성한 커뮤니티 글"
              onPress={() => router.push("/mycommunityPosts" as any)}
              isLast
            />
          </View>

          <View style={styles.menuCard}>
            <Text style={styles.cardTitle}>설정</Text>

            <MenuItem icon="notifications-outline" title="알림 설정" />

            <MenuItem icon="help-circle-outline" title="고객센터" />

            <MenuItem icon="settings-outline" title="앱 설정" isLast />
          </View>

          <View style={styles.footerInfo}>
            <TouchableOpacity activeOpacity={0.7} style={styles.businessInfoRow}>
              <Text style={styles.businessInfoText}>(주) GO르덕</Text>
            </TouchableOpacity>

            <Text style={styles.footerDescription}>
              GO르덕은 굿즈 분철 및 거래를 연결하는 플랫폼이며, 거래
              과정에서 발생하는 개인 간 거래에 대해 직접적인 책임을 지지
              않습니다.
            </Text>
          </View>
        </ScrollView>

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

function MenuItem({
  icon,
  title,
  onPress,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.lastMenuItem]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIconBox}>
          <Ionicons name={icon} size={21} color="#555555" />
        </View>

        <Text style={styles.menuText}>{title}</Text>
      </View>

      <Ionicons name="chevron-forward" size={17} color="#B5B5B5" />
    </TouchableOpacity>
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
    backgroundColor: "#F6F6F6",
  },

  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },

  header: {
    height: 64,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111111",
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 34,
  },

  profileCard: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
  },

  editButton: {
    position: "absolute",
    top: 18,
    right: 18,
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 10,
  },

  editButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555555",
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 64,
  },

  profileCircle: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#EEF1F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
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
    marginTop: 6,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: YELLOW,
    borderRadius: 99,
  },

  menuCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 2,
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9A9A9A",
    marginBottom: 5,
  },

  menuItem: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },

  lastMenuItem: {
    borderBottomWidth: 0,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  menuIconBox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },

  footerInfo: {
    marginTop: 30,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },

  businessInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  businessInfoText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8C8C8C",
    marginRight: 4,
  },

  footerDescription: {
    fontSize: 12,
    fontWeight: "500",
    color: "#A0A0A0",
    lineHeight: 19,
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