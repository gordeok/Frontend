// 앱 전체 Navigation 설정

import { Stack } from "expo-router";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [loaded] = useFonts({
    NotoSansKRBlack: require("../assets/fonts/NotoSansKR-Black.ttf"),

    NotoSansKRBold: require("../assets/fonts/NotoSansKR-Bold.ttf"),

    NotoSansKRExtraBold: require("../assets/fonts/NotoSansKR-ExtraBold.ttf"),

    NotoSansKRExtraLight: require("../assets/fonts/NotoSansKR-ExtraLight.ttf"),

    NotoSansKRLight: require("../assets/fonts/NotoSansKR-Light.ttf"),

    NotoSansKRMedium: require("../assets/fonts/NotoSansKR-Medium.ttf"),

    NotoSansKRRegular: require("../assets/fonts/NotoSansKR-Regular.ttf"),

    NotoSansKRSemiBold: require("../assets/fonts/NotoSansKR-SemiBold.ttf"),

    NotoSansKRThin: require("../assets/fonts/NotoSansKR-Thin.ttf"),
  });

  if (!loaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    />
  );
}