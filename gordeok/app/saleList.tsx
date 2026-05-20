import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SaleListScreen() {
  const [selectedTab, setSelectedTab] = useState<"progress" | "done">(
    "progress",
  );

  const progressList = [
    {
      title: "별의 장: TOGETHER 앨범 포카",
      members: "여석: 최범규, 강태현, 휴닝카이",
      status: "모집중",
    },
    {
      title: "2026 TXT MOA CON 포카",
      members: "여석: 최연준, 강태현, 휴닝카이",
      status: "모집중",
    },
  ];

  const doneList = [
    {
      title: "꿈의 장: MAGIC 앨범 포카",
      date: "2019.11.09",
    },
    {
      title: "꿈의 장: MAGIC 앨범 포카",
      date: "2019.11.09",
    },
    {
      title: "꿈의 장: MAGIC 앨범 포카",
      date: "2019.11.09",
    },
    {
      title: "꿈의 장: MAGIC 앨범 포카",
      date: "2019.11.09",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#222222" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>분철 판매 목록</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "progress" && styles.activeTabButton,
            ]}
            activeOpacity={0.8}
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
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "done" && styles.activeTabButton,
            ]}
            activeOpacity={0.8}
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
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {selectedTab === "progress"
            ? progressList.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.progressCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.imageBox} />

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubText}>{item.members}</Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </TouchableOpacity>
              ))
            : doneList.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.doneCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.doneTop}>
                    <View style={styles.imageBox} />

                    <View style={styles.doneInfo}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemSubText}>{item.date}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.reviewButton}>
                    <Text style={styles.reviewButtonText}>받은 후기 보기</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 26,
  },

  header: {
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111111",
  },

  headerRight: {
    width: 26,
  },

  tabRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    marginBottom: 28,
  },

  tabButton: {
    flex: 1,
    height: 34,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E1D2",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  activeTabButton: {
    backgroundColor: "#EACB59",
    borderColor: "#EACB59",
  },

  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#777777",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  listContent: {
    paddingBottom: 40,
  },

  progressCard: {
    minHeight: 106,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  doneCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 22,

    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  doneTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  imageBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F8EFCF",
  },

  itemInfo: {
    flex: 1,
    marginLeft: 14,
  },

  doneInfo: {
    flex: 1,
    marginLeft: 14,
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#222222",
    marginBottom: 9,
  },

  itemSubText: {
    fontSize: 12,
    color: "#777777",
  },

  statusBadge: {
    backgroundColor: "#DDF3E4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#299A56",
  },

  reviewButton: {
    height: 50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E1D2",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },

  reviewButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#777777",
  },
});