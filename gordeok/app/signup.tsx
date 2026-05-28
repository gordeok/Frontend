// 회원가입 화면

import { useState } from "react";
import {
  Alert,
  Image,
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
import { signup } from "@/services/auth";

export default function SignupScreen() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (
      !nickname.trim() ||
      !email.trim() ||
      !password.trim() ||
      !passwordConfirm.trim()
    ) {
      Alert.alert("입력 확인", "모든 항목을 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert("입력 확인", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setIsLoading(true);

      const data = await signup({
        nickname: nickname.trim(),
        email: email.trim(),
        password,
        passwordConfirm,
      });

      console.log("회원가입 성공:", data);

      await AsyncStorage.setItem("userId", String(data.userId));
      await AsyncStorage.setItem("nickname", nickname.trim());

      const savedUserId = await AsyncStorage.getItem("userId");
      console.log("저장된 userId:", savedUserId);

      router.push("/onboarding/favorite-groups" as any);
    } catch (error: any) {
      Alert.alert(
        "회원가입 실패",
        error.message || "회원가입 중 오류가 발생했습니다."
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
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("@/assets/img/logo2.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.form}>
          <AppInput
            placeholder="닉네임"
            value={nickname}
            onChangeText={setNickname}
          />

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

          <AppInput
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
          />

          <AppButton
            title="가입하기"
            onPress={handleSignup}
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
    paddingTop: 200,
    paddingBottom: 80,
  },
  logo: {
    width: 150,
    height: 82,
    marginBottom: 30,
  },
  form: {
    width: "100%",
    gap: 18,
  },
});