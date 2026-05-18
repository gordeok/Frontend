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
  
  type NotificationItem = {
    id: number;
    icon: string;
    label: string;
    message: string;
    time: string;
  };
  
  const todayNotifications: NotificationItem[] = [
    {
      id: 1,
      icon: "✅",
      label: "예약 완료",
      message: "에스파 Drama 분철에서 카리나 멤버가 예약 처리됐어요.",
      time: "방금 전",
    },
    {
      id: 2,
      icon: "🔔",
      label: "팔로우 판매자 새 글",
      message: "이리우너라 님이 새 분철을 등록했어요.",
      time: "방금 전",
    },
    {
      id: 3,
      icon: "⏰",
      label: "마감 임박",
      message: "관심 분철의 윈터 멤버가 곧 마감돼요.",
      time: "방금 전",
    },
    {
      id: 4,
      icon: "⏰",
      label: "마감 임박",
      message: "관심 분철의 윈터 멤버가 곧 마감돼요.",
      time: "방금 전",
    },
  ];
  
  const pastNotifications: NotificationItem[] = [
    {
      id: 5,
      icon: "✅",
      label: "예약 완료",
      message: "에스파 Drama 분철에서 카리나 멤버가 예약 처리됐어요.",
      time: "방금 전",
    },
    {
      id: 6,
      icon: "🔔",
      label: "팔로우 판매자 새 글",
      message: "이리우너라 님이 새 분철을 등록했어요.",
      time: "방금 전",
    },
    {
      id: 7,
      icon: "⏰",
      label: "마감 임박",
      message: "관심 분철의 윈터 멤버가 곧 마감돼요.",
      time: "방금 전",
    },
    {
      id: 8,
      icon: "⏰",
      label: "마감 임박",
      message: "관심 분철의 윈터 멤버가 곧 마감돼요.",
      time: "방금 전",
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
              {todayNotifications.map((item) => (
                <NotificationRow key={item.id} item={item} />
              ))}
            </View>
  
            <View style={styles.pastSection}>
              <Text style={styles.sectionTitle}>지난 알림</Text>
  
              {pastNotifications.map((item) => (
                <NotificationRow key={item.id} item={item} />
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
  
  function NotificationRow({ item }: { item: NotificationItem }) {
    return (
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{item.icon}</Text>
        </View>
  
        <View style={styles.contentBox}>
          <View style={styles.topRow}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
  
          <Text style={styles.message}>{item.message}</Text>
        </View>
      </View>
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
      paddingTop: 16,
      paddingBottom: 16,
    },
  
    pastSection: {
      backgroundColor: "#FFFFFF",
      paddingTop: 24,
    },
  
    sectionTitle: {
      marginLeft: 28,
      marginBottom: 14,
      fontSize: 18,
      fontWeight: "500",
      color: "#9B9B9B",
    },
  
    row: {
      flexDirection: "row",
      paddingHorizontal: 28,
      paddingVertical: 9,
    },
  
    iconBox: {
      width: 32,
      alignItems: "center",
      paddingTop: 1,
    },
  
    icon: {
      fontSize: 20,
      lineHeight: 23,
    },
  
    contentBox: {
      flex: 1,
      marginLeft: 9,
    },
  
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
      marginTop: 4,
      paddingRight: 14,
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 23,
      color: "#5B5B66",
    },
  });