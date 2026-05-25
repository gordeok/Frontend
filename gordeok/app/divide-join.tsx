// 분철 참여글 작성 화면

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { selectMemberItem } from "../services/chat";

const COMPLETED_MEMBER_STORAGE_KEY = "GO_REUDEOK_COMPLETED_MEMBER_ITEMS";
const CHAT_ROOMS_STORAGE_KEY = "GO_REUDEOK_CHAT_ROOMS";

export default function DivideJoin() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const postId = typeof params.postId === "string" ? params.postId : "";
  const memberItemId =
    typeof params.memberItemId === "string" ? params.memberItemId : "";

  const selectedMember =
    typeof params.selectedMember === "string" ? params.selectedMember : "";
  const selectedPrice =
    typeof params.selectedPrice === "string" ? params.selectedPrice : "";

  const postData = typeof params.postData === "string" ? params.postData : "";

  const parsedPost = useMemo(() => {
    if (!postData) return null;

    try {
      return JSON.parse(postData);
    } catch {
      return null;
    }
  }, [postData]);

  const postTitle =
    parsedPost?.title ??
    parsedPost?.postTitle ??
    parsedPost?.name ??
    "분철 채팅방";

  const sellerName =
    parsedPost?.userName ??
    parsedPost?.sellerName ??
    parsedPost?.nickname ??
    parsedPost?.authorName ??
    "판매자";

  const thumbnail =
    parsedPost?.image ??
    parsedPost?.imageUrl ??
    parsedPost?.thumbnail ??
    parsedPost?.thumbnailUrl ??
    "";

  const [receiverName, setReceiverName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [requestText, setRequestText] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const formatPhoneNumber = (text: string) => {
    const onlyNumber = text.replace(/[^0-9]/g, "");

    if (onlyNumber.length <= 3) {
      return onlyNumber;
    }

    if (onlyNumber.length <= 7) {
      return `${onlyNumber.slice(0, 3)}-${onlyNumber.slice(3)}`;
    }

    return `${onlyNumber.slice(0, 3)}-${onlyNumber.slice(
      3,
      7
    )}-${onlyNumber.slice(7, 11)}`;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const phoneDigits = useMemo(() => {
    return phoneNumber.replace(/[^0-9]/g, "");
  }, [phoneNumber]);

  const isButtonActive =
    receiverName.trim().length > 0 &&
    phoneDigits.length >= 10 &&
    phoneDigits.length <= 11 &&
    storeName.trim().length > 0 &&
    !isSubmitting;

  const getChatRoomIdFromResponse = (response: any) => {
    return (
      response?.chatRoomId ??
      response?.chatroomId ??
      response?.chatRoomID ??
      response?.roomId ??
      response?.id ??
      response?.data?.chatRoomId ??
      response?.data?.chatroomId ??
      response?.data?.chatRoomID ??
      response?.data?.roomId ??
      response?.data?.id ??
      response?.result?.chatRoomId ??
      response?.result?.chatroomId ??
      response?.result?.chatRoomID ??
      response?.result?.roomId ??
      response?.result?.id ??
      response?.data?.result?.chatRoomId ??
      response?.data?.result?.chatroomId ??
      response?.data?.result?.chatRoomID ??
      response?.data?.result?.roomId ??
      response?.data?.result?.id
    );
  };

  const saveCompletedMember = async () => {
    try {
      if (!postId || !memberItemId) return;

      const saved = await AsyncStorage.getItem(COMPLETED_MEMBER_STORAGE_KEY);
      const prev = saved ? JSON.parse(saved) : [];

      const prevList = Array.isArray(prev) ? prev : [];

      const newItem = {
        postId: String(postId),
        memberItemId: String(memberItemId),
        selectedMember,
        completedAt: new Date().toISOString(),
      };

      const filtered = prevList.filter((item: any) => {
        return !(
          String(item.postId) === String(postId) &&
          String(item.memberItemId) === String(memberItemId)
        );
      });

      await AsyncStorage.setItem(
        COMPLETED_MEMBER_STORAGE_KEY,
        JSON.stringify([newItem, ...filtered])
      );
    } catch (error) {
      console.log("모집완료 상태 저장 실패:", error);
    }
  };

  const isAlreadyCompletedMember = async () => {
    try {
      const saved = await AsyncStorage.getItem(COMPLETED_MEMBER_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) return false;

      return parsed.some((item: any) => {
        const samePost = String(item.postId) === String(postId);
        const sameMemberItem =
          String(item.memberItemId) === String(memberItemId);
        const sameMemberName =
          selectedMember &&
          item.selectedMember &&
          String(item.selectedMember) === String(selectedMember);

        return samePost && (sameMemberItem || sameMemberName);
      });
    } catch (error) {
      console.log("참여완료 여부 확인 실패:", error);
      return false;
    }
  };

  const saveChatRoomToList = async (chatRoomId: string) => {
    try {
      const newRoom = {
        id: String(chatRoomId),
        chatRoomId: String(chatRoomId),

        roomName: postTitle,
        title: postTitle,
        postTitle,

        opponentName: sellerName,
        sellerName,
        buyerName: receiverName.trim() || "나",

        role: "BUYER",
        type: "GROUP",
        status: "progress",

        postId: String(postId),
        memberItemId: String(memberItemId),

        selectedMember,
        selectedPrice,

        receiverName: receiverName.trim(),
        phoneNumber: phoneNumber.trim(),
        storeName: storeName.trim(),
        requestText: requestText.trim(),

        thumbnail,

        lastMessage: "채팅방에 입장했습니다.",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };

      const saved = await AsyncStorage.getItem(CHAT_ROOMS_STORAGE_KEY);
      const prevRooms = saved ? JSON.parse(saved) : [];

      const prevList = Array.isArray(prevRooms) ? prevRooms : [];

      const filteredRooms = prevList.filter((room: any) => {
        const savedId = String(room.chatRoomId ?? room.id);
        const sameRoom = savedId === String(chatRoomId);

        const sameMember =
          String(room.postId) === String(postId) &&
          String(room.memberItemId) === String(memberItemId);

        return !sameRoom && !sameMember;
      });

      const nextRooms = [newRoom, ...filteredRooms];

      await AsyncStorage.setItem(
        CHAT_ROOMS_STORAGE_KEY,
        JSON.stringify(nextRooms)
      );
    } catch (error) {
      console.log("채팅방 목록 저장 실패:", error);
    }
  };

  const findSavedChatRoomId = async () => {
    try {
      const saved = await AsyncStorage.getItem(CHAT_ROOMS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) return null;

      const targetRoom = parsed.find((room: any) => {
        const samePost = String(room.postId) === String(postId);
        const sameMemberItem =
          String(room.memberItemId) === String(memberItemId);
        const sameMemberName =
          selectedMember &&
          room.selectedMember &&
          String(room.selectedMember) === String(selectedMember);

        return samePost && (sameMemberItem || sameMemberName);
      });

      return targetRoom?.chatRoomId ?? targetRoom?.id ?? null;
    } catch (error) {
      console.log("저장된 채팅방 찾기 실패:", error);
      return null;
    }
  };

  const goToChatRoom = (chatRoomId: string) => {
    router.replace({
      pathname: "/chat/[chatRoomId]",
      params: {
        chatRoomId: String(chatRoomId),

        type: "divide",
        role: "BUYER",

        postId: String(postId),
        memberItemId: String(memberItemId),

        title: postTitle,
        roomName: postTitle,

        sellerName,
        opponentName: sellerName,
        buyerName: receiverName.trim() || "나",

        selectedMember,
        selectedPrice,

        receiverName: receiverName.trim(),
        phoneNumber: phoneNumber.trim(),
        storeName: storeName.trim(),
        requestText: requestText.trim(),

        status: "모집 중",
        reviewSubmitted: "false",
      },
    } as any);
  };

  const handleAlreadyJoined = async () => {
    await saveCompletedMember();

    const savedChatRoomId = await findSavedChatRoomId();

    if (savedChatRoomId) {
      goToChatRoom(String(savedChatRoomId));
      return;
    }

    Alert.alert(
      "이미 참여한 멤버입니다",
      "이 멤버는 이미 참여글이 작성되어 있어요. 채팅 목록에서 해당 채팅방을 확인해 주세요.",
      [
        {
          text: "확인",
          onPress: () => {
            router.replace("/(tabs)/chats");
          },
        },
      ]
    );
  };

  const handleEnterChat = async () => {
    if (!isButtonActive) return;

    try {
      setIsSubmitting(true);

      if (!postId || !memberItemId) {
        Alert.alert("입력 오류", "게시글 또는 멤버 정보가 없습니다.");
        return;
      }

      const alreadyCompleted = await isAlreadyCompletedMember();

      if (alreadyCompleted) {
        await handleAlreadyJoined();
        return;
      }

      const response = await selectMemberItem(memberItemId, {
        recipientName: receiverName.trim(),
        phoneNumber: phoneNumber.trim(),
        convenienceStore: storeName.trim(),
        request: requestText.trim(),
      });

      console.log("멤버 선택 완료 + 채팅방 생성 성공:", response);

      const chatRoomId = getChatRoomIdFromResponse(response);

      console.log("찾은 chatRoomId:", chatRoomId);

      await saveCompletedMember();

      if (!chatRoomId) {
        Alert.alert(
          "채팅방 정보 없음",
          "참여글은 작성됐어요. 채팅방 ID가 아직 응답에 없어서 채팅 목록에서 확인해 주세요.",
          [
            {
              text: "확인",
              onPress: () => {
                router.replace("/(tabs)/chats");
              },
            },
          ]
        );
        return;
      }

      await saveChatRoomToList(String(chatRoomId));

      goToChatRoom(String(chatRoomId));
    } catch (error: any) {
      console.log("참여글 작성 실패:", error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "";

      const normalizedErrorMessage = String(errorMessage).replace(/\s/g, "");

      if (
        normalizedErrorMessage.includes("이미참여글이작성된멤버") ||
        normalizedErrorMessage.includes("이미참여") ||
        normalizedErrorMessage.includes("작성된멤버") ||
        normalizedErrorMessage.includes("중복")
      ) {
        await handleAlreadyJoined();
        return;
      }

      Alert.alert(
        "참여글 작성 실패",
        errorMessage || "참여글 작성 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={26} color="#222222" />
          </Pressable>

          <Text style={styles.headerTitle}>분철 참여글 작성</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && styles.scrollContentKeyboard,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {(selectedMember || selectedPrice) && (
            <View style={styles.selectedBox}>
              <View>
                <Text style={styles.selectedLabel}>선택한 멤버</Text>
                <Text style={styles.selectedMember}>
                  {selectedMember || "멤버 정보 없음"}
                </Text>
              </View>

              {selectedPrice ? (
                <Text style={styles.selectedPrice}>
                  ₩{Number(selectedPrice).toLocaleString()}
                </Text>
              ) : null}
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>받으시는 분 *</Text>
            <TextInput
              style={styles.input}
              placeholder="실명으로 입력해 주세요."
              placeholderTextColor="#AFAFAF"
              value={receiverName}
              onChangeText={setReceiverName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>전화번호 *</Text>
            <TextInput
              style={styles.input}
              placeholder="010-0000-0000"
              placeholderTextColor="#AFAFAF"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              maxLength={13}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.formGroup}>
            <Text style={styles.label}>편의점 지점명 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예시) GS25 숙대입구점"
              placeholderTextColor="#AFAFAF"
              value={storeName}
              onChangeText={setStoreName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.formGroup}>
            <Text style={styles.label}>요청사항</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="판매자에게 원하는 요청 사항을 적어 주세요."
              placeholderTextColor="#AFAFAF"
              multiline
              textAlignVertical="top"
              value={requestText}
              onChangeText={setRequestText}
            />
          </View>
        </ScrollView>

        {!isKeyboardVisible && (
          <View style={styles.bottomArea}>
            <Text style={styles.notice}>
              잘못된 정보 입력으로 인한 책임은 작성자 본인에게 있습니다.{"\n"}
              다시 한 번 작성한 정보를 확인해주시기 바랍니다.
            </Text>

            <Pressable
              disabled={!isButtonActive}
              style={[
                styles.joinButton,
                !isButtonActive && styles.joinButtonDisabled,
              ]}
              onPress={handleEnterChat}
            >
              <Text style={styles.joinButtonText}>
                {isSubmitting ? "입장 중..." : "채팅방 입장"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const YELLOW = "#F7C94B";

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },

  headerRight: {
    width: 36,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 145,
  },

  scrollContentKeyboard: {
    paddingBottom: 40,
  },

  selectedBox: {
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: "#FFF8DD",
    borderWidth: 1,
    borderColor: "#F8E2A0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999999",
    marginBottom: 4,
  },

  selectedMember: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111111",
  },

  selectedPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
  },

  formGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#202633",
    marginBottom: 10,
  },

  input: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111111",
  },

  textArea: {
    height: 120,
    paddingTop: 14,
    paddingBottom: 14,
  },

  divider: {
    height: 1,
    backgroundColor: "#F2EDE6",
    marginBottom: 20,
  },

  bottomArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },

  notice: {
    fontSize: 11,
    lineHeight: 16,
    color: "#999999",
    textAlign: "center",
    marginBottom: 10,
  },

  joinButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },

  joinButtonDisabled: {
    opacity: 0.45,
  },

  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
});