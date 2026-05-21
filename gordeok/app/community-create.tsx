import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray100: "#F7F7F7",
  yellow: "#F7C94B",
  line: "#EEEEEE",
};

const SCREEN_PADDING = 22;
const STORAGE_KEY = "communityPosts";

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

type CommunityPost = {
  id: string;
  category: string;
  name: string;
  profileText: string;
  profileColor: string;
  time: string;
  createdAt: number;
  title: string;
  content: string;
  likes: number;
  comments: number;
  views: number;
  photoCount: number;
};

type CreateCommunityPostPayload = {
  category: string;
  title: string;
  content: string;
  photoCount: number;
};

function getCategoryBadgeColor(category: string) {
  return (
    CATEGORY_BADGE_COLORS[category] ?? {
      backgroundColor: "#F2F2F2",
      textColor: "#666666",
    }
  );
}

function createCommunityPost(payload: CreateCommunityPostPayload): CommunityPost {
  return {
    id: String(Date.now()),
    category: payload.category,
    name: "범규와이프",
    profileText: "범",
    profileColor: "#FFF1C6",
    time: "방금 전",
    createdAt: Date.now(),
    title: payload.title,
    content: payload.content,
    likes: 0,
    comments: 0,
    views: 0,
    photoCount: payload.photoCount,
  };
}

export default function CommunityCreateScreen() {
  const [selectedCategory, setSelectedCategory] = useState("포카교환");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;
  const selectedCategoryColor = getCategoryBadgeColor(selectedCategory);

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

      const newPost = createCommunityPost({
        category: selectedCategory,
        title: trimmedTitle,
        content: trimmedContent,
        photoCount,
      });

      const savedPosts = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedPosts: CommunityPost[] = savedPosts
        ? JSON.parse(savedPosts)
        : [];

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([newPost, ...parsedPosts])
      );

      Alert.alert("등록 완료", "게시글이 등록되었습니다.", [
        {
          text: "확인",
          onPress: () => router.back(),
        },
      ]);

      /*
        나중에 백엔드 연동 시 여기만 교체하면 됨.

        await fetch("백엔드주소/community", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: selectedCategory,
            title: trimmedTitle,
            content: trimmedContent,
            photoCount,
          }),
        });
      */
    } catch (error) {
      Alert.alert("오류", "게시글 등록 중 문제가 발생했어요.");
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
              등록
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

              <Text style={styles.photoCount}>{photoCount} / 5</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              <Pressable onPress={handleAddPhoto} style={styles.addPhotoBox}>
                <Ionicons name="add" size={30} color={COLORS.gray500} />
              </Pressable>

              {Array.from({ length: photoCount }).map((_, index) => (
                <Pressable
                  key={index}
                  style={styles.photoPreviewBox}
                  onPress={handleRemovePhoto}
                >
                  <Text style={styles.photoPreviewText}>{index + 1}</Text>

                  <View style={styles.removePhotoButton}>
                    <Ionicons name="close" size={13} color={COLORS.white} />
                  </View>
                </Pressable>
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
  },

  photoPreviewText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#B58900",
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

});