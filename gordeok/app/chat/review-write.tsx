import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiRequest, getStoredUserId } from "../../utils/api";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray100: "#F8F8F8",
  yellow: "#F7C94B",
  yellowDisabled: "#E8D38E",
  line: "#EFEFEF",
};

const MAX_LENGTH = 1000;

export default function ReviewWriteScreen() {
  const {
    chatRoomId,
    role,
    title,
    status,
    targetUserId,
    reviewerId,
    sellerName,
  } = useLocalSearchParams<{
    chatRoomId?: string;
    role?: string;
    title?: string;
    status?: string;
    targetUserId?: string;
    reviewerId?: string;
    sellerName?: string;
  }>();

  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomTitle =
    typeof title === "string" && title.length > 0 ? title : "거래 채팅방";

  const sellerLabel =
    typeof sellerName === "string" && sellerName.length > 0
      ? sellerName
      : "판매자";

  const isValid = content.trim().length > 0 && !isSubmitting;

  const goBackToChatAsSubmitted = async (finalChatRoomId: number) => {
    await AsyncStorage.setItem(`REVIEW_SUBMITTED_${finalChatRoomId}`, "true");
    await AsyncStorage.setItem(`TRADE_STATUS_${finalChatRoomId}`, "거래 완료");

    router.replace({
      pathname: "/chat/[chatRoomId]",
      params: {
        chatRoomId: String(finalChatRoomId),
        role: typeof role === "string" ? role : "buyer",
        title: roomTitle,
        status: "거래 완료",
        reviewSubmitted: "true",
        reviewSubmittedChatRoomId: String(finalChatRoomId),
      },
    } as any);
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    const trimmedContent = content.trim();
    const storedUserId = await getStoredUserId();

    const finalReviewerId = Number(reviewerId || storedUserId);
    const finalTargetUserId = Number(targetUserId);
    const finalChatRoomId = Number(chatRoomId);

    if (!finalReviewerId || Number.isNaN(finalReviewerId)) {
      Alert.alert("오류", "작성자 정보를 찾지 못했어요.");
      return;
    }

    if (!finalTargetUserId || Number.isNaN(finalTargetUserId)) {
      Alert.alert(
        "오류",
        "후기 대상 판매자 정보를 찾지 못했어요. 채팅방에서 다시 들어와주세요.",
      );
      return;
    }

    if (!finalChatRoomId || Number.isNaN(finalChatRoomId)) {
      Alert.alert("오류", "채팅방 정보를 찾지 못했어요.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest("/api/reviews", {
        method: "POST",
        body: {
          reviewerId: finalReviewerId,
          targetUserId: finalTargetUserId,
          chatRoomId: finalChatRoomId,
          rating: 5,
          content: trimmedContent,
        } as any,
      });

      Alert.alert("등록 완료", "거래 후기가 등록되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            goBackToChatAsSubmitted(finalChatRoomId);
          },
        },
      ]);
    } catch (error: any) {
      const message = String(error?.message ?? "");

      if (
        message.includes("409") ||
        message.includes("중복") ||
        message.includes("이미")
      ) {
        Alert.alert("알림", "이미 후기를 작성한 거래예요.", [
          {
            text: "확인",
            onPress: () => {
              goBackToChatAsSubmitted(finalChatRoomId);
            },
          },
        ]);

        return;
      }

      console.log("후기 등록 실패:", error);
      Alert.alert("등록 실패", "거래 후기 등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.screen}
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

          <Text style={styles.headerTitle}>거래 후기 작성</Text>

          <TouchableOpacity
            style={[
              styles.submitButton,
              !isValid && styles.submitButtonDisabled,
            ]}
            activeOpacity={isValid ? 0.8 : 1}
            disabled={!isValid}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "등록중" : "등록"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.tradeBox}>
            <Text style={styles.tradeLabel}>거래 상품</Text>
            <Text style={styles.tradeTitle} numberOfLines={1}>
              {roomTitle}
            </Text>

            <Text style={styles.sellerText} numberOfLines={1}>
              후기 대상 · {sellerLabel}
            </Text>
          </View>

          <Text style={styles.label}>후기 내용</Text>

          <View style={styles.textAreaBox}>
            <TextInput
              style={styles.textArea}
              value={content}
              editable={!isSubmitting}
              onChangeText={(value) => {
                if (value.length <= MAX_LENGTH) {
                  setContent(value);
                }
              }}
              placeholder={
                isFocused ? "" : "상대방에게 남길 후기를 작성해주세요."
              }
              placeholderTextColor={COLORS.gray400}
              multiline
              textAlignVertical="top"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {content.length} / {MAX_LENGTH}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    height: 58,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
  },
  submitButton: {
    width: 58,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#FFE8A6",
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  tradeBox: {
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 24,
  },
  tradeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray500,
    marginBottom: 5,
  },
  tradeTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
  },
  sellerText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.gray700,
    marginBottom: 12,
  },
  textAreaBox: {
    minHeight: 230,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 200,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    color: COLORS.black,
    padding: 0,
  },
  countRow: {
    height: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  countText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray400,
  },
});
