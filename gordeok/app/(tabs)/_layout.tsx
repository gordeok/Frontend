// 하단 탭바 설정

import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: "채팅",
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: "커뮤니티",
        }}
      />

      <Tabs.Screen
        name="mypage"
        options={{
          title: "마이페이지",
        }}
      />
    </Tabs>
  );
}