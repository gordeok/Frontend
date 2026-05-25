import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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

type Buyer = {
  id: string;
  nickname: string;
  member: string;
  initial: string;
  color: string;
  initialColor: string;
};

const buyers: Buyer[] = [
  {
    id: "1",
    nickname: "윈터러버",
    member: "윈터",
    initial: "윈",
    color: "#DDF7EB",
    initialColor: "#1E8E61",
  },
  {
    id: "2",
    nickname: "닝구르트",
    member: "닝닝",
    initial: "닝",
    color: "#FFE0CA",
    initialColor: "#E0702A",
  },
  {
    id: "3",
    nickname: "지젤최고",
    member: "지젤",
    initial: "지",
    color: "#EEEEEE",
    initialColor: "#999999",
  },
];

export default function TrackingShareScreen() {
  const { chatRoomId } = useLocalSearchParams<{ chatRoomId?: string }>();

  const [buyerList, setBuyerList] = useState<Buyer[]>([]);
  const [courierType, setCourierType] = useState("GS반값택배");
  const [trackingNumbers, setTrackingNumbers] = useState<
    Record<string, string>
  >({});

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const loadTrackingSetup = async () => {
      try {
        const response = await getTrackingSetup(chatRoomId ?? "1");

        setCourierType(response.defaultCourierType || "GS반값택배");

        const normalizedBuyers = response.buyers.map((buyer, index) => {
          const colors = [
            { color: "#DDF7EB", initialColor: "#1E8E61" },
            { color: "#FFE0CA", initialColor: "#E0702A" },
            { color: "#EEEEEE", initialColor: "#999999" },
          ];
          const profile = colors[index % colors.length];

          return {
            id: String(buyer.buyerUserId),
            nickname: buyer.nickname,
            member: buyer.memberName,
            initial: buyer.nickname.slice(0, 1),
            color: profile.color,
            initialColor: profile.initialColor,
          };
        });

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

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible && styles.contentWhenKeyboard,
          ]}
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
                    <Text
                      style={[
                        styles.profileInitial,
                        { color: buyer.initialColor },
                      ]}
                    >
                      {buyer.initial}
                    </Text>
                  </View>

                  <View style={styles.buyerTextBox}>
                    <Text style={styles.nickname}>{buyer.nickname}</Text>
                    <Text style={styles.memberName}>{buyer.member}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.inputBlock}>
                  <Text style={styles.inputLabel}>운송장 번호</Text>

                  <TextInput
                    style={styles.input}
                    value={trackingNumbers[buyer.id] ?? ""}
                    onChangeText={(value) => handleChange(buyer.id, value)}
                    placeholder="운송장 번호를 입력해주세요"
                    placeholderTextColor={COLORS.gray500}
                    returnKeyType="done"
                  />
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {!isKeyboardVisible && (
          <View style={styles.bottomButtonWrap}>
            <TouchableOpacity
              style={[
                styles.shareButton,
                buyerList.length === 0 && styles.shareButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleShare}
              disabled={buyerList.length === 0}
            >
              <Text
                style={[
                  styles.shareButtonText,
                  buyerList.length === 0 && styles.shareButtonTextDisabled,
                ]}
              >
                운송장 번호 공유하기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
  },
  header: {
    height: 58,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
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
    backgroundColor: COLORS.white,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 108,
  },
  contentWhenKeyboard: {
    paddingBottom: 34,
  },
  noticeBox: {
    backgroundColor: COLORS.yellowLight,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.gray900,
    marginBottom: 5,
  },
  noticeDesc: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 17,
  },
  buyerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 16,
    marginBottom: 14,
  },
  buyerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 15,
    fontWeight: "900",
  },
  buyerTextBox: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginTop: 16,
    marginBottom: 18,
  },
  inputBlock: {
    paddingTop: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray500,
    marginBottom: 10,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 14,
    fontSize: 13,
    color: COLORS.black,
    fontWeight: "600",
  },
  emptyBox: {
    minHeight: 260,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    marginTop: 75,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.gray900,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 19,
    textAlign: "center",
  },
  bottomButtonWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  shareButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonDisabled: {
    backgroundColor: COLORS.gray200,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },
  shareButtonTextDisabled: {
    color: COLORS.gray500,
  },
});