// 온보딩 완료 화면

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function Complete() {
  const router = useRouter();
  const { groups, members } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <StepHeader current={3} />

      <View style={styles.center}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>선택 완료!</Text>
      </View>

      <Pressable
        style={styles.startButton}
        onPress={() =>
          router.replace({
            pathname: "/home",
            params: {
              groups: typeof groups === "string" ? groups : "",
              members: typeof members === "string" ? members : "",
            },
          } as any)
        }
      >
        <Text style={styles.startText}>시작하기</Text>
      </Pressable>
    </View>
  );
}

function StepHeader({ current }: { current: number }) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepLine} />

      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View style={[styles.stepCircle, current === step && styles.activeStep]}>
            <Text style={styles.stepNum}>{step}</Text>
          </View>

          <Text style={[styles.stepLabel, current === step && styles.activeLabel]}>
            {step === 1
              ? "최애 그룹 선택"
              : step === 2
              ? "내 최애 선택"
              : "선택 완료"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 70,
  },
  stepWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 52,
    position: "relative",
  },
  stepLine: {
    position: "absolute",
    top: 13,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: "#E5E5E5",
    zIndex: 0,
  },
  stepItem: {
    alignItems: "center",
    zIndex: 2,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DFDFE3",
    alignItems: "center",
    justifyContent: "center",
  },
  activeStep: {
    backgroundColor: "#F7C94B",
  },
  stepNum: {
    color: "#fff",
    fontWeight: "700",
  },
  stepLabel: {
    marginTop: 8,
    fontSize: 11,
    color: "#9A9AA0",
  },
  activeLabel: {
    color: "#F4B900",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#F7C94B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  check: {
    fontSize: 44,
    color: "#fff",
    fontWeight: "900",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#202633",
  },
  startButton: {
    height: 58,
    borderRadius: 10,
    backgroundColor: "#F7C94B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  startText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});