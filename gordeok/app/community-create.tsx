// 커뮤니티 글 작성 화면

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
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

import { createCommunityPost } from "../services/community";
import type { CommunityCategory } from "../types/community";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://172.20.99.65:8080";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray100: "#F7F7F7",
  yellow: "#F7C94B",
  line: "#EEEEEE",
};

const SCREEN_PADDING = 22;
const MAX_PHOTO_COUNT = 5;

const categories = ["포카교환", "오프동행", "질문게시판", "자유게시판"];

const CATEGORY_BADGE_COLORS: Record<
  string,
  {
    backgroundColor: string;
    textColor: string;
  }
> = {
  포카교환: {
    backgroundColor: "#FFF5D6",
    textColor: "#B58900",
  },
  질문게시판: {
    backgroundColor: "#F1E8FF",
    textColor: "#7A4FD8",
  },
  오프동행: {
    backgroundColor: "#E7F6EA",
    textColor: "#3A8B4C",
  },
  자유게시판: {
    backgroundColor: "#FFEAF3",
    textColor: "#D64F8B",
  },
};

function getCategoryBadgeColor(category: string) {
  return (
    CATEGORY_BADGE_COLORS[category] ?? {
      backgroundColor: "#F2F2F2",
      textColor: "#666666",
    }
  );
}

function convertCategory(category: string): Exclude<CommunityCategory, "ALL"> {
  switch (category) {
    case "포카교환":
      return "PHOTO_EXCHANGE";
    case "오프동행":
      return "OFFLINE_COMPANION";
    case "질문게시판":
      return "QUESTION";
    case "자유게시판":
      return "FREE";
    default:
      return "FREE";
  }
}

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

  return `community-image-${index + 1}.jpg`;
}

async function uploadCommunityImage(imageUri: string, index: number) {
  const formData = new FormData();

  formData.append("image", {
    uri: imageUri,
    name: getImageFileName(imageUri, index),
    type: getImageMimeType(imageUri),
  } as any);

  /**
   * 현재 명세서에는 커뮤니티 전용 이미지 업로드 API가 따로 없어서
   * 기존 게시글 이미지 선업로드 API를 사용함.
   * 백엔드에 커뮤니티 전용 업로드 API가 생기면 아래 주소만 바꾸면 됨.
   */
  const response = await fetch(`${API_BASE_URL}/api/posts/upload-image`, {
    method: "POST",
    body: formData,
  });

  const responseText = await response.text();

  let data: any = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.log("커뮤니티 이미지 업로드 실패 status:", response.status);
    console.log("커뮤니티 이미지 업로드 실패 text:", responseText);

    throw new Error(data?.message ?? "사진 업로드에 실패했어요.");
  }

  if (!data?.imageUrl) {
    throw new Error("업로드된 이미지 주소를 받지 못했어요.");
  }

  return data.imageUrl as string;
}

export default function CommunityCreateScreen() {
  const [selectedCategory, setSelectedCategory] = useState("포카교환");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && !isSubmitting;

  const selectedCategoryColor = getCategoryBadgeColor(selectedCategory);

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

  const handleAddPhoto = async () => {
    if (imageUris.length >= MAX_PHOTO_COUNT) {
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
      selectionLimit: MAX_PHOTO_COUNT - imageUris.length,
    });

    if (result.canceled) return;

    const pickedUris = result.assets.map((asset) => asset.uri);

    setImageUris((prev) =>
      [...prev, ...pickedUris].slice(0, MAX_PHOTO_COUNT)
    );
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

      let uploadedImageUrls: string[] = [];

      if (imageUris.length > 0) {
        uploadedImageUrls = await Promise.all(
          imageUris.map((uri, index) => uploadCommunityImage(uri, index))
        );
      }

      console.log("커뮤니티 업로드 이미지 URL:", uploadedImageUrls);

      await createCommunityPost({
        category: convertCategory(selectedCategory),
        title: trimmedTitle,
        content: trimmedContent,
        imageUrls: uploadedImageUrls,
      });

      Alert.alert("등록 완료", "게시글이 등록되었습니다.", [
        {
          text: "확인",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.log("커뮤니티 게시글 등록 실패", error);

      const message =
        error instanceof Error
          ? error.message
          : "게시글 등록 중 오류가 발생했습니다.";

      Alert.alert("등록 실패", message);
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

          <Text style={styles.headerTitle}>글쓰기</Text>

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
              {isSubmitting ? "등록중" : "등록"}
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
          <View style={styles.section}>
            <Text style={styles.label}>카테고리</Text>

            <View style={styles.categoryRow}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                const categoryColor = getCategoryBadgeColor(category);

                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.categoryButton,
                      isSelected && {
                        backgroundColor: categoryColor.backgroundColor,
                        borderColor: categoryColor.backgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && {
                          color: categoryColor.textColor,
                          fontWeight: "900",
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>제목</Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력해주세요"
              placeholderTextColor={COLORS.gray400}
              style={styles.titleInput}
              maxLength={60}
              returnKeyType="next"
            />

            <Text style={styles.titleCount}>{title.length} / 60</Text>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>내용</Text>

              <View
                style={[
                  styles.selectedBadge,
                  { backgroundColor: selectedCategoryColor.backgroundColor },
                ]}
              >
                <Text
                  style={[
                    styles.selectedBadgeText,
                    { color: selectedCategoryColor.textColor },
                  ]}
                >
                  {selectedCategory}
                </Text>
              </View>
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="내용을 입력해주세요"
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
                <Text style={styles.photoTitle}>사진 추가</Text>
              </View>

              <Text style={styles.photoCount}>
                {imageUris.length} / {MAX_PHOTO_COUNT}
              </Text>
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
                <Ionicons name="add" size={30} color={COLORS.gray500} />
              </Pressable>

              {imageUris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.photoPreviewBox}>
                  <Image source={{ uri }} style={styles.photoPreviewImage} />

                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={13} color={COLORS.white} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
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
    height: 64,
    paddingHorizontal: SCREEN_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
  },

  headerSideButton: {
    width: 60,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  cancelText: {
    fontSize: 15,
    color: COLORS.gray500,
    fontWeight: "800",
  },

  headerTitle: {
    position: "absolute",
    left: 90,
    right: 90,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
  },

  submitButton: {
    minWidth: 56,
    height: 34,
    paddingHorizontal: 15,
    borderRadius: 17,
    backgroundColor: COLORS.yellow,
    justifyContent: "center",
    alignItems: "center",
  },

  submitButtonDisabled: {
    backgroundColor: "#E6E6E6",
  },

  submitText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
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

  section: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  label: {
    fontSize: 14,
    color: COLORS.gray900,
    fontWeight: "900",
    marginBottom: 14,
  },

  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },

  categoryButton: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.gray500,
  },

  titleInput: {
    minHeight: 34,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.black,
    padding: 0,
  },

  titleCount: {
    alignSelf: "flex-end",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray400,
  },

  contentSection: {
    minHeight: 270,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedBadge: {
    minHeight: 24,
    paddingHorizontal: 9,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  selectedBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  contentInput: {
    minHeight: 178,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.gray700,
    lineHeight: 24,
    padding: 0,
  },

  countText: {
    alignSelf: "flex-end",
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray400,
    marginTop: 10,
  },

  photoSection: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
  },

  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  photoTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.gray900,
  },

  photoCount: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.gray500,
  },

  photoRow: {
    flexDirection: "row",
    gap: 12,
    paddingRight: SCREEN_PADDING,
  },

  addPhotoBox: {
    width: 82,
    height: 82,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: "center",
    alignItems: "center",
  },

  photoPreviewBox: {
    width: 82,
    height: 82,
    borderRadius: 18,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#F2D77A",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },

  photoPreviewImage: {
    width: "100%",
    height: "100%",
  },

  removePhotoButton: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  pressed: {
    opacity: 0.75,
  },
});