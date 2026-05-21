import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CommunityDetailScreen() {
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [openedCommentId, setOpenedCommentId] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={23} color="#555" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>커뮤니티</Text>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>포카교환</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => setPostMenuVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={21} color="#555" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => setOpenedCommentId(null)}>
            <View style={styles.postBox}>
              <View style={styles.profileRow}>
                <View style={styles.profileCircle}>
                  <Text style={styles.profileText}>하</Text>
                </View>

                <View>
                  <Text style={styles.nickname}>하영이</Text>
                  <Text style={styles.meta}>2시간 전 · 조회 156</Text>
                </View>
              </View>

              <Text style={styles.postTitle}>
                정국 포카를 지민 포카로 교환 원해요
              </Text>

              <Text style={styles.postContent}>
                앨범 포카 정국 보유중이고 지민 포카랑 교환하고 싶어요.
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoText}>좋아요 24</Text>
              <Text style={styles.infoText}>조회수 156</Text>
            </View>

            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>댓글 7</Text>
            </View>
          </Pressable>

          <CommentItem
            id="1"
            color="#8DB3F4"
            name="아포방포"
            comment="저도 구하고 있는데 혹시 직거래 가능하신가요?"
            openedCommentId={openedCommentId}
            onMorePress={() =>
              setOpenedCommentId(openedCommentId === "1" ? null : "1")
            }
          />

          <CommentItem
            id="2"
            color="#EDB383"
            name="박지민사랑해"
            comment="S급이면 좋은 교환 되실 것 같아요!"
            openedCommentId={openedCommentId}
            onMorePress={() =>
              setOpenedCommentId(openedCommentId === "2" ? null : "2")
            }
          />

          <CommentItem
            id="3"
            color="#AAD0A1"
            name="정국원픽"
            comment="지민 저한테 있는데 연락 주세요~"
            openedCommentId={openedCommentId}
            onMorePress={() =>
              setOpenedCommentId(openedCommentId === "3" ? null : "3")
            }
          />

          <CommentItem
            id="4"
            color="#D6A6FF"
            name="태형포카수집중"
            comment="혹시 정국 양도도 구하시나요?"
            openedCommentId={openedCommentId}
            onMorePress={() =>
              setOpenedCommentId(openedCommentId === "4" ? null : "4")
            }
          />

          <CommentItem
            id="5"
            color="#FFD27F"
            name="포카교환해요"
            comment="직거래 어디서 가능하신가요?"
            openedCommentId={openedCommentId}
            onMorePress={() =>
              setOpenedCommentId(openedCommentId === "5" ? null : "5")
            }
          />

          <CommentItem
            id="6"
            color="#9ED9C3"
            name="방탄최고"
            comment="포카 상태 궁금해요!"
            openedCommentId={openedCommentId}
            onMorePress={() =>
              setOpenedCommentId(openedCommentId === "6" ? null : "6")
            }
          />

          <CommentItem
            id="7"
            color="#FFB3C7"
            name="석진사랑단"
            comment="혹시 아직 교환 가능할까요??"
            openedCommentId={openedCommentId}
            onMorePress={() =>
              setOpenedCommentId(openedCommentId === "7" ? null : "7")
            }
          />
        </ScrollView>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor="#BDBDBD"
          />

          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.sendText}>전송</Text>
          </TouchableOpacity>
        </View>

        {/* 게시글 메뉴 */}
        <Modal
          visible={postMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPostMenuVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setPostMenuVisible(false)}
          >
            <View style={styles.menuBox}>
              <TouchableOpacity style={styles.menuButton}>
                <Text style={styles.menuText}>글 수정</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuButton}>
                <Text style={styles.menuText}>글 삭제</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CommentItem({
  id,
  color,
  name,
  comment,
  openedCommentId,
  onMorePress,
}: {
  id: string;
  color: string;
  name: string;
  comment: string;
  openedCommentId: string | null;
  onMorePress: () => void;
}) {
  return (
    <View style={{ position: "relative" }}>
      <View style={styles.commentItem}>
        <View style={[styles.commentProfile, { backgroundColor: color }]} />

        <View style={styles.commentContent}>
          <Text style={styles.commentName}>{name}</Text>
          <Text style={styles.commentText}>{comment}</Text>
        </View>

        <TouchableOpacity onPress={onMorePress}>
          <Ionicons name="ellipsis-horizontal" size={19} color="#666" />
        </TouchableOpacity>
      </View>

      {openedCommentId === id && (
        <View style={styles.inlineCommentMenu}>
          <TouchableOpacity style={styles.inlineCommentButton}>
            <Text style={styles.inlineCommentText}>쪽지 보내기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    height: 74,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  headerCenter: {
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },

  categoryBadge: {
    marginTop: 3,
    backgroundColor: "#FFF6D8",
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 6,
  },

  categoryText: {
    fontSize: 11,
    color: "#D3A900",
    fontWeight: "600",
  },

  content: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 0,
  },

  postBox: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  profileCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FBF6D7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  profileText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7D7418",
  },

  nickname: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
  },

  meta: {
    marginTop: 4,
    fontSize: 12,
    color: "#A0A0A0",
  },

  postTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    lineHeight: 26,
    marginBottom: 18,
  },

  postContent: {
    fontSize: 15,
    color: "#444",
    lineHeight: 24,
  },

  infoRow: {
    height: 52,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEEEEE",
  },

  infoText: {
    fontSize: 14,
    color: "#999",
  },

  commentHeader: {
    height: 48,
    paddingHorizontal: 24,
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  commentTitle: {
    fontSize: 14,
    color: "#B0B0B0",
    fontWeight: "600",
  },

  commentItem: {
    minHeight: 82,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },

  commentProfile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 13,
  },

  commentContent: {
    flex: 1,
  },

  commentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  commentText: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
  },

  inputWrapper: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    height: 52,
    backgroundColor: "#F4F4F4",
    borderRadius: 26,
    paddingHorizontal: 18,
    fontSize: 14,
    color: "#333",
    marginRight: 11,
  },

  sendButton: {
    width: 72,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E9C95D",
    justifyContent: "center",
    alignItems: "center",
  },

  sendText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 90,
  },

  menuBox: {
    width: "86%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 8,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  menuButton: {
    height: 64,
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  menuText: {
    fontSize: 17,
    color: "#666666",
    fontWeight: "500",
  },

  menuDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginHorizontal: 28,
  },

  inlineCommentMenu: {
    position: "absolute",
    right: 12,
    top: -6,
    width: 150,

    backgroundColor: "#FFFFFF",
    borderRadius: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,

    zIndex: 999,
  },

  inlineCommentButton: {
    height: 58,
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  inlineCommentText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
});