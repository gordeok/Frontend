// 앱 전체 Navigation 설정

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { DividePostProvider } from "@/contexts/DividePostContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <BookmarkProvider>
        <DividePostProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "none",
            }}
          >
            <Stack.Screen name="(tabs)" />

            <Stack.Screen name="saleList" />
            <Stack.Screen name="receivedReviews" />
            <Stack.Screen name="editProfile" />
            <Stack.Screen name="mycommunityPosts" />
            <Stack.Screen name="purchaseList" />
            <Stack.Screen name="bookmark-list" />

            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>

          <StatusBar style="auto" />
        </DividePostProvider>
      </BookmarkProvider>
    </ThemeProvider>
  );
}