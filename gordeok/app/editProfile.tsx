// 마이페이지 - 프로필 수정 화면

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyProfile, updateProfile, uploadProfileImage } from "../services/user";

const DEFAULT_PROFILE = require("../assets/img/profile.jpg");

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://frostily-derby-underpass.ngrok-free.dev";

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

function getProfileImageUrl(profile: any) {
  return normalizeImageUrl(
    profile?.profileImage ||
      profile?.profileImageUrl ||
      profile?.profileImageURL ||
      profile?.profileImg ||
      profile?.userProfileImage ||
      profile?.authorProfileImage ||
      profile?.sellerProfileImage ||
      profile?.imageUrl ||
      profile?.image ||
      profile?.photoUrl ||
      profile?.thumbnailUrl
  );
}

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray300: "#DDDDDD",
  gray100: "#F6F6F6",
  yellow: "#F7C94B",
  lightYellow: "#FFF4CC",
  line: "#F2EDE6",
};

export default function EditProfileScreen() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [pendingLocalUri, setPendingLocalUri] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedNickname = await AsyncStorage.getItem("nickname");
        const profile = await getMyProfile();

        console.log("프로필 수정 화면 응답:", profile);
        console.log("프로필 수정 화면 이미지:", getProfileImageUrl(profile));

        setNickname(savedNickname || profile?.nickname || "");
        setProfileImage(getProfileImageUrl(profile));
      } catch (error) {
        console.log("프로필 정보 조회 실패:", error);
        setNickname("");
        setProfileImage("");
      }
    };

    loadProfile();
  }, []);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한이 필요해요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const localUri = result.assets[0].uri;

    // 선택한 이미지를 로컬 미리보기로 먼저 보여줌
    setPendingLocalUri(localUri);

    // 서버에 업로드
    setIsUploading(true);

    try {
      const uploadedUrl = await uploadProfileImage(localUri);

      if (uploadedUrl) {
        setProfileImage(uploadedUrl);
        setPendingLocalUri("");
        console.log("프로필 이미지 업로드 성공:", uploadedUrl);
      } else {
        throw new Error("업로드된 URL이 없어요.");
      }
    } catch (error: any) {
      console.log("프로필 이미지 업로드 실패:", error);
      setPendingLocalUri("");
      Alert.alert("업로드 실패", error?.message || "이미지 업로드에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      Alert.alert("알림", "닉네임을 입력해주세요.");
      return;
    }

    if (isSaving || isUploading) return;

    try {
      setIsSaving(true);

      // 백엔드 프로필 업데이트
      await updateProfile({
        nickname: trimmedNickname,
        ...(profileImage ? { profileImage } : {}),
      });

      await AsyncStorage.setItem("nickname", trimmedNickname);

      Alert.alert("저장 완료", "프로필이 수정되었습니다.", [
        {
          text: "확인",
          style: "default",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.log("프로필 저장 실패:", error);
      Alert.alert("저장 실패", error?.message || "프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 미리보기: 업로드 중이면 로컬 URI, 아니면 서버 URL
  const displayImage = pendingLocalUri || profileImage;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.headerIcon,
              (pressed || hovered) && styles.headerIconHover,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </Pressable>

          <Text style={styles.headerTitle}>프로필 수정</Text>

          <View style={styles.headerIcon} />
        </View>

        <View style={[styles.card, styles.profileCard]}>
          <Text style={styles.sectionTitle}>프로필 사진</Text>

          <View style={styles.profileArea}>
            <Pressable
              style={({ pressed }) => [
                styles.profileCircle,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handlePickImage}
              disabled={isUploading}
            >
              <Image
                key={displayImage || "default"}
                source={displayImage ? { uri: displayImage } : DEFAULT_PROFILE}
                style={styles.profileImageFill}
                resizeMode="cover"
              />

              <View style={styles.cameraBadge}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="image" size={13} color={COLORS.white} />
                )}
              </View>
            </Pressable>

            {isUploading && (
              <Text style={styles.uploadingText}>업로드 중...</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>닉네임</Text>

          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor={COLORS.gray500}
          />
        </View>

        <Pressable
          style={({ pressed, hovered }) => [
            styles.saveButton,
            (pressed || hovered) && styles.saveButtonHover,
            (isSaving || isUploading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving || isUploading}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "저장 중..." : "저장하기"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const PROFILE_SIZE = 84;
const PROFILE_RADIUS = 18;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerIconHover: {
    opacity: 0.55,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  profileCard: {
    paddingBottom: 28,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 18,
  },

  profileArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingBottom: 8,
    gap: 10,
  },

  profileCircle: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_RADIUS,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  profileImageFill: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_RADIUS,
  },

  profileText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4B5563",
  },

  cameraBadge: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: COLORS.black,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  uploadingText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray900,
    backgroundColor: COLORS.gray100,
  },

  saveButton: {
    height: 58,
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },

  saveButtonHover: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
  },
});
