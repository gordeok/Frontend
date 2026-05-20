import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [nickname, setNickname] = useState("범규와이프");

  const handleSave = () => {
    Alert.alert("저장 완료", "프로필이 수정되었습니다.", [
      {
        text: "확인",
        style: "default",
      },
    ]);
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>프로필 사진</Text>

          <View style={styles.profileArea}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileText}>범</Text>

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
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>저장하기</Text>
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

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 16,
  },

  profileArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },

  profileCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  profileText: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.black,
  },

  cameraBadge: {
    position: "absolute",
    right: 3,
    bottom: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
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

  saveButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
  },
});