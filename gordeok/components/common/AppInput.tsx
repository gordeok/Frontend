// 공통 입력창

import { TextInput, StyleSheet, TextInputProps } from "react-native";
import { COLORS, RADIUS } from "@/constants/theme";

export default function AppInput(props: TextInputProps) {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor="#A8A8A8"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 18,
    fontSize: 15,
    fontFamily: "NotoSansKRRegular",
    color: COLORS.black,
  },
});