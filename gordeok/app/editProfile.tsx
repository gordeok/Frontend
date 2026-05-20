import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState("범규와이프");

  const handleSave = () => {
    Alert.alert("저장 완료", "프로필이 수정되었습니다.");
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>프로필 수정</Text>

        <View style={styles.headerRight} />
      </View>

      {/* 프로필 사진 변경 박스 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>프로필 사진 변경</Text>

        <View style={styles.profileArea}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>범</Text>

            <TouchableOpacity
              style={styles.cameraBadge}
              activeOpacity={0.7}
              onPress={() => {
                console.log("사진 선택");
              }}
            >
              <Ionicons name="image" size={11} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 닉네임 박스 */}
      <View style={styles.nicknameCard}>
        <Text style={styles.label}>닉네임</Text>

        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임을 입력하세요"
          placeholderTextColor="#B5B5B5"
        />
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>저장하기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const YELLOW = "#EFD46D";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111111",
  },

  headerRight: {
    width: 40,
  },

  card: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 26,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#F3F3F3",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#777777",
    marginBottom: 12,
  },

  profileArea: {
    alignItems: "center",
    justifyContent: "center",
  },

  profileCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  profileText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2B2B2B",
  },

  cameraBadge: {
    position: "absolute",
    right: 6,
    bottom: 7,
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },

  nicknameCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F3F3F3",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#777777",
    marginBottom: 10,
  },

  input: {
    height: 42,
    borderWidth: 1,
    borderColor: "#E4E0D8",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  saveButton: {
    marginTop: 44,
    height: 54,
    borderRadius: 15,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D8B94B",
  },

  saveText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});