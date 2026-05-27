import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTrackingSetup, shareTracking } from "../../services/chat";
import { apiRequest } from "../../utils/api";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray300: "#DDDDDD",
  gray200: "#EEEEEE",
  gray100: "#F8F8F8",
  yellow: "#F7C94B",
  yellowLight: "#FFF6D8",
  line: "#EFEFEF",
};

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://172.20.99.65:8080"
).replace(/\/$/, "");

type Buyer = {
  id: string;
  nickname: string;
  member: string;
  initial: string;
  color: string;
  initialColor: string;
  profileImageUrl?: string;
};

type BuyerApiItem = {
  buyerUserId?: string | number;
  userId?: string | number;
  nickname?: string;
  memberName?: string;
  profileImage?: string;
  profileImageUrl?: string;
  profileImg?: string;
  userProfileImage?: string;
  imageUrl?: string;
  image?: string;
  photoUrl?: string;
  thumbnailUrl?: string;
};

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

function getProfileImageUrl(...sources: any[]) {
  for (const source of sources) {
    const raw =
      source?.profileImage ||
      source?.profileImageUrl ||
      source?.profileImg ||
      source?.userProfileImage ||
      source?.authorProfileImage ||
      source?.buyerProfileImage ||
      source?.sellerProfileImage ||
      source?.imageUrl ||
      source?.image ||
      source?.photoUrl ||
      source?.thumbnailUrl;

    const normalized = normalizeImageUrl(raw);

    if (normalized) return normalized;
  }

  return "";
}

async function fetchUserProfile(userId: string | number) {
  try {
    const data = await apiRequest<any>(`/api/users/${userId}/profile`, {
      method: "GET",
    });
    console.log(`운송장 공유 user ${userId} 프로필 응답:`, data);
    return data;
  } catch (error) {
    console.log(`운송장 공유 user ${userId} 프로필 조회 실패:`, error);
    return null;
  }
}

async function getBuyerProfileImage(buyer: BuyerApiItem) {
  const fromBuyer = getProfileImageUrl(buyer);

  if (fromBuyer) return fromBuyer;

  const userId = String(buyer.buyerUserId ?? buyer.userId ?? "").trim();

  if (!userId) return "";

  const userProfile = await fetchUserProfile(userId);

  return getProfileImageUrl(userProfile);
}

export default function TrackingShareScreen() {
  const { chatRoomId } = useLocalSearchParams<{ chatRoomId?: string }>();

  const [buyerList, setBuyerList] = useState<Buyer[]>([]);
  const [courierType, setCourierType] = useState("GS반값택배");
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>(
    {}
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showListener = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    const loadTrackingSetup = async () => {
      try {
        const response = await getTrackingSetup(chatRoomId ?? "1");

        console.log("운송장 공유 초기 응답:", response);

        setCourierType(response.defaultCourierType || "GS반값택배");

        const colors = [
          { color: "#DDF7EB", initialColor: "#1E8E61" },
          { color: "#FFE0CA", initialColor: "#E0702A" },
          { color: "#EEEEEE", initialColor: "#999999" },
        ];

        const normalizedBuyers = await Promise.all(
          (response.buyers ?? []).map(async (buyer: BuyerApiItem, index: number) => {
            const profile = colors[index % colors.length];
            const buyerId = String(buyer.buyerUserId ?? buyer.userId ?? "");
            const nickname = buyer.nickname || "구매자";
            const profileImageUrl = await getBuyerProfileImage(buyer);

            return {
              id: buyerId,
              nickname,
              member: buyer.memberName || "선택 멤버",
              initial: nickname.slice(0, 1),
              color: profile.color,
              initialColor: profile.initialColor,
              profileImageUrl,
            };
          })
        );

        console.log("운송장 공유 구매자 프로필 매핑:", normalizedBuyers);

        setBuyerList(normalizedBuyers);

        setTrackingNumbers(
          normalizedBuyers.reduce<Record<string, string>>((result, buyer) => {
            result[buyer.id] = "";
            return result;
          }, {})
        );
      } catch (error) {
        console.log("운송장 공유 초기 데이터 조회 실패:", error);
        setBuyerList([]);
        setTrackingNumbers({});
      }
    };

    loadTrackingSetup();
  }, [chatRoomId]);

  const handleChange = (id: string, value: string) => {
    setTrackingNumbers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleShare = async () => {
    if (buyerList.length === 0) {
      Alert.alert(
        "공유할 구매자가 없어요",
        "아직 참여자가 없어 운송장을 공유할 수 없어요."
      );
      return;
    }

    const hasEmpty = buyerList.some(
      (buyer) => !trackingNumbers[buyer.id]?.trim()
    );

    if (hasEmpty) {
      Alert.alert("입력 필요", "모든 구매자의 운송장 번호를 입력해주세요.");
      return;
    }

    try {
      await shareTracking(chatRoomId ?? "1", {
        trackingList: buyerList.map((buyer) => ({
          buyerUserId: Number(buyer.id),
          courierType,
          trackingNumber: trackingNumbers[buyer.id].trim(),
        })),
      });
    } catch (error) {
      console.log("운송장 번호 공유 실패:", error);

      Alert.alert(
        "공유 실패",
        "운송장 번호 공유에 실패했어요. 다시 시도해주세요."
      );
      return;
    }

    Alert.alert("공유 완료", "운송장 번호가 공유되었습니다.", [
      {
        text: "확인",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>운송장 번호 공유</Text>

        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>
            구매자별로 운송장 번호를 입력해주세요.
          </Text>
          <Text style={styles.noticeDesc}>
            입력 후 구매자에게 배송 알림이 전송됩니다.
          </Text>
        </View>

        {buyerList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>아직 참여자가 없어요</Text>

            <Text style={styles.emptyDesc}>
              구매자가 분철에 참여하면 이곳에서 운송장 번호를 공유할 수
              있어요.
            </Text>
          </View>
        ) : (
          buyerList.map((buyer) => (
            <View key={buyer.id} style={styles.buyerCard}>
              <View style={styles.buyerTop}>
                <View
                  style={[
                    styles.profileCircle,
                    { backgroundColor: buyer.color },
                  ]}
                >
                  {buyer.profileImageUrl ? (
                    <Image
                      key={buyer.profileImageUrl}
                      source={{ uri: buyer.profileImageUrl }}
                      style={styles.profileImage}
                      resizeMode="cover"
                      onLoad={() => {
                        console.log(
                          "운송장 공유 프로필 이미지 로드 성공:",
                          buyer.profileImageUrl
                        );
                      }}
                      onError={(error) => {
                        console.log(
                          "운송장 공유 프로필 이미지 로드 실패:",
                          buyer.profileImageUrl,
                          error.nativeEvent
                        );
                      }}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.profileInitial,
                        { color: buyer.initialColor },
                      ]}
                    >
                      {buyer.initial}
                    </Text>
                  )}
                </View>

                <View style={styles.buyerTextBox}>
                  <Text style={styles.buyerNickname}>{buyer.nickname}</Text>
                  <Text style={styles.buyerMember}>{buyer.member}</Text>
                </View>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>운송장 번호</Text>

                <TextInput
                  style={styles.input}
                  placeholder="운송장 번호를 입력하세요"
                  placeholderTextColor={COLORS.gray500}
                  value={trackingNumbers[buyer.id] ?? ""}
                  onChangeText={(value) => handleChange(buyer.id, value)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {!isKeyboardVisible && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.shareButton}
            activeOpacity={0.82}
            onPress={handleShare}
          >
            <Text style={styles.shareButtonText}>운송장 번호 공유하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    height: 58,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },
  contentWhenKeyboard: {
    paddingBottom: 220,
  },
  noticeBox: {
    backgroundColor: COLORS.yellowLight,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 5,
  },
  noticeDesc: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    color: COLORS.gray700,
  },
  emptyBox: {
    minHeight: 280,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 9,
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 20,
    textAlign: "center",
  },
  buyerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  buyerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  profileInitial: {
    fontSize: 19,
    fontWeight: "900",
  },
  buyerTextBox: {
    flex: 1,
  },
  buyerNickname: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 5,
  },
  buyerMember: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  inputBox: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.gray700,
    marginBottom: 8,
  },
  courierBox: {
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  courierText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  input: {
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
  },
  shareButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
  },
});