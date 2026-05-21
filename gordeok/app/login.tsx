// 로그인 화면

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AppInput from "@/components/common/AppInput";
import AppButton from "@/components/common/AppButton";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>로고</Text>

      <View style={styles.form}>
        <AppInput placeholder="아이디" />
        <AppInput placeholder="비밀번호" secureTextEntry />

        <AppButton title="로그인" onPress={() => router.replace("/home" as any)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 190,
  },
  logo: {
    fontSize: 28,
    fontFamily: "NotoSansKRBold",
    marginBottom: 90,
  },
  form: {
    width: "100%",
    gap: 20,
  },
});