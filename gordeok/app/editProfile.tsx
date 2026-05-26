import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyProfile } from "../services/user";

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedNickname = await AsyncStorage.getItem("nickname");

        if (savedNickname) {
          setNickname(savedNickname);
          return;
        }

        const profile = await getMyProfile();
        setNickname(profile.nickname || "");
      } catch (error) {
        console.log("프로필 정보 조회 실패:", error);
        setNickname("");
      }
    };

    loadProfile();
  }, []);

  const profileText = nickname.trim()?.[0] || "덕";

  const handleSave = async () => {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      Alert.alert("알림", "닉네임을 입력해주세요.");
      return;
    }

    if (isSaving) return;

    try {
      setIsSaving(true);

      await AsyncStorage.setItem("nickname", trimmedNickname);

      setNickname(trimmedNickname);

      Alert.alert("저장 완료", "프로필이 수정되었습니다.", [
        {
          text: "확인",
          style: "default",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.log("프로필 저장 실패:", error);
      Alert.alert("저장 실패", "프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

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
            <View style={styles.profileCircle}>
              <Text style={styles.profileText}>{profileText}</Text>

              <Pressable
                style={({ pressed, hovered }) => [
                  styles.cameraBadge,
                  (pressed || hovered) && styles.cameraBadgeHover,
                ]}
                onPress={() => {
                  console.log("사진 선택");
                }}
              >
                <Ionicons name="image" size={13} color={COLORS.white} />
              </Pressable>
            </View>
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
            isSaving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "저장 중" : "저장하기"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

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
  },

  profileCircle: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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

  cameraBadgeHover: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
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