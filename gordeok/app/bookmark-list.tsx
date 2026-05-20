import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookmarkPost, useBookmark } from "@/contexts/BookmarkContext";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B0B0B0",
  gray100: "#F6F6F6",
  yellow: "#F7C94B",
  lightYellow: "#FFF4CC",
  line: "#F2EDE6",
};

export default function BookmarkListScreen() {
  const router = useRouter();
  const { bookmarks, removeBookmark } = useBookmark();

  const goDetail = (post: BookmarkPost) => {
    router.push({
      pathname: "/divide-detail",
      params: {
        postId: post.id,
        postData: post.postData,
        groups: post.groups ?? "",
        members: post.members ?? "",
      },
    } as any);
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
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </Pressable>

          <Text style={styles.headerTitle}>북마크 목록</Text>

          <View style={styles.headerIcon} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {bookmarks.length > 0 ? (
            bookmarks.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed, hovered }) => [
                  styles.card,
                  (pressed || hovered) && styles.cardHover,
                ]}
                onPress={() => goDetail(item)}
              >
                <View style={styles.thumbnail}>
                  <Ionicons
                    name="albums-outline"
                    size={22}
                    color={COLORS.black}
                  />
                </View>

                <View style={styles.textBox}>
                  <Text style={styles.title}>{item.title}</Text>

                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.sellerName}
                    {item.groupName ? ` · ${item.groupName}` : ""}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed, hovered }) => [
                    styles.bookmarkButton,
                    (pressed || hovered) && styles.bookmarkButtonHover,
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    removeBookmark(item.id);
                  }}
                  hitSlop={10}
                >
                  <Ionicons name="bookmark" size={22} color={COLORS.yellow} />
                </Pressable>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons
                name="bookmark-outline"
                size={38}
                color={COLORS.gray400}
              />
              <Text style={styles.emptyTitle}>저장한 북마크가 없어요</Text>
            </View>
          )}
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

  scroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    paddingTop: 12,
    paddingBottom: 36,
  },

  card: {
    minHeight: 88,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  cardHover: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },

  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.lightYellow,
    alignItems: "center",
    justifyContent: "center",
  },

  textBox: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
    color: COLORS.gray900,
    marginBottom: 6,
  },

  sellerName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
    lineHeight: 18,
  },

  bookmarkButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  bookmarkButtonHover: {
    backgroundColor: COLORS.gray100,
    opacity: 0.85,
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 250,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.gray500,
    marginTop: 14,
    marginBottom: 6,
  },

});