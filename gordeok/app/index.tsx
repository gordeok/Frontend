// 서비스 시작 화면

import { View, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AppButton from "@/components/common/AppButton";
import { COLORS } from "@/constants/theme";

export default function StartScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/img/logo1.png")}
        style={styles.logo}
        resizeMode="contain"
      />

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
    width: 180,
    height: 180,
    marginBottom: 20,
  },

  buttonBox: {
    width: "100%",
    gap: 16,
  },
});