// 분철 상세 화면

import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookmark } from "@/contexts/BookmarkContext";
import { getPostDetail, reserveMemberItem } from "../services/post";
import type { PostDetailResponse } from "../types/post";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SHEET_HALF_HEIGHT = SCREEN_HEIGHT * 0.52;
const SHEET_EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.82;
const SHEET_HIDDEN_HEIGHT = 0;

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#666666",
  gray500: "#999999",
  gray400: "#B8B8B8",
  gray300: "#DDDDDD",
  gray200: "#EEEEEE",
  gray100: "#F6F6F6",
  yellow: "#F7C94B",
  lightYellow: "#FFF4CC",
  green: "#31C48D",
  lightGreen: "#DDF8E8",
  orange: "#E7A533",
  blue: "#4C8DFF",
  lightBlue: "#E8F1FF",
  beige: "#EDE8DE",
  line: "#F2EDE6",
};

type MemberState = "모집중" | "예약중" | "모집완료";

type DivideMember = {
  memberItemId?: number;
  name: string;
  state: MemberState;
  price: number;
};

type DividePost = {
  id: string;
  groupId: string;
  groupName: string;
  userName: string;
  title: string;
  albumName: string;
  time: string;
  date: string;
  status: string;
  completed: boolean;
  content: string;
  components?: string[];
  deliveryMethod: string;
  members: DivideMember[];
};


function getMemberState(status: string): MemberState {
  if (status === "COMPLETED" || status === "CLOSED" || status === "모집완료") {
    return "모집완료";
  }

  if (status === "RESERVED" || status === "예약중") {
    return "예약중";
  }

  return "모집중";
}

function mapApiPostToDetailPost(post: PostDetailResponse): DividePost {
  return {
    id: String(post.postId),
    groupId: post.idolName,
    groupName: post.idolName,
    userName: post.seller?.nickname ?? "판매자",
    title: post.title,
    albumName: post.albumName ?? "",
    time: "",
    date: "",
    status: post.status,
    completed: post.status === "COMPLETED" || post.status === "CLOSED",
    content: post.description ?? "",
    components: post.components ?? [],
    deliveryMethod: post.shippingFeeType ?? "",
    members: (post.memberItems ?? []).map((member) => ({
      memberItemId: member.id,
      name: member.memberName,
      state: getMemberState(member.status),
      price: member.price,
    })),
  };
}

export default function DivideDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isBookmarked, toggleBookmark } = useBookmark();

  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(
    null
  );
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  const sheetHeight = useRef(new Animated.Value(SHEET_HIDDEN_HEIGHT)).current;
  const dimAnim = useRef(new Animated.Value(0)).current;

  const currentSheetHeight = useRef(SHEET_HIDDEN_HEIGHT);
  const gestureStartHeight = useRef(SHEET_HIDDEN_HEIGHT);

  const postData = typeof params.postData === "string" ? params.postData : "";
  const postIdParam = typeof params.postId === "string" ? params.postId : "";
  const groupParam = typeof params.groups === "string" ? params.groups : "";
  const memberParam = typeof params.members === "string" ? params.members : "";

  const [apiPost, setApiPost] = useState<DividePost | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    if (postData || !postIdParam) return;

    let alive = true;

    const loadPostDetail = async () => {
      try {
        const data = await getPostDetail(postIdParam);

        if (!alive) return;

        setApiPost(mapApiPostToDetailPost(data));
      } catch (error) {
        console.log("게시글 상세 API 연결 전이거나 조회 실패:", error);
      }
    };

    loadPostDetail();

    return () => {
      alive = false;
    };
  }, [postData, postIdParam]);

  const post = useMemo<DividePost | null>(() => {
    if (postData) {
      try {
        return JSON.parse(postData);
      } catch {
        return null;
      }
    }

    return apiPost;
  }, [postData, apiPost]);

  const selectedMember = post?.members.find(
    (member) => member.name === selectedMemberName
  );

  const isJoinEnabled = !!selectedMember && !isReserving;

  const moveSheetTo = (toValue: number) => {
    currentSheetHeight.current = toValue;
    setIsSheetExpanded(toValue === SHEET_EXPANDED_HEIGHT);

    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,
      tension: 90,
      friction: 14,
    }).start(() => {
      currentSheetHeight.current = toValue;
    });
  };

  const closeMemberSheet = () => {
    Animated.parallel([
      Animated.timing(sheetHeight, {
        toValue: SHEET_HIDDEN_HEIGHT,
        duration: 190,
        useNativeDriver: false,
      }),
      Animated.timing(dimAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      currentSheetHeight.current = SHEET_HIDDEN_HEIGHT;
      gestureStartHeight.current = SHEET_HIDDEN_HEIGHT;
      setIsSheetExpanded(false);
      setIsMemberSheetOpen(false);
    });
  };

  useEffect(() => {
    if (!isMemberSheetOpen) return;

    sheetHeight.setValue(SHEET_HIDDEN_HEIGHT);
    dimAnim.setValue(0);
    currentSheetHeight.current = SHEET_HIDDEN_HEIGHT;
    gestureStartHeight.current = SHEET_HIDDEN_HEIGHT;
    setIsSheetExpanded(false);

    Animated.parallel([
      Animated.spring(sheetHeight, {
        toValue: SHEET_HALF_HEIGHT,
        useNativeDriver: false,
        tension: 90,
        friction: 14,
      }),
      Animated.timing(dimAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      currentSheetHeight.current = SHEET_HALF_HEIGHT;
      gestureStartHeight.current = SHEET_HALF_HEIGHT;
      setIsSheetExpanded(false);
    });
  }, [isMemberSheetOpen, sheetHeight, dimAnim]);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 4;
      },

      onPanResponderGrant: () => {
        sheetHeight.stopAnimation((value) => {
          gestureStartHeight.current = value;
          currentSheetHeight.current = value;
        });
      },

      onPanResponderMove: (_, gestureState) => {
        const nextHeight = gestureStartHeight.current - gestureState.dy;

        const limitedHeight = Math.min(
          Math.max(nextHeight, SHEET_HIDDEN_HEIGHT),
          SHEET_EXPANDED_HEIGHT
        );

        sheetHeight.setValue(limitedHeight);
        currentSheetHeight.current = limitedHeight;
      },

      onPanResponderRelease: (_, gestureState) => {
        const finalHeight = currentSheetHeight.current;

        if (
          gestureState.dy > 130 ||
          gestureState.vy > 1.1 ||
          finalHeight < SHEET_HALF_HEIGHT - 100
        ) {
          closeMemberSheet();
          return;
        }

        if (gestureState.dy < -35 || gestureState.vy < -0.45) {
          moveSheetTo(SHEET_EXPANDED_HEIGHT);
          return;
        }

        if (gestureState.dy > 35 || gestureState.vy > 0.45) {
          moveSheetTo(SHEET_HALF_HEIGHT);
          return;
        }

        if (finalHeight > (SHEET_HALF_HEIGHT + SHEET_EXPANDED_HEIGHT) / 2) {
          moveSheetTo(SHEET_EXPANDED_HEIGHT);
        } else {
          moveSheetTo(SHEET_HALF_HEIGHT);
        }
      },
    })
  ).current;

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>분철 글을 찾을 수 없어요</Text>

          <Pressable style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const bookmarked = isBookmarked(post.id);

  const handleBookmark = () => {
    toggleBookmark({
      id: post.id,
      title: post.title,
      sellerName: post.userName,
      groupName: post.groupName,
      postData: JSON.stringify(post),
      groups: groupParam,
      members: memberParam,
    });
  };

  const handleOpenMemberSheet = () => {
    setIsMemberSheetOpen(true);
  };

  const handleSelectMember = (member: DivideMember) => {
    if (member.state !== "모집중") return;

    setSelectedMemberName((prev) =>
      prev === member.name ? null : member.name
    );
  };

  const handleJoin = async () => {
    if (!selectedMember) return;

    try {
      setIsReserving(true);

      if (selectedMember.memberItemId) {
        await reserveMemberItem(selectedMember.memberItemId);
      }
    } catch (error) {
      console.log("멤버 예약 API 연결 전이거나 예약 실패:", error);
    } finally {
      setIsReserving(false);
      setIsMemberSheetOpen(false);

      router.push({
        pathname: "/divide-join",
        params: {
          postId: post.id,
          memberItemId: selectedMember.memberItemId
            ? String(selectedMember.memberItemId)
            : "",
          postData: JSON.stringify(post),
          selectedMember: selectedMember.name,
          selectedPrice: String(selectedMember.price),
          groups: groupParam,
          members: memberParam,
        },
      } as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageBox}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={COLORS.black} />
            </Pressable>

            <View style={styles.imageCount}>
              <Text style={styles.imageCountText}>1 / 2</Text>
            </View>
          </View>

          <Pressable style={styles.profileSection} 
            onPress={() => router.push({
              pathname: "/seller-profile/[id]",
              params: { id: "1" },
            })}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>{post.userName[0]}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.writer} numberOfLines={1}>
                {post.userName}
              </Text>

              <View style={styles.scoreRow}>
                <View style={styles.scoreBar}>
                  <View style={styles.scoreFill} />
                </View>

                <Text style={styles.score}>87점</Text>
                <Text style={styles.scoreLabel}> 신뢰점수</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={22} color={COLORS.black} />
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.contentSection}>
            <View style={styles.metaRow}>
              <Text style={styles.groupName}>{post.groupName}</Text>
              <Text style={styles.dateText}>{post.date}</Text>
            </View>

            <Text style={styles.title}>{post.title}</Text>

            <View style={styles.smallDivider} />

            <Text style={styles.contentText}>{post.content}</Text>

            <View style={styles.countRow}>
              <Text style={styles.countText}>
                북마크 {bookmarked ? "12" : "11"}
              </Text>
              <Text style={styles.countText}>조회 705</Text>
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>멤버별 모집 상태</Text>

            <View style={styles.memberGrid}>
              {post.members.map((member, index) => (
                <View key={`${member.name}-${index}`} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.name}
                    </Text>

                    <Text
                      style={[
                        styles.priceText,
                        member.state === "모집완료" && styles.donePriceText,
                      ]}
                    >
                      ₩{member.price.toLocaleString()}
                    </Text>
                  </View>

                  <StatusBadge state={member.state} />
                </View>
              ))}
            </View>

            {post.components && post.components.length > 0 && (
              <>
                <View style={styles.sectionDivider} />

                <Text style={styles.sectionTitle}>분철 구성품</Text>

                <View style={styles.itemList}>
                  {post.components.map((item) => (
                    <View key={item} style={styles.itemRow}>
                      <Ionicons name="checkmark" size={17} color={COLORS.green} />
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>배송 방법</Text>

            <View style={styles.deliveryTag}>
              <Text style={styles.deliveryText}>{post.deliveryMethod}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable style={styles.bookmarkButton} onPress={handleBookmark}>
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={28}
              color={bookmarked ? COLORS.yellow : COLORS.black}
            />
          </Pressable>

          <Pressable style={styles.selectButton} onPress={handleOpenMemberSheet}>
            <Text style={styles.selectButtonText}>분철 멤버 선택</Text>
          </Pressable>
        </View>

        <Modal
          visible={isMemberSheetOpen}
          transparent
          animationType="none"
          onRequestClose={closeMemberSheet}
        >
          <View style={styles.modalWrap}>
            <Animated.View style={[styles.dimBackground, { opacity: dimAnim }]}>
              <Pressable
                style={styles.dimPressArea}
                onPress={closeMemberSheet}
              />
            </Animated.View>

            <Animated.View style={[styles.memberSheet, { height: sheetHeight }]}>
              <View
                style={styles.sheetDragArea}
                {...sheetPanResponder.panHandlers}
              >
                <View style={styles.sheetHandle} />
              </View>

              <ScrollView
                style={styles.sheetScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.sheetScrollContent,
                  isSheetExpanded && styles.sheetScrollContentExpanded,
                ]}
              >
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>멤버 선택</Text>
                  <Text style={styles.sheetSubtitle}>
                    모집 중인 멤버만 선택할 수 있어요
                  </Text>
                </View>

                <View style={styles.sheetMemberList}>
                  {post.members.map((member, index) => {
                    const isSelected = selectedMemberName === member.name;
                    const isDisabled = member.state !== "모집중";

                    return (
                      <Pressable
                        key={`${member.name}-${index}`}
                        disabled={isDisabled}
                        onPress={() => handleSelectMember(member)}
                        style={[
                          styles.sheetMemberCard,
                          isSelected && styles.sheetSelectedMemberCard,
                          isDisabled && styles.sheetDisabledMemberCard,
                        ]}
                      >
                        <View style={styles.sheetMemberInfo}>
                          <Text
                            style={[
                              styles.sheetMemberName,
                              isDisabled && styles.sheetDisabledText,
                            ]}
                            numberOfLines={1}
                          >
                            {member.name}
                          </Text>

                          <Text
                            style={[
                              styles.sheetMemberPrice,
                              isDisabled && styles.sheetDisabledText,
                            ]}
                          >
                            ₩{member.price.toLocaleString()}
                          </Text>
                        </View>

                        <StatusBadge state={member.state} />

                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && styles.radioOuterSelected,
                            isDisabled && styles.radioDisabled,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {!isSheetExpanded && (
                  <Pressable
                    disabled={!isJoinEnabled}
                    onPress={handleJoin}
                    style={[
                      styles.sheetJoinButton,
                      styles.sheetJoinButtonInScroll,
                      !isJoinEnabled && styles.sheetJoinButtonDisabled,
                    ]}
                  >
                    <Text style={styles.sheetJoinButtonText}>
                      분철 참여글 작성하기
                    </Text>
                  </Pressable>
                )}
              </ScrollView>

              {isSheetExpanded && (
                <View style={styles.sheetFixedBottom}>
                  <Pressable
                    disabled={!isJoinEnabled}
                    onPress={handleJoin}
                    style={[
                      styles.sheetJoinButton,
                      !isJoinEnabled && styles.sheetJoinButtonDisabled,
                    ]}
                  >
                    <Text style={styles.sheetJoinButtonText}>
                      분철 참여글 작성하기
                    </Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function StatusBadge({ state }: { state: MemberState }) {
  const isOpen = state === "모집중";
  const isReserved = state === "예약중";
  const isDone = state === "모집완료";

  return (
    <View
      style={[
        styles.statusBadge,
        isOpen && styles.statusOpen,
        isReserved && styles.statusReserved,
        isDone && styles.statusDone,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          isOpen && styles.statusOpenText,
          isReserved && styles.statusReservedText,
          isDone && styles.statusDoneText,
        ]}
      >
        {state}
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

  scrollContent: {
    paddingBottom: 140,
  },

  imageBox: {
    height: 300,
    backgroundColor: COLORS.beige,
    position: "relative",
  },

  backButton: {
    position: "absolute",
    top: 14,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  imageCount: {
    position: "absolute",
    right: 16,
    bottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  imageCountText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  profileSection: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: COLORS.white,
  },

  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D8D2C8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  profileInitial: {
    fontSize: 18,
    fontWeight: "900",
    color: "#69645D",
  },

  profileInfo: {
    flex: 1,
    justifyContent: "center",
    marginRight: 12,
  },

  writer: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 8,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  scoreBar: {
    width: 96,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#EFEAE2",
    overflow: "hidden",
    marginRight: 8,
  },

  scoreFill: {
    width: "87%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.yellow,
  },

  score: {
    fontSize: 12,
    fontWeight: "900",
    color: "#F2B600",
  },

  scoreLabel: {
    fontSize: 12,
    color: COLORS.gray400,
  },

  divider: {
    height: 0.7,
    backgroundColor: COLORS.line,
  },

  contentSection: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  groupName: {
    fontSize: 13,
    color: COLORS.gray400,
  },

  dateText: {
    fontSize: 13,
    color: COLORS.gray400,
  },

  title: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 27,
  },

  smallDivider: {
    height: 0.7,
    backgroundColor: COLORS.line,
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: -22,
  },

  contentText: {
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.black,
  },

  countRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  countText: {
    fontSize: 14,
    color: COLORS.gray400,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginTop: 20,
    marginBottom: 16,
    marginHorizontal: -22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 12,
  },

  memberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  memberCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    minHeight: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  memberInfo: {
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },

  memberName: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 19,
  },

  priceText: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.gray700,
    lineHeight: 17,
  },

  donePriceText: {
    color: COLORS.gray400,
    textDecorationLine: "line-through",
  },

  statusBadge: {
    minWidth: 54,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  statusOpen: {
    backgroundColor: COLORS.lightGreen,
  },

  statusReserved: {
    backgroundColor: COLORS.lightYellow,
  },

  statusDone: {
    backgroundColor: COLORS.gray100,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
  },

  statusOpenText: {
    color: COLORS.green,
  },

  statusReservedText: {
    color: COLORS.orange,
  },

  statusDoneText: {
    color: COLORS.gray400,
  },

  itemList: {
    gap: 8,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  itemText: {
    fontSize: 15,
    color: COLORS.black,
  },

  deliveryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.lightBlue,
    marginBottom: 8,
  },

  deliveryText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.blue,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  bookmarkButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },

  selectButton: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },

  selectButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
  },

  modalWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },

  dimBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  dimPressArea: {
    flex: 1,
  },

  memberSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },

  sheetDragArea: {
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },

  sheetHandle: {
    width: 68,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#EFEFEF",
  },

  sheetScroll: {
    flex: 1,
  },

  sheetScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 36,
  },

  sheetScrollContentExpanded: {
    paddingBottom: 112,
  },

  sheetHeader: {
    marginBottom: 18,
  },

  sheetTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 8,
  },

  sheetSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray400,
  },

  sheetMemberList: {
    gap: 10,
  },

  sheetMemberCard: {
    height: 72,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  sheetSelectedMemberCard: {
    borderWidth: 2,
    borderColor: COLORS.yellow,
    backgroundColor: COLORS.lightYellow,
  },

  sheetDisabledMemberCard: {
    opacity: 0.45,
  },

  sheetMemberInfo: {
    flex: 1,
    justifyContent: "center",
    marginRight: 10,
  },

  sheetMemberName: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 4,
  },

  sheetMemberPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray700,
  },

  sheetDisabledText: {
    color: COLORS.gray400,
  },

  radioOuter: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  radioOuterSelected: {
    borderColor: COLORS.yellow,
    backgroundColor: COLORS.yellow,
  },

  radioDisabled: {
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },

  sheetFixedBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },

  sheetJoinButton: {
    height: 58,
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetJoinButtonInScroll: {
    marginTop: 16,
    marginBottom: 10,
  },

  sheetJoinButtonDisabled: {
    backgroundColor: COLORS.lightYellow,
  },

  sheetJoinButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 14,
  },

  emptyButton: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.white,
  },
});