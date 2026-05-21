import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

type CommunityPost = {
  id: string;
  category: string;
  name: string;
  profileText: string;
  profileColor: string;
  time: string;
  createdAt: number;
  title: string;
  content: string;
  likes: number;
  comments: number;
  views: number;
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

const dummyPosts: CommunityPost[] = [
  {
    id: "1",
    category: "포카교환",
    name: "범규와이프",
    profileText: "범",
    profileColor: "#FFF1C6",
    time: "방금 전",
    createdAt: 6,
    title: "범규 포카 교환 구해요",
    content:
      "미니소드 럭드 범규 보유 중이고 수빈이나 연준 포카랑 교환 원해요. 상태 사진 바로 보내드릴게요.",
    likes: 18,
    comments: 5,
    views: 92,
  },
  {
    id: "2",
    category: "질문게시판",
    name: "포카초보",
    profileText: "초",
    profileColor: "#EAF1FF",
    time: "12분 전",
    createdAt: 5,
    title: "분철 입금 전 확인할 것 알려주세요",
    content:
      "처음 참여하는 분철이라 인증, 후기, 입금 방식 중에서 꼭 확인해야 할 부분이 궁금해요.",
    likes: 31,
    comments: 14,
    views: 208,
  },
  {
    id: "3",
    category: "오프동행",
    name: "콘서트가자",
    profileText: "콘",
    profileColor: "#E8F6EE",
    time: "35분 전",
    createdAt: 4,
    title: "이번 주 음악방송 같이 가실 분 있나요?",
    content:
      "혼자 가기 애매해서 같이 대기하고 끝나고 카페까지 갈 분 구해요. 너무 시끄러운 분위기는 아니었으면 좋겠어요.",
    likes: 12,
    comments: 3,
    views: 76,
  },
  {
    id: "4",
    category: "자유게시판",
    name: "앨깡요정",
    profileText: "앨",
    profileColor: "#FFE6F2",
    time: "1시간 전",
    createdAt: 3,
    title: "오늘 앨범깡 결과 진짜 레전드였어요",
    content:
      "중복 없이 최애까지 나와서 하루 종일 기분 좋음... 다들 앨깡 성공했나요?",
    likes: 45,
    comments: 11,
    views: 263,
  },
  {
    id: "5",
    category: "포카교환",
    name: "해찬찾아요",
    profileText: "해",
    profileColor: "#E7FFF7",
    time: "2시간 전",
    createdAt: 2,
    title: "NCT 해찬 포카 교환 가능하신 분 찾습니다",
    content:
      "재현 포카 여러 장 보유 중이고 해찬 위주로 교환 원합니다. 상태 사진이랑 하자 여부 먼저 공유드려요.",
    likes: 22,
    comments: 8,
    views: 141,
  },
  {
    id: "6",
    category: "자유게시판",
    name: "고르덕덕",
    profileText: "덕",
    profileColor: "#F0E7FF",
    time: "3시간 전",
    createdAt: 1,
    title: "슬리브까지 끼워도 잘 들어가는 포카 바인더 추천해줄 사람",
    content:
      "기존에 쓰던 건 슬리브 끼우면 너무 빡빡해서 꺼낼 때 포카 휘어질까 봐 무서워요.",
    likes: 16,
    comments: 9,
    views: 119,
  },
];

const dummyComments: Comment[] = [
  {
    id: "1",
    name: "거래조심해",
    profileText: "거",
    profileColor: "#FFF1C6",
    time: "5분 전",
    content: "후기 캡처랑 계정 생성일은 꼭 확인하는 게 좋아요.",
  },
  {
    id: "2",
    name: "포카수집중",
    profileText: "포",
    profileColor: "#EAF1FF",
    time: "8분 전",
    content: "입금 전에는 배송 방식이랑 환불 기준도 물어보세요!",
  },
  {
    id: "3",
    name: "덕메구함",
    profileText: "덕",
    profileColor: "#F0E7FF",
    time: "10분 전",
    content: "저는 인증 사진에 날짜랑 닉네임 적어달라고 해요.",
  },
];

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

export default function CommunityDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    postId?: string;
    communityId?: string;
  }>();

  const insets = useSafeAreaInsets();

  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [commentMenu, setCommentMenu] = useState<CommentMenuState>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>(dummyComments);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  const post = useMemo(() => {
    const currentId = String(
      params.id ?? params.postId ?? params.communityId ?? "1"
    );

    return dummyPosts.find((item) => item.id === currentId) ?? dummyPosts[0];
  }, [params.id, params.postId, params.communityId]);

  const categoryStyle = getCategoryStyle(post.category);

  const closeMenusAndKeyboard = () => {
    setCommentMenu(null);
    Keyboard.dismiss();
  };

  const closeOnlyMenus = () => {
    setCommentMenu(null);
  };

  const handleAddComment = () => {
    const trimmed = commentText.trim();

    if (!trimmed) return;

    const newComment: Comment = {
      id: String(Date.now()),
      name: "나",
      profileText: "나",
      profileColor: COLORS.yellow,
      time: "방금 전",
      content: trimmed,
    };

    setComments((prev) => [newComment, ...prev]);
    setCommentText("");
    setCommentMenu(null);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
                {post.category}
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
                    { backgroundColor: post.profileColor },
                  ]}
                >
                  <Text style={styles.profileText}>{post.profileText}</Text>
                </View>

                <View style={styles.writerBox}>
                  <Text style={styles.name}>{post.name}</Text>
                  <Text style={styles.time}>{post.time}</Text>
                </View>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>

              <Text style={styles.postContent}>{post.content}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={COLORS.gray500}
                />
                <Text style={styles.infoText}>{post.likes}</Text>
              </View>

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
                <Text style={styles.infoText}>{post.views}</Text>
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
                ? 10
                : Math.max(insets.bottom),
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
              !commentText.trim() && styles.sendButtonDisabled,
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