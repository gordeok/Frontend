import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type NotificationIcon =
  | "checkmark-circle"
  | "notifications"
  | "alarm"
  | "chatbubble-ellipses"
  | "heart"
  | "pricetag"
  | "shield-checkmark";

type NotificationItem = {
  id: number;
  icon: NotificationIcon;
  label: string;
  message: string;
  time: string;
};

const todayNotifications: NotificationItem[] = [
  {
    id: 1,
    icon: "checkmark-circle",
    label: "예약 완료",
    message: "카리나 포토카드 예약이 완료됐어요.",
    time: "방금 전",
  },
  {
    id: 2,
    icon: "chatbubble-ellipses",
    label: "새 채팅",
    message: "분철 개설자가 메시지를 보냈어요.",
    time: "5분 전",
  },
  {
    id: 3,
    icon: "alarm",
    label: "마감 임박",
    message: "관심 분철이 곧 마감돼요.",
    time: "12분 전",
  },
  {
    id: 4,
    icon: "heart",
    label: "관심 멤버 알림",
    message: "윈터 자리가 새로 열렸어요.",
    time: "28분 전",
  },
];

const pastNotifications: NotificationItem[] = [
  {
    id: 5,
    icon: "notifications",
    label: "팔로우 판매자 새 글",
    message: "이리우너라 판매자가 새 글을 올렸어요.",
    time: "48분 전",
  },
  {
    id: 6,
    icon: "pricetag",
    label: "가격 변경",
    message: "관심 포카 가격이 수정됐어요.",
    time: "1시간 전",
  },
  {
    id: 7,
    icon: "shield-checkmark",
    label: "거래 안전 알림",
    message: "의심 키워드가 감지됐어요.",
    time: "2시간 전",
  },
  {
    id: 8,
    icon: "checkmark-circle",
    label: "거래 완료",
    message: "참여한 분철이 완료 처리됐어요.",
    time: "어제",
  },
];

export default function NotificationScreen() {
  const router = useRouter();

  const goHome = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={goHome} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color="#202633" />
          </Pressable>

          <Text style={styles.headerTitle}>알림</Text>

          <View style={styles.headerBlank} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.todaySection}>
            {todayNotifications.map((item, index) => (
              <NotificationRow
                key={item.id}
                item={item}
                isLast={index === todayNotifications.length - 1}
              />
            ))}
          </View>

          <View style={styles.pastSection}>
            <Text style={styles.sectionTitle}>지난 알림</Text>

            {pastNotifications.map((item, index) => (
              <NotificationRow
                key={item.id}
                item={item}
                isLast={index === pastNotifications.length - 1}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function NotificationRow({
  item,
  isLast = false,
}: {
  item: NotificationItem;
  isLast?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Ionicons name={item.icon} size={22} color={getIconColor(item.icon)} />
      </View>

      <View style={styles.contentBox}>
        <View style={styles.topRow}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <Text
          style={styles.message}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.message}
        </Text>
      </View>

      {!isLast && <View style={styles.divider} />}
    </View>
  );
}

function getIconColor(icon: NotificationIcon) {
  switch (icon) {
    case "checkmark-circle":
      return "#19C453";
    case "notifications":
      return "#D5A100";
    case "alarm":
      return "#E45A5A";
    case "chatbubble-ellipses":
      return "#4E8CFF";
    case "heart":
      return "#FF6B9A";
    case "pricetag":
      return "#D5A100";
    case "shield-checkmark":
      return "#5C7CFA";
    default:
      return "#999999";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 64,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111111",
  },

  headerBlank: {
    width: 36,
  },

  scroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  todaySection: {
    backgroundColor: "#FFF9E8",
    paddingTop: 10,
    paddingBottom: 10,
  },

  pastSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 26,
  },

  sectionTitle: {
    marginLeft: 28,
    marginBottom: 18,
    fontSize: 17,
    fontWeight: "500",
    color: "#9B9B9B",
  },

  row: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    position: "relative",
  },

  iconBox: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  contentBox: {
    flex: 1,
    justifyContent: "center",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },

  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#A6A6A6",
  },

  time: {
    fontSize: 12,
    fontWeight: "500",
    color: "#BDBDBD",
  },

  message: {
    paddingRight: 14,
    fontSize: 15.5,
    fontWeight: "700",
    lineHeight: 21,
    color: "#5B5B66",
  },

  divider: {
    position: "absolute",
    left: 69,
    right: 28,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.035)",
  },
});