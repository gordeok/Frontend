import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
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

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://172.20.99.65:8080";

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

function getImageMimeType(uri: string) {
  const lowerUri = uri.toLowerCase();

  if (lowerUri.endsWith(".png")) return "image/png";
  if (lowerUri.endsWith(".webp")) return "image/webp";
  if (lowerUri.endsWith(".heic")) return "image/heic";
  if (lowerUri.endsWith(".heif")) return "image/heif";

  return "image/jpeg";
}

function getImageFileName(uri: string, index: number) {
  const fileName = uri.split("/").pop();

  if (fileName && fileName.includes(".")) {
    return fileName;
  }

  return `report-image-${index + 1}.jpg`;
}

async function getStoredUserId() {
  const savedUserId =
    (await AsyncStorage.getItem("userId")) ??
    (await AsyncStorage.getItem("USER_ID")) ??
    (await AsyncStorage.getItem("storedUserId")) ??
    (await AsyncStorage.getItem("goReudeokUserId")) ??
    "";

  return Number(savedUserId);
}

async function submitReport(params: {
  reporterId: number;
  targetUserId: number;
  reason: string;
  content: string;
  imageUris: string[];
  postId?: number;
}) {
  const formData = new FormData();

  const reportData: {
    targetUserId: number;
    postId?: number;
    reason: string;
    content: string;
  } = {
    targetUserId: params.targetUserId,
    reason: params.reason,
    content: params.content,
  };

  if (params.postId && !Number.isNaN(params.postId)) {
    reportData.postId = params.postId;
  }

  formData.append("data", {
    string: JSON.stringify(reportData),
    type: "application/json",
    name: "data.json",
  } as any);

  params.imageUris.forEach((uri, index) => {
    formData.append("images", {
      uri,
      name: getImageFileName(uri, index),
      type: getImageMimeType(uri),
    } as any);
  });

  console.log("신고 FormData data:", reportData);
  console.log("신고 이미지 개수:", params.imageUris.length);

  const response = await fetch(
    `${API_BASE_URL}/api/reports?reporterId=${params.reporterId}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const responseText = await response.text();

  console.log("신고 응답 status:", response.status);
  console.log("신고 응답 text:", responseText);

  let data: any = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message ?? responseText ?? "신고 접수에 실패했어요.");
  }

  return data;
}

export default function SellerReportScreen() {
  const { sellerId, sellerName, postId } = useLocalSearchParams<{
    sellerId?: string;
    sellerName?: string;
    postId?: string;
  }>();

  const reportSellerId = String(sellerId ?? "");
  const reportSellerName = String(sellerName ?? "판매자");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    !isSubmitting;

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

  const handleAddPhoto = async () => {
    if (imageUris.length >= 5) {
      Alert.alert("알림", "사진은 최대 5장까지 추가할 수 있어요.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("알림", "사진 접근 권한이 필요해요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - imageUris.length,
    });

    if (result.canceled) return;

    const pickedUris = result.assets.map((asset) => asset.uri);

    setImageUris((prev) => [...prev, ...pickedUris].slice(0, 5));
  };

  const handleRemovePhoto = (index: number) => {
    setImageUris((prev) => prev.filter((_, photoIndex) => photoIndex !== index));
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

      const reporterId = await getStoredUserId();
      const targetUserId = Number(reportSellerId);
      const relatedPostId = postId ? Number(postId) : undefined;

      if (!reporterId || Number.isNaN(reporterId)) {
        Alert.alert("오류", "로그인 정보를 찾을 수 없어요. 다시 로그인해주세요.");
        return;
      }

      if (!targetUserId || Number.isNaN(targetUserId)) {
        Alert.alert("오류", "신고 대상 정보를 찾을 수 없어요.");
        return;
      }

      console.log("신고 요청 reporterId:", reporterId);
      console.log("신고 요청 targetUserId:", targetUserId);
      console.log("신고 요청 postId:", relatedPostId);
      console.log("신고 첨부 이미지:", imageUris);

      const result = await submitReport({
        reporterId,
        targetUserId,
        postId:
          relatedPostId && !Number.isNaN(relatedPostId)
            ? relatedPostId
            : undefined,
        reason: trimmedTitle,
        content: trimmedContent,
        imageUris,
      });

      Alert.alert(
        "신고 접수 완료",
        result?.message || "사기 신고가 접수되었습니다.",
        [
          {
            text: "확인",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log("신고 접수 오류:", error);

      Alert.alert(
        "오류",
        error instanceof Error
          ? error.message
          : "신고 접수 중 문제가 발생했어요."
      );
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
              !canSubmit && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text
              style={[
                styles.submitText,
                !canSubmit && styles.submitTextDisabled,
              ]}
            >
              {isSubmitting ? "접수중" : "신고"}
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

              <Text style={styles.photoCount}>{imageUris.length} / 5</Text>
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

              {imageUris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.photoPreviewBox}>
                  <Image source={{ uri }} style={styles.photoPreviewImage} />

                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={12} color={COLORS.white} />
                  </Pressable>
                </View>
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
    paddingBottom: 1,
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
    overflow: "hidden",
    position: "relative",
  },

  photoPreviewImage: {
    width: "100%",
    height: "100%",
  },

  removePhotoButton: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  warningBox: {
    marginHorizontal: SCREEN_PADDING,
    marginTop: 10,
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