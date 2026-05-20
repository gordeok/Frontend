import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyPageScreen() {
  const [scoreModalVisible, setScoreModalVisible] = useState(false);

  const reviews = [
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
      name: "수빈이라고나수빈",
      date: "2025.03.12",
      text: "다음에도 또 분철 타겠습니다 열어주세요~",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이페이지</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.profileCircle}>
                <Text style={styles.profileInitial}>범</Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.nickname}>범규와이프</Text>
                <Text style={styles.subText}>가입 2023.08.12</Text>
                <Text style={styles.subText}>팔로워 0명. 팔로잉 0명</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/editProfile" as any)}
              >
                <Text style={styles.editText}>편집</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scoreBox}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setScoreModalVisible(true)}
              >
                <Text style={styles.scoreLabel}>신뢰점수 ⓘ</Text>
              </TouchableOpacity>

              <View style={styles.scoreRow}>
                <Text style={styles.scoreNumber}>78</Text>
                <Text style={styles.scoreTotal}> / 100</Text>
              </View>

              <View style={styles.progressBg}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>

          <View style={styles.menuCard}>
            <MenuItem
              icon="list-outline"
              title="구매 목록"
              onPress={() => router.push("/purchaseList" as any)}
            />
            <MenuItem 
              icon="bookmark-outline" 
              title="북마크 목록" 
              onPress={() => router.push("/bookmark-list" as any)}/>
            <MenuItem
              icon="people-outline"
              title="작성한 커뮤니티 글 보기"
              onPress={() => router.push("/mycommunityPosts" as any)}
            />
          </View>

          <View style={styles.sectionCard}>
            <SectionHeader
              title="판매 목록"
              onPress={() => router.push("/saleList" as any)}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3, 4].map((item) => (
                <TouchableOpacity key={item} style={styles.saleItem}>
                  <View style={styles.saleImage} />
                  <Text style={styles.saleTitle}>게시글 제목</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.reviewCard}>
            <SectionHeader
              title="받은 후기"
              onPress={() => router.push("/receivedReviews" as any)}
            />

            {reviews.map((review, index) => (
              <View
                key={index}
                style={[
                  styles.reviewItem,
                  index === reviews.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <View style={styles.reviewTop}>
                  <View style={styles.reviewProfile}>
                    <Text style={styles.reviewInitial}>
                      {review.name.slice(0, 1)}
                    </Text>
                  </View>

                  <Text style={styles.reviewName}>{review.name}</Text>

                  <View style={styles.starBox}>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>

                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal visible={scoreModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setScoreModalVisible(false)}
              >
                <Ionicons name="close" size={26} color="#999999" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>신뢰 점수란?</Text>

              <Text style={styles.modalDescription}>
                신뢰 점수는 사용자의 거래 활동을 종합해{"\n"}
                계산한 100점 만점의 신뢰 지표예요.
              </Text>

              <View style={styles.criteriaBox}>
                <Text style={styles.criteriaTitle}>측정 기준</Text>

                <View style={styles.criteriaItem}>
                  <View style={styles.dot} />
                  <Text style={styles.criteriaText}>거래 완료율</Text>
                </View>

                <View style={styles.criteriaItem}>
                  <View style={styles.dot} />
                  <Text style={styles.criteriaText}>채팅 응답 속도</Text>
                </View>

                <View style={styles.criteriaItem}>
                  <View style={styles.dot} />
                  <Text style={styles.criteriaText}>신고 이력</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setScoreModalVisible(false)}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  title,
  onPress,
}: {
  icon: any;
  title: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={18} color="#111111" />
        <Text style={styles.menuText}>{title}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#B5B5B5" />
    </TouchableOpacity>
  );
}

function SectionHeader({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text style={styles.sectionTitle}>{title}</Text>

      <Ionicons name="chevron-forward" size={16} color="#B5B5B5" />
    </TouchableOpacity>
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

  scrollContent: {
    paddingBottom: 35,
    paddingTop: 20,
  },

  header: {
    height: 78,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111111",
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 22,
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EACB59",
    justifyContent: "center",
    alignItems: "center",
  },

  profileInitial: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111111",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  nickname: {
    fontSize: 20,
    fontWeight: "900",
    color: "#222222",
    marginBottom: 4,
  },

  subText: {
    fontSize: 11,
    color: "#888888",
    marginTop: 1,
  },

  editText: {
    fontSize: 14,
    color: "#777777",
    fontWeight: "600",
  },

  scoreBox: {
    marginTop: 18,
  },

  scoreLabel: {
    fontSize: 11,
    color: "#777777",
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 2,
  },

  scoreNumber: {
    fontSize: 26,
    fontWeight: "900",
    color: "#333333",
  },

  scoreTotal: {
    fontSize: 13,
    color: "#777777",
    marginBottom: 4,
  },

  progressBg: {
    height: 4,
    backgroundColor: "#ECEAE2",
    borderRadius: 10,
    marginTop: 7,
    overflow: "hidden",
  },

  progressFill: {
    width: "78%",
    height: "100%",
    backgroundColor: "#EACB59",
    borderRadius: 10,
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    paddingVertical: 14,
  },

  menuItem: {
    height: 43,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuText: {
    marginLeft: 14,
    fontSize: 15,
    fontWeight: "800",
    color: "#111111",
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    padding: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#222222",
  },

  saleItem: {
    marginRight: 14,
    alignItems: "center",
  },

  saleImage: {
    width: 86,
    height: 74,
    borderRadius: 12,
    backgroundColor: "#F8EFCF",
  },

  saleTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
    marginTop: 10,
  },

  reviewCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    padding: 18,
  },

  reviewItem: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E3D6",
  },

  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  reviewProfile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F4E8",
    borderWidth: 1,
    borderColor: "#ECE7DB",
    justifyContent: "center",
    alignItems: "center",
  },

  reviewInitial: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111111",
  },

  reviewName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: "900",
    color: "#111111",
  },

  starBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  reviewDate: {
    fontSize: 10,
    color: "#999999",
    marginLeft: 8,
  },

  reviewText: {
    marginTop: 8,
    fontSize: 13,
    color: "#222222",
    lineHeight: 19,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 26,
  },

  modalContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingTop: 34,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },

  closeButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#222222",
    textAlign: "center",
  },

  modalDescription: {
    fontSize: 15,
    color: "#777777",
    textAlign: "center",
    lineHeight: 25,
    marginTop: 18,
  },

  criteriaBox: {
    backgroundColor: "#F7EECF",
    borderRadius: 18,
    padding: 22,
    marginTop: 28,
  },

  criteriaTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 18,
  },

  criteriaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0BC4C",
    marginRight: 12,
  },

  criteriaText: {
    fontSize: 16,
    color: "#444444",
  },

  confirmButton: {
    height: 68,
    backgroundColor: "#E4C863",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 34,
  },

  confirmButtonText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});