import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  gray100: "#F8F8F8",
  line: "#F0F0F0",

  yellowLight: "#FFF1CC",

  greenBg: "#DDF8EA",
  greenText: "#008C55",

  grayBadgeBg: "#EEEEEE",
  grayBadgeText: "#777777",
};

type SellerSale = {
  id: number;
  title: string;
  status: "모집중" | "거래완료";
  date: string;
};

export default function SellerSalesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const sellerName = "범규와이프";

  const sales: SellerSale[] = [
    {
      id: 1,
      title: "투바투 럽홀더 포카 분철",
      status: "모집중",
      date: "2025.04.11",
    },
    {
      id: 2,
      title: "범규 포카 양도합니다",
      status: "모집중",
      date: "2025.03.24",
    },
    {
      id: 3,
      title: "투바투 앨범 분철 열어요",
      status: "거래완료",
      date: "2025.03.12",
    },
    {
      id: 4,
      title: "미공포 포카 일괄 양도",
      status: "거래완료",
      date: "2025.02.28",
    },
  ];

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

          <Text style={styles.headerTitle}>판매 목록</Text>

          <View style={styles.headerIcon} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.pageDescription}>
            {sellerName}님의 판매 목록입니다.
          </Text>

          {sales.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed, hovered }) => [
                styles.saleCard,
                (pressed || hovered) && styles.saleCardHover,
              ]}
              onPress={() => {
                console.log("상대방 판매글 이동", item.id, id);
              }}
            >
              <View style={styles.thumb} />

              <View style={styles.saleInfo}>
                <View style={styles.saleTop}>
                  <Text numberOfLines={1} style={styles.saleTitle}>
                    {item.title}
                  </Text>

                  <StatusBadge status={item.status} />
                </View>

                <Text style={styles.date}>{item.date}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: SellerSale["status"] }) {
  const isRecruiting = status === "모집중";

  return (
    <View
      style={[
        styles.statusBadge,
        isRecruiting ? styles.statusRecruiting : styles.statusDone,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          isRecruiting ? styles.statusRecruitingText : styles.statusDoneText,
        ]}
      >
        {status}
      </Text>
    </View>
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
  },

  header: {
    height: 58,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
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

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },

  pageDescription: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray500,
    marginBottom: 12,
  },

  saleCard: {
    height: 88,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  saleCardHover: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  thumb: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: COLORS.yellowLight,
    marginRight: 13,
  },

  saleInfo: {
    flex: 1,
    justifyContent: "center",
  },

  saleTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  saleTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    marginRight: 10,
  },

  statusBadge: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  statusRecruiting: {
    backgroundColor: COLORS.greenBg,
  },

  statusDone: {
    backgroundColor: COLORS.grayBadgeBg,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },

  statusRecruitingText: {
    color: COLORS.greenText,
  },

  statusDoneText: {
    color: COLORS.grayBadgeText,
  },

  date: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },
});