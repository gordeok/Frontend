import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AppButton from "@/components/common/AppButton";
import { COLORS } from "@/constants/theme";

export default function StartScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>고르덕{"\n"}로고</Text>

      <View style={styles.buttonBox}>
        <AppButton
          title="회원가입"
          onPress={() => router.push("/signup")}
        />

        <AppButton
          title="로그인"
          onPress={() => router.push("/login")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  logo: {
    fontSize: 44,
    fontFamily: "NotoSansKRExtraBold",
    color: COLORS.black,
    lineHeight: 56,
    marginBottom: 80,
    textAlign: "center",
  },

  buttonBox: {
    width: "100%",
    gap: 16,
  },
});