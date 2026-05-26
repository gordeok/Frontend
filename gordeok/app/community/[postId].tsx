import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
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
import { getStoredUserId } from "../../utils/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://172.20.99.65:8080";

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
const LOCAL_CHAT_ROOMS_KEY = "localChatRooms";

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
  userId: number | null;
  name: string;
  profileText: string;
  profileColor: string;
  time: string;
  content: string;
};

type CommentMenuState = {
  commentId: string;
  toUserId: number | null;
  toNickname: string;
  top: number;
} | null;

function convertCategoryLabel(category?: string | null) {
  switch (category) {
    case "PHOTO_EXCHANGE":
      return "포카교환";
    case "OFFLINE_COMPANION":
      return "오프동행";
    case "QUESTION":
      return "질문게시판";
    case "FREE":
      return "자유게시판";
    case "포카교환":
    case "오프동행":
    case "질문게시판":
    case "자유게시판":
      return category;
    default:
      return "자유게시판";
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

function normalizeImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (!trimmedUrl) return "";

  if (trimmedUrl.startsWith("http://localhost:8080")) {
    return trimmedUrl.replace("http://localhost:8080", API_BASE_URL);
  }

  if (trimmedUrl.startsWith("https://localhost:8080")) {
    return trimmedUrl.replace("https://localhost:8080", API_BASE_URL);
  }

  if (trimmedUrl.startsWith("http://127.0.0.1:8080")) {
    return trimmedUrl.replace("http://127.0.0.1:8080", API_BASE_URL);
  }

  if (trimmedUrl.startsWith("https://127.0.0.1:8080")) {
    return trimmedUrl.replace("https://127.0.0.1:8080", API_BASE_URL);
  }

  if (trimmedUrl.startsWith("/uploads")) {
    return `${API_BASE_URL}${trimmedUrl}`;
  }

  return trimmedUrl;
}

function getCommunityImages(data: any) {
  const images: string[] = [];

  if (Array.isArray(data?.imageUrls)) {
    images.push(...data.imageUrls);
  }

  if (Array.isArray(data?.images)) {
    images.push(...data.images);
  }

  if (Array.isArray(data?.photoUrls)) {
    images.push(...data.photoUrls);
  }

  if (Array.isArray(data?.data?.imageUrls)) {
    images.push(...data.data.imageUrls);
  }

  if (data?.imageUrl) {
    images.push(data.imageUrl);
  }

  if (data?.thumbnailUrl) {
    images.push(data.thumbnailUrl);
  }

  if (data?.data?.imageUrl) {
    images.push(data.data.imageUrl);
  }

  if (data?.data?.thumbnailUrl) {
    images.push(data.data.thumbnailUrl);
  }

  return Array.from(
    new Set(
      images
        .map((url) => normalizeImageUrl(url))
        .filter((url) => typeof url === "string" && url.length > 0)
    )
  );
}

function getCommentArray(data: any) {
  if (Array.isArray(data?.comments)) return data.comments;
  if (Array.isArray(data?.commentList)) return data.commentList;
  if (Array.isArray(data?.commentResponses)) return data.commentResponses;
  if (Array.isArray(data?.communityComments)) return data.communityComments;
  if (Array.isArray(data?.commentDtoList)) return data.commentDtoList;
  if (Array.isArray(data?.comments?.content)) return data.comments.content;
  if (Array.isArray(data?.commentPage?.content)) return data.commentPage.content;
  if (Array.isArray(data?.data?.comments)) return data.data.comments;
  if (Array.isArray(data?.data?.commentList)) return data.data.commentList;
  return [];
}

function getCommentUserId(comment: any) {
  const rawUserId =
    comment?.userId ??
    comment?.authorId ??
    comment?.writerId ??
    comment?.memberId ??
    comment?.commentUserId ??
    comment?.createdBy ??
    null;

  if (rawUserId === null || rawUserId === undefined || rawUserId === "") {
    return null;
  }

  const numberUserId = Number(rawUserId);

  return Number.isNaN(numberUserId) ? null : numberUserId;
}

function getChatRoomId(data: any) {
  const rawChatRoomId =
    data?.chatRoomId ??
    data?.id ??
    data?.roomId ??
    data?.data?.chatRoomId ??
    data?.data?.id ??
    data?.data?.roomId ??
    null;

  if (rawChatRoomId === null || rawChatRoomId === undefined || rawChatRoomId === "") {
    return null;
  }

  return String(rawChatRoomId);
}

async function saveDirectChatRoomToLocal(room: {
  chatRoomId: string;
  title: string;
  boardName: string;
  opponentName: string;
  postId: string;
}) {
  try {
    const saved = await AsyncStorage.getItem(LOCAL_CHAT_ROOMS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    const previousRooms = Array.isArray(parsed) ? parsed : [];

    const nextRoom = {
      id: room.chatRoomId,
      chatRoomId: room.chatRoomId,
      type: "DIRECT",
      chatRoomType: "DIRECT",
      roomType: "DIRECT",
      title: room.title,
      roomName: room.title,
      postTitle: room.title,
      communityTitle: room.title,
      boardName: room.boardName,
      category: room.boardName,
      opponentName: room.opponentName,
      sellerName: room.opponentName,
      postId: room.postId,
      postsId: room.postId,
      communityId: room.postId,
      lastMessage: "",
      lastMessageTime: new Date().toISOString(),
    };

    const nextRooms = [
      nextRoom,
      ...previousRooms.filter(
        (item) =>
          String(item?.chatRoomId ?? item?.id ?? item?.roomId ?? "") !==
          room.chatRoomId
      ),
    ];

    await AsyncStorage.setItem(LOCAL_CHAT_ROOMS_KEY, JSON.stringify(nextRooms));
  } catch (error) {
    console.log("쪽지 채팅방 로컬 저장 실패:", error);
  }
}


function convertComment(comment: any, index: number): Comment {
  const name =
    comment?.nickname ||
    comment?.authorNickname ||
    comment?.writerNickname ||
    comment?.memberNickname ||
    comment?.userNickname ||
    comment?.authorName ||
    "익명";

  return {
    id: String(
      comment?.commentId ??
        comment?.id ??
        comment?.communityCommentId ??
        `${Date.now()}-${index}`
    ),
    userId: getCommentUserId(comment),
    name,
    profileText: getProfileText(name),
    profileColor: "#FFF1C6",
    time: formatDate(comment?.createdAt ?? comment?.createdDate),
    content: comment?.content ?? comment?.comment ?? comment?.body ?? "",
  };
}

function convertComments(post?: CommunityDetail | null): Comment[] {
  return getCommentArray(post).map(convertComment);
}

export default function CommunityDetailScreen() {
  const params = useLocalSearchParams<{
    postsId?: string;
    postId?: string;
    id?: string;
    communityId?: string;
  }>();

  const insets = useSafeAreaInsets();

  const postId = String(
    params.postsId ?? params.postId ?? params.id ?? params.communityId ?? ""
  );

  const [post, setPost] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [commentMenu, setCommentMenu] = useState<CommentMenuState>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [creatingDirectChat, setCreatingDirectChat] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const loadPost = async () => {
    if (!postId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getCommunityPost(postId);

      console.log("커뮤니티 상세 데이터:", data);
      console.log("커뮤니티 이미지 데이터:", getCommunityImages(data));
      console.log("커뮤니티 댓글 데이터:", getCommentArray(data));

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

  useEffect(() => {
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

  const categoryLabel = convertCategoryLabel((post as any)?.category);
  const categoryStyle = getCategoryStyle(categoryLabel);

  const postImages = useMemo(() => {
    const images = getCommunityImages(post as any);

    console.log("커뮤니티 최종 이미지 URL:", images);

    return images;
  }, [post]);

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
      const result = await toggleCommunityLike((post as any).postId);
      setPost((prev: any) =>
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

      const newComment = await createCommunityComment((post as any).postId, {
        content: trimmed,
      });

      const convertedNewComment = convertComment(newComment, 0);

      setComments((prev) => [convertedNewComment, ...prev]);

      setPost((prev: any) =>
        prev
          ? {
              ...prev,
              commentCount: (prev.commentCount ?? 0) + 1,
            }
          : prev
      );

      setCommentText("");
      setCommentMenu(null);
      Keyboard.dismiss();

      const refreshedPost = await getCommunityPost(postId);
      setPost(refreshedPost);
      setComments(convertComments(refreshedPost));
    } catch (error) {
      console.log("댓글 작성 실패", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreateDirectChat = async () => {
    if (!commentMenu || creatingDirectChat) return;
  
    const toUserId = commentMenu.toUserId;
  
    if (!toUserId) {
      Alert.alert("쪽지 보내기 실패", "댓글 작성자 정보를 찾을 수 없어요.");
      setCommentMenu(null);
      return;
    }
  
    try {
      setCreatingDirectChat(true);
  
      const fromUserId = await getStoredUserId();
  
      console.log("쪽지 fromUserId:", fromUserId);
      console.log("쪽지 toUserId:", toUserId);
  
      if (!fromUserId) {
        Alert.alert("로그인이 필요해요", "로그인 후 쪽지를 보낼 수 있어요.");
        setCommentMenu(null);
        return;
      }
  
      if (Number(fromUserId) === Number(toUserId)) {
        Alert.alert("쪽지 보내기", "내 댓글에는 쪽지를 보낼 수 없어요.");
        setCommentMenu(null);
        return;
      }
  
      const url = `${API_BASE_URL}/api/chat-rooms/direct?fromUserId=${encodeURIComponent(
        String(fromUserId)
      )}&toUserId=${encodeURIComponent(String(toUserId))}`;
  
      console.log("쪽지 채팅방 생성 요청:", url);
  
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
  
      const responseText = await response.text();
  
      console.log("쪽지 채팅방 생성 status:", response.status);
      console.log("쪽지 채팅방 생성 response:", responseText);
  
      let result: any = null;
  
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = responseText;
        }
      }
  
      if (!response.ok) {
        const message =
          typeof result === "object" && result?.message
            ? result.message
            : typeof result === "string" && result.trim()
            ? result
            : "쪽지 채팅방을 만들지 못했어요.";
  
        throw new Error(message);
      }
  
      const chatRoomId = getChatRoomId(result);
  
      console.log("생성된 쪽지 chatRoomId:", chatRoomId);
  
      setCommentMenu(null);
  
      if (chatRoomId) {
        const postData: any = post;

        const communityTitle =
          postData?.title ??
          postData?.postTitle ??
          postData?.communityTitle ??
          postData?.subject ??
          "커뮤니티 게시글";

        const opponentName =
          commentMenu.toNickname && commentMenu.toNickname.trim()
            ? commentMenu.toNickname.trim()
            : "상대방";

        const communityPostId = String(
          postId ||
            postData?.postId ||
            postData?.postsId ||
            postData?.id ||
            postData?.communityId ||
            ""
        ).trim();

        await saveDirectChatRoomToLocal({
          chatRoomId: String(chatRoomId),
          title: String(communityTitle),
          boardName: categoryLabel,
          opponentName,
          postId: communityPostId,
        });

        router.push({
          pathname: "/chat/[chatRoomId]",
          params: {
            chatRoomId: String(chatRoomId),
            type: "note",
            title: String(communityTitle),
            communityTitle: String(communityTitle),
            roomName: String(communityTitle),
            boardName: categoryLabel,
            category: categoryLabel,
            opponentName,
            sellerName: opponentName,
            postId: communityPostId,
            postsId: communityPostId,
            id: communityPostId,
            communityId: communityPostId,
          },
        });
        return;
      }

      router.push("/chats");
    } catch (error: any) {
      console.log("쪽지 채팅방 생성 실패:", error);
  
      Alert.alert(
        "쪽지 보내기 실패",
        error?.message ?? "서버 오류가 발생했어요."
      );
    } finally {
      setCreatingDirectChat(false);
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

        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>
            {loading
              ? "게시글을 불러오는 중이에요."
              : "게시글을 불러오지 못했어요."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const postData: any = post;

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
                    {getProfileText(postData.authorNickname)}
                  </Text>
                </View>

                <View style={styles.writerBox}>
                  <Text style={styles.name}>
                    {postData.authorNickname ?? "익명"}
                  </Text>
                  <Text style={styles.time}>
                    {formatDate(postData.createdAt)}
                  </Text>
                </View>
              </View>

              <Text style={styles.postTitle}>{postData.title}</Text>

              <Text style={styles.postContent}>{postData.content}</Text>

              {postImages.length > 0 && (
                <View style={styles.postImageGrid}>
                  {postImages.map((imageUrl, index) => (
                    <Pressable
                      key={`${imageUrl}-${index}`}
                      style={styles.postImageBox}
                      onPress={() => {
                        Keyboard.dismiss();
                        setCommentMenu(null);
                        setSelectedImageUrl(imageUrl);
                      }}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.log(
                            "커뮤니티 이미지 로드 실패:",
                            imageUrl,
                            error.nativeEvent
                          );
                        }}
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.infoRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.infoItem}
                onPress={handleToggleLike}
              >
                <Ionicons
                  name={postData.liked ? "heart" : "heart-outline"}
                  size={16}
                  color={postData.liked ? COLORS.yellow : COLORS.gray500}
                />
                <Text style={styles.infoText}>{postData.likeCount ?? 0}</Text>
              </TouchableOpacity>

              <View style={styles.infoItem}>
                <Ionicons
                  name="chatbubble-outline"
                  size={15}
                  color={COLORS.gray500}
                />
                <Text style={styles.infoText}>
                  {comments.length || postData.commentCount || 0}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons
                  name="eye-outline"
                  size={17}
                  color={COLORS.gray500}
                />
                <Text style={styles.infoText}>{postData.viewCount ?? 0}</Text>
              </View>
            </View>
          </Pressable>

          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onMorePress={(pageY) => {
                  Keyboard.dismiss();
                  setCommentMenu({
                    commentId: comment.id,
                    toUserId: comment.userId,
                    toNickname: comment.name,
                    top: getSafeMenuTop(pageY),
                  });
                }}
                onBackgroundPress={closeMenusAndKeyboard}
              />
            ))
          ) : (
            <View style={styles.emptyCommentBox} />
          )}
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
              (!commentText.trim() || submittingComment) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submittingComment}
          >
            <Ionicons name="arrow-up" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <Modal
          visible={selectedImageUrl !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedImageUrl(null)}
        >
          <View style={styles.fullscreenImageModal}>
            <Pressable
              style={styles.fullscreenImageBackground}
              onPress={() => setSelectedImageUrl(null)}
            >
              {selectedImageUrl && (
                <Image
                  source={{ uri: selectedImageUrl }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
            </Pressable>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.fullscreenCloseButton}
              onPress={() => setSelectedImageUrl(null)}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </Modal>

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
                onPress={handleCreateDirectChat}
                disabled={creatingDirectChat}
              >
                <Text style={styles.commentMenuText}>
                  {creatingDirectChat ? "생성 중" : "쪽지 보내기"}
                </Text>
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

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.gray400,
    fontWeight: "700",
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

  postImageGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  postImageBox: {
    width: 86,
    height: 86,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.gray100,
  },

  postImage: {
    width: "100%",
    height: "100%",
  },

  fullscreenImageModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
  },

  fullscreenImageBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenImage: {
    width: "100%",
    height: "100%",
  },

  fullscreenCloseButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 58 : 36,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
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

  emptyCommentBox: {
    paddingVertical: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCommentText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray400,
  },

  commentItemWrap: {
    backgroundColor: COLORS.white,
  },

  commentItem: {
    minHeight: 80,
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