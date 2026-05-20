import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray100: "#F6F6F6",
  yellow: "#F7C94B",
  lightYellow: "#FFF4CC",
  green: "#31C48D",
  lightGreen: "#E7F8EF",
  blue: "#4C8DFF",
  lightBlue: "#EAF2FF",
  line: "#F2EDE6",
};

type SaleStatus = "모집중" | "배송준비중" | "거래완료";

type SaleItem = {
  id: number;
  title: string;
  subText: string;
  status: SaleStatus;
};

export default function SaleListScreen() {
  const [selectedTab, setSelectedTab] = useState<"progress" | "done">(
    "progress"
  );

  const progressList: SaleItem[] = [
    {
      id: 1,
      title: "별의 장: TOGETHER 앨범 분철",
      subText: "여석: 최범규, 강태현, 휴닝카이",
      status: "모집중",
    },
    {
      id: 2,
      title: "2026 MOA CON 특전 포카 분철",
      subText: "여석: 최연준, 강태현, 휴닝카이",
      status: "배송준비중",
    },
  ];

  const doneList: SaleItem[] = [
    {
      id: 3,
      title: "꿈의 장: MAGIC 앨범 포카",
      subText: "2026.05.03",
      status: "거래완료",
    },
    {
      id: 4,
      title: "SWEET 앨범 포카 분철",
      subText: "2026.04.27",
      status: "거래완료",
    },
    {
      id: 5,
      title: "minisode 3: TOMORROW 앨범 분철",
      subText: "2026.04.12",
      status: "거래완료",
    },
  ];

  const currentList = selectedTab === "progress" ? progressList : doneList;

  const getStatusStyle = (status: SaleStatus) => {
    if (status === "거래완료") {
      return {
        box: styles.doneStatusBadge,
        text: styles.doneStatusText,
      };
    }

    if (status === "배송준비중") {
      return {
        box: styles.deliveryStatusBadge,
        text: styles.deliveryStatusText,
      };
    }

    return {
      box: styles.progressStatusBadge,
      text: styles.progressStatusText,
    };
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.headerIcon,
              (pressed || hovered) && styles.headerIconHover,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </Pressable>

          <Text style={styles.headerTitle}>분철 판매 목록</Text>

          <View style={styles.headerIcon} />
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.tabButton,
              selectedTab === "progress" && styles.activeTabButton,
              (pressed || hovered) && styles.tabButtonHover,
            ]}
            onPress={() => setSelectedTab("progress")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "progress" && styles.activeTabText,
              ]}
            >
              거래 중
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.tabButton,
              selectedTab === "done" && styles.activeTabButton,
              (pressed || hovered) && styles.tabButtonHover,
            ]}
            onPress={() => setSelectedTab("done")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "done" && styles.activeTabText,
              ]}
            >
              거래 완료
            </Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {currentList.map((item) => {
            const statusStyle = getStatusStyle(item.status);

            return (
              <Pressable
                key={item.id}
                style={({ pressed, hovered }) => [
                  styles.listCard,
                  selectedTab === "done" && styles.doneListCard,
                  (pressed || hovered) && styles.listCardHover,
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.imageBox}>
                    <Ionicons
                      name="albums-outline"
                      size={22}
                      color={COLORS.black}
                    />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubText}>{item.subText}</Text>
                  </View>

                  {selectedTab === "progress" && (
                    <View style={statusStyle.box}>
                      <Text style={statusStyle.text}>{item.status}</Text>
                    </View>
                  )}
                </View>

                {selectedTab === "done" && (
                  <Pressable
                    style={({ pressed, hovered }) => [
                      styles.reviewButton,
                      (pressed || hovered) && styles.reviewButtonHover,
                    ]}
                  >
                    <Text style={styles.reviewButtonText}>받은 후기 보기</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerIconHover: {
    opacity: 0.55,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
  },

  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },

  tabButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },

  activeTabButton: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.yellow,
  },

  tabButtonHover: {
    opacity: 0.82,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.gray700,
  },

  activeTabText: {
    color: COLORS.white,
    fontWeight: "900",
  },

  listContent: {
    paddingBottom: 36,
  },

  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  doneListCard: {
    paddingBottom: 12,
  },

  listCardHover: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },

  cardTop: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
  },

  imageBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.lightYellow,
    justifyContent: "center",
    alignItems: "center",
  },

  itemInfo: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray900,
    lineHeight: 21,
    marginBottom: 4,
  },

  itemSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 17,
  },

  reviewButton: {
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  reviewButtonHover: {
    backgroundColor: COLORS.gray100,
    opacity: 0.9,
  },

  reviewButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.gray700,
  },

  progressStatusBadge: {
    backgroundColor: COLORS.lightYellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
  },

  progressStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#B89416",
  },

  deliveryStatusBadge: {
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
  },

  deliveryStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.blue,
  },

  doneStatusBadge: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
  },

  doneStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.green,
  },
});