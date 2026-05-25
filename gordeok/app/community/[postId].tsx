import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  createCommunityComment,
  getCommunityPost,
  toggleCommunityLike,
} from "../../services/community";
import type { CommunityDetail } from "../../types/community";

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray100: "#F7F7F7",
  yellow: "#F7C94B",
  line: "#EEEEEE",
};

const SCREEN_PADDING = 22;
const COMMENT_MENU_HEIGHT = 44;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const CATEGORY_STYLES: Record<
  string,
  {
    backgroundColor: string;
    textColor: string;
  }
> = {
  포카교환: {
    backgroundColor: "#FFF5D6",
    textColor: "#B58900",
  },
  질문게시판: {
    backgroundColor: "#F1E8FF",
    textColor: "#7A4FD8",
  },
  오프동행: {
    backgroundColor: "#E7F6EA",
    textColor: "#3A8B4C",
  },
  자유게시판: {
    backgroundColor: "#FFEAF3",
    textColor: "#D64F8B",
  },
};

type Comment = {
  id: string;
  name: string;
  profileText: string;
  profileColor: string;
  time: string;
  content: string;
};

type CommentMenuState = {
  commentId: string;
  top: number;
} | null;

function convertCategoryLabel(category: string) {
  switch (category) {
    case "PHOTO_EXCHANGE":
      return "포카교환";
    case "OFFLINE_COMPANION":
      return "오프동행";
    case "QUESTION":
      return "질문게시판";
    case "FREE":
      return "자유게시판";
    default:
      return category || "자유게시판";
  }
}

function getCategoryStyle(category: string) {
  return (
    CATEGORY_STYLES[category] ?? {
      backgroundColor: "#F2F2F2",
      textColor: "#666666",
    }
  );
}

function getSafeMenuTop(pageY: number) {
  const minTop = 88;
  const maxTop = SCREEN_HEIGHT - COMMENT_MENU_HEIGHT - 120;

  return Math.min(Math.max(pageY - 18, minTop), maxTop);
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function getProfileText(name?: string | null) {
  return name?.trim()?.[0] ?? "덕";
}

function convertComments(post?: CommunityDetail | null): Comment[] {
  return (post?.comments ?? []).map((comment) => ({
    id: String(comment.commentId),
    name: comment.nickname,
    profileText: getProfileText(comment.nickname),
    profileColor: "#FFF1C6",
    time: formatDate(comment.createdAt),
    content: comment.content,
  }));
}

export default function CommunityDetailScreen() {
  const params = useLocalSearchParams<{
    postId?: string;
    id?: string;
    communityId?: string;
  }>();

  const insets = useSafeAreaInsets();
  const postId = String(params.postId ?? params.id ?? params.communityId ?? "");

  const [post, setPost] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [commentMenu, setCommentMenu] = useState<CommentMenuState>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getCommunityPost(postId);
        setPost(data);
        setComments(convertComments(data));
      } catch (error) {
        console.log("커뮤니티 상세 조회 실패", error);
        setPost(null);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showListener = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });

    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const categoryLabel = convertCategoryLabel(post?.category ?? "");
  const categoryStyle = getCategoryStyle(categoryLabel);

  const closeMenusAndKeyboard = () => {
    setCommentMenu(null);
    Keyboard.dismiss();
  };

  const closeOnlyMenus = () => {
    setCommentMenu(null);
  };

  const handleToggleLike = async () => {
    if (!post) return;

    try {
      const result = await toggleCommunityLike(post.postId);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              liked: result.liked,
              likeCount: result.likeCount,
            }
          : prev
      );
    } catch (error) {
      console.log("좋아요 토글 실패", error);
    }
  };

  const handleAddComment = async () => {
    const trimmed = commentText.trim();

    if (!trimmed || !post || submittingComment) return;

    try {
      setSubmittingComment(true);
      const newComment = await createCommunityComment(post.postId, {
        content: trimmed,
      });

      setComments((prev) => [
        {
          id: String(newComment.commentId),
          name: newComment.nickname,
          profileText: getProfileText(newComment.nickname),
          profileColor: COLORS.yellow,
          time: formatDate(newComment.createdAt),
          content: newComment.content,
        },
        ...prev,
      ]);

      setPost((prev) =>
        prev
          ? {
              ...prev,
              commentCount: prev.commentCount + 1,
            }
          : prev
      );
      setCommentText("");
      setCommentMenu(null);
      Keyboard.dismiss();
    } catch (error) {
      console.log("댓글 작성 실패", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.black} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>커뮤니티</Text>
          </View>

          <View style={styles.headerIconButton} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: COLORS.gray400, fontWeight: "700" }}>
            {loading ? "게시글을 불러오는 중이에요." : "게시글을 불러오지 못했어요."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.black} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>커뮤니티</Text>

            <View
              style={[
                styles.headerBadge,
                { backgroundColor: categoryStyle.backgroundColor },
              ]}
            >
              <Text
                style={[
                  styles.headerBadgeText,
                  { color: categoryStyle.textColor },
                ]}
              >
                {categoryLabel}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => {
              Keyboard.dismiss();
              setCommentMenu(null);
              setPostMenuVisible(true);
            }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={21}
              color={COLORS.black}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={closeMenusAndKeyboard}
        >
          <Pressable onPress={closeMenusAndKeyboard}>
            <View style={styles.postBox}>
              <View style={styles.profileRow}>
                <View
                  style={[
                    styles.profileCircle,
                    { backgroundColor: "#FFF1C6" },
                  ]}
                >
                  <Text style={styles.profileText}>
                    {getProfileText(post.authorNickname)}
                  </Text>
                </View>

                <View style={styles.writerBox}>
                  <Text style={styles.name}>{post.authorNickname}</Text>
                  <Text style={styles.time}>{formatDate(post.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>

              <Text style={styles.postContent}>{post.content}</Text>
            </View>

            <View style={styles.infoRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.infoItem}
                onPress={handleToggleLike}
              >
                <Ionicons
                  name={post.liked ? "heart" : "heart-outline"}
                  size={16}
                  color={post.liked ? COLORS.yellow : COLORS.gray500}
                />
                <Text style={styles.infoText}>{post.likeCount}</Text>
              </TouchableOpacity>

              <View style={styles.infoItem}>
                <Ionicons
                  name="chatbubble-outline"
                  size={15}
                  color={COLORS.gray500}
                />
                <Text style={styles.infoText}>{comments.length}</Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons
                  name="eye-outline"
                  size={17}
                  color={COLORS.gray500}
                />
                <Text style={styles.infoText}>{post.viewCount}</Text>
              </View>
            </View>
          </Pressable>

          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onMorePress={(pageY) => {
                Keyboard.dismiss();
                setCommentMenu({
                  commentId: comment.id,
                  top: getSafeMenuTop(pageY),
                });
              }}
              onBackgroundPress={closeMenusAndKeyboard}
            />
          ))}
        </ScrollView>

        <View
          style={[
            styles.inputWrapper,
            {
              paddingBottom: keyboardVisible
                ? 14
                : Math.max(insets.bottom + 18, 24),
            },
          ]}
        >
          <TextInput
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="댓글을 입력하세요"
            placeholderTextColor={COLORS.gray400}
            multiline
            onFocus={closeOnlyMenus}
          />

          <TouchableOpacity
            activeOpacity={0.75}
            style={[
              styles.sendButton,
              (!commentText.trim() || submittingComment) && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
          >
            <Ionicons name="arrow-up" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

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
            <Pressable style={styles.postMenuBox} onPress={() => {}}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.menuButton}
                onPress={() => {
                  setPostMenuVisible(false);
                  console.log("글 수정");
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={COLORS.gray700}
                />
                <Text style={styles.menuText}>글 수정</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.menuButton}
                onPress={() => {
                  setPostMenuVisible(false);
                  console.log("글 삭제");
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#E05A5A" />
                <Text style={[styles.menuText, styles.deleteText]}>
                  글 삭제
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={commentMenu !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setCommentMenu(null)}
        >
          <Pressable
            style={styles.commentMenuOverlay}
            onPress={() => setCommentMenu(null)}
          >
            <Pressable
              style={[
                styles.commentMenuBox,
                {
                  top: commentMenu?.top ?? 120,
                },
              ]}
              onPress={() => {}}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.commentMenuButton}
                onPress={() => {
                  setCommentMenu(null);
                  console.log("쪽지 보내기");
                }}
              >
                <Text style={styles.commentMenuText}>쪽지 보내기</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CommentItem({
  comment,
  onMorePress,
  onBackgroundPress,
}: {
  comment: Comment;
  onMorePress: (pageY: number) => void;
  onBackgroundPress: () => void;
}) {
  return (
    <View style={styles.commentItemWrap}>
      <Pressable style={styles.commentItem} onPress={onBackgroundPress}>
        <View
          style={[
            styles.commentProfile,
            { backgroundColor: comment.profileColor },
          ]}
        >
          <Text style={styles.commentProfileText}>{comment.profileText}</Text>
        </View>

        <View style={styles.commentContent}>
          <View style={styles.commentTopRow}>
            <Text style={styles.commentName}>{comment.name}</Text>
            <Text style={styles.commentTime}>{comment.time}</Text>
          </View>

          <Text style={styles.commentText}>{comment.content}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.65}
          style={styles.commentMoreButton}
          onPress={(event) => {
            event.stopPropagation();
            onMorePress(event.nativeEvent.pageY);
          }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={COLORS.gray500}
          />
        </TouchableOpacity>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  header: {
    height: 64,
    paddingHorizontal: SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    position: "absolute",
    left: 72,
    right: 72,
    top: 8,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 23,
  },

  headerBadge: {
    minHeight: 18,
    paddingHorizontal: 8,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },

  headerBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 14,
  },

  content: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    paddingBottom: 14,
  },

  postBox: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 18,
    paddingBottom: 22,
    backgroundColor: COLORS.white,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  profileText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.black,
  },

  writerBox: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.gray900,
  },

  time: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray400,
  },

  postTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 28,
    marginBottom: 14,
  },

  postContent: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.gray700,
    lineHeight: 24,
  },

  infoRow: {
    height: 48,
    paddingHorizontal: SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
  },

  infoText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },

  commentItemWrap: {
    backgroundColor: COLORS.white,
  },

  commentItem: {
    minHeight: 82,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  commentProfile: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  commentProfileText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.black,
  },

  commentContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  commentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  commentName: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.gray900,
  },

  commentTime: {
    marginLeft: 7,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray400,
  },

  commentText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray700,
    lineHeight: 20,
  },

  commentMoreButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },

  inputWrapper: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.white,
  },

  input: {
    flex: 1,
    maxHeight: 76,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 11 : 8,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray900,
    marginRight: 8,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonDisabled: {
    backgroundColor: "#E5E5E5",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "flex-end",
    paddingTop: 69,
    paddingRight: SCREEN_PADDING,
  },

  postMenuBox: {
    width: 150,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    overflow: "hidden",
  },

  menuButton: {
    height: 44,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  menuText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.gray700,
  },

  deleteText: {
    color: "#E05A5A",
  },

  menuDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginHorizontal: 12,
  },

  commentMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.02)",
  },

  commentMenuBox: {
    position: "absolute",
    right: SCREEN_PADDING,
    width: 118,
    height: COMMENT_MENU_HEIGHT,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },

  commentMenuButton: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },

  commentMenuText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.gray700,
  },
});