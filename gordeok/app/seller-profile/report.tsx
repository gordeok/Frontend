import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray800: "#333333",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray100: "#F8F8F8",
  red: "#E35252",
  yellow: "#F7C94B",
  line: "#F1F1F1",
};

const SCREEN_PADDING = 22;
const STORAGE_KEY = "fraudReports";

type FraudReport = {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  content: string;
  photoCount: number;
  status: "접수완료";
  createdAt: number;
};

type CreateFraudReportPayload = {
  sellerId: string;
  sellerName: string;
  title: string;
  content: string;
  photoCount: number;
};

function createFraudReport(payload: CreateFraudReportPayload): FraudReport {
  return {
    id: String(Date.now()),
    sellerId: payload.sellerId,
    sellerName: payload.sellerName,
    title: payload.title,
    content: payload.content,
    photoCount: payload.photoCount,
    status: "접수완료",
    createdAt: Date.now(),
  };
}

export default function SellerReportScreen() {
  const { sellerId, sellerName } = useLocalSearchParams<{
    sellerId?: string;
    sellerName?: string;
  }>();

  const reportSellerId = String(sellerId ?? "");
  const reportSellerName = String(sellerName ?? "판매자");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

  const handleAddPhoto = () => {
    if (photoCount >= 5) {
      Alert.alert("알림", "사진은 최대 5장까지 추가할 수 있어요.");
      return;
    }

    setPhotoCount((prev) => prev + 1);
  };

  const handleRemovePhoto = () => {
    setPhotoCount((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      Alert.alert("알림", "제목을 입력해주세요.");
      return;
    }

    if (!trimmedContent) {
      Alert.alert("알림", "내용을 입력해주세요.");
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const newReport = createFraudReport({
        sellerId: reportSellerId,
        sellerName: reportSellerName,
        title: trimmedTitle,
        content: trimmedContent,
        photoCount,
      });

      const savedReports = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedReports: FraudReport[] = savedReports
        ? JSON.parse(savedReports)
        : [];

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([newReport, ...parsedReports])
      );

      Alert.alert("신고 접수 완료", "사기 신고가 접수되었습니다.", [
        {
          text: "확인",
          onPress: () => router.back(),
        },
      ]);

      /*
        나중에 백엔드 연동 시 여기만 교체하면 됨.

        await fetch("백엔드주소/reports/fraud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId: reportSellerId,
            sellerName: reportSellerName,
            title: trimmedTitle,
            content: trimmedContent,
            photoCount,
          }),
        });
      */
    } catch (error) {
      Alert.alert("오류", "신고 접수 중 문제가 발생했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerSideButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>사기 신고</Text>

          <TouchableOpacity
            activeOpacity={0.75}
            style={[
              styles.submitButton,
              (!canSubmit || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <Text
              style={[
                styles.submitText,
                (!canSubmit || isSubmitting) && styles.submitTextDisabled,
              ]}
            >
              신고
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.targetSection}>
            <View style={styles.targetBox}>
              <View style={styles.targetIconBox}>
                <Ionicons name="warning-outline" size={18} color={COLORS.red} />
              </View>

              <View style={styles.targetTextBox}>
                <Text style={styles.targetLabel}>신고 대상</Text>
                <Text style={styles.targetName}>{reportSellerName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>제목</Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="신고 제목을 입력해주세요"
              placeholderTextColor={COLORS.gray400}
              style={styles.titleInput}
              maxLength={60}
              returnKeyType="next"
            />

            <Text style={styles.countText}>{title.length} / 60</Text>
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.label}>내용</Text>

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={
                "신고 내용을 자세히 입력해주세요.\n예) 입금 후 연락 두절, 허위 상품 판매 등"
              }
              placeholderTextColor={COLORS.gray400}
              style={styles.contentInput}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />

            <Text style={styles.countText}>{content.length} / 1000</Text>
          </View>

          <View style={styles.photoSection}>
            <View style={styles.photoHeader}>
              <View>
                <Text style={styles.label}>사진 추가</Text>
                <Text style={styles.photoGuide}>
                  채팅 내역, 입금 내역 등을 첨부해주세요
                </Text>
              </View>

              <Text style={styles.photoCount}>{photoCount} / 5</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              <Pressable
                onPress={handleAddPhoto}
                style={({ pressed }) => [
                  styles.addPhotoBox,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={25} color={COLORS.gray500} />
              </Pressable>

              {Array.from({ length: photoCount }).map((_, index) => (
                <Pressable
                  key={index}
                  style={styles.photoPreviewBox}
                  onPress={handleRemovePhoto}
                >
                  <Ionicons name="image-outline" size={25} color={COLORS.red} />

                  <View style={styles.removePhotoButton}>
                    <Ionicons name="close" size={12} color={COLORS.white} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              허위 신고 또는 과장된 내용 작성 시 서비스 이용이 제한될 수
              있습니다. 정확한 확인을 위해 증거 이미지를 첨부해주세요.
            </Text>
          </View>
        </ScrollView>
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
    backgroundColor: COLORS.white,
  },

  header: {
    height: 60,
    paddingHorizontal: SCREEN_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
  },

  headerSideButton: {
    width: 58,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  cancelText: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: "700",
  },

  headerTitle: {
    position: "absolute",
    left: 90,
    right: 90,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
  },

  submitButton: {
    minWidth: 52,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.red,
    justifyContent: "center",
    alignItems: "center",
  },

  submitButtonDisabled: {
    backgroundColor: "#E8E8E8",
  },

  submitText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  submitTextDisabled: {
    color: COLORS.gray400,
  },

  scroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    paddingBottom: 42,
  },

  targetSection: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  targetBox: {
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#FFF6F6",
    borderWidth: 1,
    borderColor: "#FFD2D2",
    flexDirection: "row",
    alignItems: "center",
  },

  targetIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFEAEA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  targetTextBox: {
    flex: 1,
  },

  targetLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray500,
    marginBottom: 4,
  },

  targetName: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.red,
  },

  inputSection: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },

  contentSection: {
    minHeight: 270,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },

  label: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.gray900,
    marginBottom: 9,
  },

  titleInput: {
    minHeight: 32,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    letterSpacing: -0.2,
  },

  contentInput: {
    minHeight: 174,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.gray800,
    lineHeight: 23,
    letterSpacing: -0.15,
  },

  countText: {
    alignSelf: "flex-end",
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray400,
  },

  photoSection: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
    paddingBottom: 4,
  },

  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  photoGuide: {
    marginTop: -4,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray500,
  },

  photoCount: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray500,
  },

  photoRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: SCREEN_PADDING,
  },

  addPhotoBox: {
    width: 78,
    height: 78,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    justifyContent: "center",
    alignItems: "center",
  },

  photoPreviewBox: {
    width: 78,
    height: 78,
    borderRadius: 16,
    backgroundColor: "#FFF6F6",
    borderWidth: 1,
    borderColor: "#FFD8D8",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  removePhotoButton: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "center",
    alignItems: "center",
  },

  warningBox: {
    marginHorizontal: SCREEN_PADDING,
    marginTop: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.yellow,
    backgroundColor: "#FFFBEA",
  },

  warningText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9A7200",
    lineHeight: 19,
  },

  pressed: {
    opacity: 0.75,
  },
});