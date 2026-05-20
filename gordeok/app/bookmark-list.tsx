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
  import { BookmarkPost, useBookmark } from "@/contexts/BookmarkContext";
  
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={28} color="#202633" />
            </Pressable>
  
            <Text style={styles.headerTitle}>북마크 목록</Text>
  
            <View style={styles.headerBlank} />
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
                  style={styles.card}
                  onPress={() => goDetail(item)}
                >
                  <View style={styles.thumbnail}>
                    <Ionicons name="image-outline" size={24} color="#D5A100" />
                  </View>
  
                  <View style={styles.textBox}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
  
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {item.sellerName}
                      {item.groupName ? ` · ${item.groupName}` : ""}
                    </Text>
                  </View>
  
                  <Pressable
                    style={styles.bookmarkButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      removeBookmark(item.id);
                    }}
                    hitSlop={10}
                  >
                    <Ionicons name="bookmark" size={22} color="#F7C94B" />
                  </Pressable>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="bookmark-outline" size={40} color="#D6D6D6" />
                <Text style={styles.emptyText}>저장한 북마크가 없어요</Text>
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
      paddingHorizontal: 24,
      paddingTop: 18,
      paddingBottom: 40,
    },
  
    card: {
      minHeight: 86,
      marginBottom: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 15,
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
  
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  
    thumbnail: {
      width: 54,
      height: 54,
      borderRadius: 10,
      backgroundColor: "#FFF1C9",
      alignItems: "center",
      justifyContent: "center",
    },
  
    textBox: {
      flex: 1,
      marginLeft: 14,
      marginRight: 10,
    },
  
    title: {
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20,
      color: "#2B2D33",
    },
  
    sellerName: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "500",
      color: "#9B9B9B",
    },
  
    bookmarkButton: {
      width: 30,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
    },
  
    emptyBox: {
      marginTop: 230,
      alignItems: "center",
      justifyContent: "center",
    },
  
    emptyText: {
      marginTop: 12,
      fontSize: 15,
      fontWeight: "700",
      color: "#A0A0A0",
    },
  
  });