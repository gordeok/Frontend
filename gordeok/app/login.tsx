// 로그인 화면

import { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppInput from "@/components/common/AppInput";
import AppButton from "@/components/common/AppButton";
import { login } from "@/services/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("입력 확인", "아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);

      const data = await login({
        email: email.trim(),
        password,
      });

      console.log("로그인 성공:", data);

      await AsyncStorage.setItem("userId", String(data.userId));

      if (data.nickname) {
        await AsyncStorage.setItem("nickname", data.nickname);
      }

      const savedUserId = await AsyncStorage.getItem("userId");
      console.log("저장된 userId:", savedUserId);

      router.replace("/home" as any);
    } catch (error: any) {
      Alert.alert(
        "로그인 실패",
        error.message || "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => Keyboard.dismiss()}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("@/assets/img/logo2.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.form}>
          <AppInput
            placeholder="아이디"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <AppInput
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AppButton
            title="로그인"
            onPress={handleLogin}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 220,
    paddingBottom: 80,
  },
  logo: {
    width: 155,
    height: 85,
    marginBottom: 65,
  },
  form: {
    width: "100%",
    gap: 20,
  },
});