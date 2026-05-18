// 하단 탭바 설정

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#111111",
        tabBarInactiveTintColor: "#A9A9A9",

        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 18,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EEEEEE",
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={25} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: "채팅",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-outline" size={25} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: "커뮤니티",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={25} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mypage"
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={25} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}