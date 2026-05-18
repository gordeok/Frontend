// 

import { Pressable, Text, StyleSheet, PressableProps } from "react-native";
import { COLORS, RADIUS } from "@/constants/theme";

type AppButtonProps = PressableProps & {
  title: string;
};

export default function AppButton({ title, ...props }: AppButtonProps) {
  return (
    <Pressable style={styles.button} {...props}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "NotoSansKRBold",
  },
});