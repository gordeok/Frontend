// 분철 참여글 작성 화면

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createParticipation } from "../services/post";
import { getMyProfile } from "../services/user";

const COMPLETED_MEMBER_STORAGE_KEY = "GO_REUDEOK_COMPLETED_MEMBER_ITEMS";

type LocalChatRoom = {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  status?: string;
  role?: string;
  sellerName?: string;
  buyerName?: string;
  selectedMember?: string;
  memberItemId?: string;
  completedMemberCount?: number;
  totalMemberCount?: number;
  allMembersCompleted?: boolean;
};

export default function DivideJoin() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView | null>(null);

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
    parsedPost?.seller?.nickname ??
    "판매자";

  const thumbnail =
    parsedPost?.thumbnailUrl ??
    parsedPost?.thumbnail ??
    parsedPost?.imageUrl ??
    "";

  const [myNickname, setMyNickname] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [requestText, setRequestText] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToRequestInput = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  useEffect(() => {
    const loadMyProfile = async () => {
      try {
        const profile = await getMyProfile();
        setMyNickname(profile.nickname ?? "");
      } catch (error) {
        console.log("내 프로필 조회 실패:", error);
      }
    };

    loadMyProfile();
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
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
      7,
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
      response?.result?.id
    );
  };

  const getTotalMemberCount = () => {
    const memberItems = parsedPost?.memberItems;
    const members = parsedPost?.members;

    if (Array.isArray(memberItems)) return memberItems.length;
    if (Array.isArray(members)) return members.length;

    return selectedMember ? 1 : 0;
  };

  const saveCompletedMemberItem = async () => {
    try {
      const saved = await AsyncStorage.getItem(COMPLETED_MEMBER_STORAGE_KEY);
      const previous = saved ? JSON.parse(saved) : [];

      const nextItem = {
        postId: String(postId),
        memberItemId: String(memberItemId),
        selectedMember,
        completedAt: new Date().toISOString(),
      };

      const filtered = Array.isArray(previous)
        ? previous.filter((item) => {
            const samePost = String(item?.postId) === String(postId);
            const sameMemberItemId =
              String(item?.memberItemId) === String(memberItemId);
            const sameMemberName =
              !!item?.selectedMember &&
              !!selectedMember &&
              String(item.selectedMember).trim() === selectedMember.trim();

            return !(samePost && (sameMemberItemId || sameMemberName));
          })
        : [];

      await AsyncStorage.setItem(
        COMPLETED_MEMBER_STORAGE_KEY,
        JSON.stringify([nextItem, ...filtered]),
      );
    } catch (error) {
      console.log("모집완료 상태 저장 실패:", error);
    }
  };

  const saveChatRoomToList = async (chatRoomId: string) => {
    try {
      const raw = await AsyncStorage.getItem("localChatRooms");
      const previousRooms: LocalChatRoom[] = raw ? JSON.parse(raw) : [];

      const totalMemberCount = getTotalMemberCount();
      const completedMemberCount = Math.min(1, totalMemberCount);
      const allMembersCompleted =
        totalMemberCount > 0 && completedMemberCount >= totalMemberCount;

      const nextRoom: LocalChatRoom = {
        id: String(chatRoomId),
        title: postTitle,
        lastMessage: "분철 참여글을 작성했어요.",
        time: "방금",
        unreadCount: 0,
        status: allMembersCompleted ? "모집 완료" : "모집 중",
        role: "buyer",
        sellerName,
        buyerName: myNickname || "",
        selectedMember,
        memberItemId: String(memberItemId),
        completedMemberCount,
        totalMemberCount,
        allMembersCompleted,
      };

      const filteredRooms = previousRooms.filter(
        (room) => String(room.id) !== String(chatRoomId),
      );

      await AsyncStorage.setItem(
        "localChatRooms",
        JSON.stringify([nextRoom, ...filteredRooms]),
      );
    } catch (error) {
      console.log("로컬 채팅방 저장 실패:", error);
    }
  };

  const handleEnterChat = async () => {
    if (!isButtonActive) return;

    if (!postId || !memberItemId) {
      Alert.alert("입력 오류", "게시글 또는 멤버 정보가 없습니다.");
      return;
    }

    try {
      setIsSubmitting(true);

      const body = {
        realName: receiverName.trim(),
        phoneNumber: phoneNumber.trim(),
        storeName: storeName.trim(),
        requestMessage: requestText.trim(),
      };

      console.log("참여글 작성 요청값:", {
        postId,
        memberItemId,
        body,
      });

      const response = await createParticipation(postId, memberItemId, body);

      console.log("참여글 작성 성공:", response);

      const chatRoomId = getChatRoomIdFromResponse(response);

      if (!chatRoomId) {
        Alert.alert(
          "채팅방 입장 실패",
          "참여글은 작성됐지만 채팅방 정보를 받지 못했습니다.",
        );
        return;
      }

      // chatRoomId → postId 매핑 저장
      try {
        const raw = await AsyncStorage.getItem("GO_REUDEOK_CHATROOM_POST_MAP");
        const mapData = raw ? JSON.parse(raw) : {};
        mapData[String(chatRoomId)] = String(postId);
        await AsyncStorage.setItem("GO_REUDEOK_CHATROOM_POST_MAP", JSON.stringify(mapData));
      } catch {}

      await saveCompletedMemberItem();
      await saveChatRoomToList(String(chatRoomId));

      router.replace({
        pathname: "/chat/[chatRoomId]",
        params: {
          chatRoomId: String(chatRoomId),
          role: "BUYER",

          postId: String(postId),
          memberItemId: String(memberItemId),

          title: postTitle,
          sellerName,
          opponentName: sellerName,

          buyerName: myNickname,
          myNickname,
          currentUserNickname: myNickname,

          selectedMember,
          selectedPrice,

          receiverName: receiverName.trim(),
          phoneNumber: phoneNumber.trim(),
          storeName: storeName.trim(),
          requestText: requestText.trim(),
          requestMessage: requestText.trim(),

          thumbnail,
          status: "모집 중",
          reviewSubmitted: "false",
        },
      } as any);
    } catch (error: any) {
      console.log("참여글 작성 실패:", error);

      Alert.alert(
        "참여글 작성 실패",
        error?.message || "참여글 작성 중 오류가 발생했습니다.",
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

        <KeyboardAvoidingView
          style={styles.contentAvoider}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              isKeyboardVisible && styles.scrollContentKeyboard,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            onScrollBeginDrag={Keyboard.dismiss}
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
                placeholder="배송 방법 확인 후 작성해주세요."
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
                onFocus={scrollToRequestInput}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

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

  contentAvoider: {
    flex: 1,
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
    paddingBottom: 150,
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
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },

  notice: {
    fontSize: 11,
    lineHeight: 15,
    color: "#999999",
    textAlign: "center",
    marginBottom: 10,
  },

  joinButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },

  joinButtonDisabled: {
    opacity: 0.45,
  },

  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
});
