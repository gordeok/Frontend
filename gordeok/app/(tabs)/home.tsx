// 홈 화면

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getPosts } from "@/services/post";
import { getIdolMembers } from "@/services/idol";
import { getFavoriteIdols, getFavoriteMembers } from "@/services/user";
import type { PostListItem } from "@/types/post";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  green: "#31C48D",
  orange: "#E7A533",
  red: "#FF6B6B",
  beige: "#EDE8DE",
};

const MEMBER_GAP = 8;
const MEMBER_BOX_WIDTH = (SCREEN_WIDTH - 44 - 32 - MEMBER_GAP * 2) / 3;

const COMPLETED_MEMBER_STORAGE_KEY = "GO_REUDEOK_COMPLETED_MEMBER_ITEMS";

type FavoriteGroupForHome = {
  id: string;
  name: string;
  displayName: string;
  shortName: string;
  color: string;
  members: string[];
  favorites: string[];
};

type CompletedMemberItem = {
  postId: string;
  memberItemId: string;
  selectedMember?: string;
  completedAt?: string;
};

type DisplayPost = {
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
  components: string[];
  deliveryMethod: string;
  members: {
    memberItemId: string;
    name: string;
    state: string;
    price: number;
  }[];
};

export default function HomeScreen() {
  const router = useRouter();
  const postRequestIdRef = useRef(0);

  const [selectedGroups, setSelectedGroups] = useState<FavoriteGroupForHome[]>(
    []
  );
  const [isFavoriteLoaded, setIsFavoriteLoaded] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedFavoriteMember, setSelectedFavoriteMember] = useState<
    string | null
  >(null);

  const [apiPosts, setApiPosts] = useState<PostListItem[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [postError, setPostError] = useState("");
  const [completedMembers, setCompletedMembers] = useState<
    CompletedMemberItem[]
  >([]);

  const groupParam = useMemo(() => {
    return selectedGroups.map((group) => group.id).join(",");
  }, [selectedGroups]);

  const memberParam = useMemo(() => {
    return selectedGroups
      .flatMap((group) =>
        group.favorites.map((favorite) => `${group.id}-${favorite}`)
      )
      .join(",");
  }, [selectedGroups]);

  useFocusEffect(
    useCallback(() => {
      const loadCompletedMembers = async () => {
        try {
          const saved = await AsyncStorage.getItem(
            COMPLETED_MEMBER_STORAGE_KEY
          );
          const parsed = saved ? JSON.parse(saved) : [];

          setCompletedMembers(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.log("모집완료 상태 불러오기 실패:", error);
          setCompletedMembers([]);
        }
      };

      loadCompletedMembers();
    }, [])
  );

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsFavoriteLoaded(false);

        const favoriteIdols = await getFavoriteIdols();
        const favoriteMembers = await getFavoriteMembers();

        const groupsWithMembers = await Promise.all(
          favoriteIdols.map(async (idol) => {
            let allMembers: { id: number; idolId: number; name: string }[] = [];

            try {
              allMembers = await getIdolMembers(idol.id);
            } catch (error) {
              console.log("아이돌 멤버 목록 조회 실패:", error);
              allMembers = [];
            }

            const myFavoriteNames = favoriteMembers
              .filter((member) => Number(member.idolId) === Number(idol.id))
              .map((member) => member.name);

            return {
              id: String(idol.id),
              name: idol.name,
              displayName: idol.name,
              shortName: idol.code
                ? idol.code.toUpperCase().slice(0, 5)
                : idol.name.slice(0, 3),
              color: getGroupColor(idol.code || idol.name),
              members: allMembers.map((member) => member.name),
              favorites: myFavoriteNames,
            };
          })
        );

        setSelectedGroups(groupsWithMembers);

        setSelectedGroupId((prev) => {
          if (prev && groupsWithMembers.some((group) => group.id === prev)) {
            return prev;
          }

          return groupsWithMembers[0]?.id ?? null;
        });
      } catch (error) {
        console.log("최애 정보 불러오기 실패:", error);
        setSelectedGroups([]);
        setSelectedGroupId(null);
      } finally {
        setIsFavoriteLoaded(true);
      }
    };

    loadFavorites();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      setSelectedFavoriteMember(null);
      return;
    }

    const selectedGroup = selectedGroups.find(
      (group) => group.id === selectedGroupId
    );

    if (
      selectedFavoriteMember &&
      selectedGroup &&
      !selectedGroup.favorites.includes(selectedFavoriteMember)
    ) {
      setSelectedFavoriteMember(null);
    }
  }, [selectedGroups, selectedGroupId, selectedFavoriteMember]);

  const loadPosts = useCallback(async () => {
    if (!isFavoriteLoaded) return;

    if (selectedGroups.length === 0) {
      setApiPosts([]);
      return;
    }

    const selectedGroup = selectedGroupId
      ? selectedGroups.find((group) => group.id === selectedGroupId)
      : null;

    const requestId = postRequestIdRef.current + 1;
    postRequestIdRef.current = requestId;

    try {
      setIsPostsLoading(true);
      setPostError("");

      const response = await getPosts({
        page: 0,
        size: 20,
        sort: "latest",
        idolName: selectedGroup?.displayName,
      });

      if (postRequestIdRef.current !== requestId) {
        return;
      }

      const list = extractPostList(response);
      const uniqueList = removeDuplicateApiPosts(list);

      setApiPosts(uniqueList);
    } catch (error) {
      if (postRequestIdRef.current !== requestId) {
        return;
      }

      console.log("게시글 조회 실패:", error);
      setApiPosts([]);
      setPostError("게시글을 불러오지 못했어요");
    } finally {
      if (postRequestIdRef.current === requestId) {
        setIsPostsLoading(false);
      }
    }
  }, [isFavoriteLoaded, selectedGroups, selectedGroupId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const posts = useMemo(() => {
    return removeDuplicateDisplayPosts(
      normalizeApiPosts(apiPosts, selectedGroups, completedMembers)
    );
  }, [selectedGroups, apiPosts, completedMembers]);

  const filteredPosts: DisplayPost[] = posts.filter((post) => {
    const matchesGroup = selectedGroupId
      ? post.groupId === selectedGroupId
      : true;

    const matchesFavoriteMember = selectedFavoriteMember
      ? post.members.some(
          (member) =>
            member.name === selectedFavoriteMember && member.state === "모집중"
        )
      : true;

    return matchesGroup && matchesFavoriteMember;
  });

  const visibleFavoriteGroups = selectedGroupId
    ? selectedGroups.filter((group) => group.id === selectedGroupId)
    : selectedGroups;

  const shouldShowEmpty = isFavoriteLoaded && selectedGroups.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>GO르덕</Text>

            <View style={styles.headerIcons}>
              <Pressable
                onPress={() => router.push("/bookmark-list")}
                hitSlop={10}
                style={styles.iconButton}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={22}
                  color={COLORS.black}
                />
              </Pressable>

              <Pressable
                onPress={() => router.push("/notification")}
                hitSlop={10}
                style={styles.iconButton}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={COLORS.black}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={COLORS.gray500} />
            <TextInput
              style={styles.searchInput}
              placeholder="원하는 분철을 검색해 보세요."
              placeholderTextColor={COLORS.gray500}
            />
          </View>

          {shouldShowEmpty ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>선택한 최애 그룹이 없어요</Text>
              <Text style={styles.emptyText}>
                온보딩에서 그룹과 최애 멤버를 선택하면 여기에 표시돼요.
              </Text>
            </View>
          ) : selectedGroups.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>최애 정보를 불러오는 중이에요</Text>
            </View>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupList}
              >
                <Pressable
                  style={styles.addGroupButton}
                  onPress={() =>
                    router.push({
                      pathname: "/group-edit",
                      params: {
                        groups: groupParam,
                        members: memberParam,
                      },
                    } as any)
                  }
                >
                  <Ionicons name="add" size={28} color={COLORS.black} />
                </Pressable>

                {selectedGroups.map((group) => {
                  const isSelected = selectedGroupId === group.id;

                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => {
                        setSelectedGroupId((prev) =>
                          prev === group.id ? null : group.id
                        );
                        setSelectedFavoriteMember(null);
                      }}
                      style={styles.groupItem}
                    >
                      <View
                        style={[
                          styles.groupCircle,
                          {
                            backgroundColor: group.color,
                            borderColor: isSelected
                              ? COLORS.yellow
                              : COLORS.gray300,
                            borderWidth: isSelected ? 3 : 1,
                          },
                        ]}
                      >
                        <Text style={styles.groupInitial}>
                          {group.shortName}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.groupName,
                          isSelected && styles.selectedGroupName,
                        ]}
                        numberOfLines={1}
                      >
                        {group.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.favoriteHeader}>
                <Text style={styles.sectionTitle}>내 최애 분철 보기</Text>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/favorite-edit",
                      params: {
                        groups: groupParam,
                        members: memberParam,
                      },
                    } as any)
                  }
                >
                  <Text style={styles.editText}>최애 편집</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favoriteList}
              >
                {visibleFavoriteGroups.flatMap((group) =>
                  group.favorites.map((favorite) => {
                    const isFavoriteSelected =
                      selectedGroupId === group.id &&
                      selectedFavoriteMember === favorite;

                    return (
                      <Pressable
                        key={`${group.id}-${favorite}`}
                        style={[
                          styles.favoriteChip,
                          isFavoriteSelected && styles.favoriteChipSelected,
                        ]}
                        onPress={() => {
                          setSelectedGroupId(group.id);
                          setSelectedFavoriteMember((prev) =>
                            prev === favorite && selectedGroupId === group.id
                              ? null
                              : favorite
                          );
                        }}
                      >
                        <View
                          style={[
                            styles.favoriteImage,
                            isFavoriteSelected && styles.favoriteImageSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.favoriteInitial,
                              isFavoriteSelected &&
                                styles.favoriteInitialSelected,
                            ]}
                          >
                            {favorite[0]}
                          </Text>
                        </View>

                        <View>
                          <Text
                            style={[
                              styles.favoriteName,
                              isFavoriteSelected &&
                                styles.favoriteNameSelected,
                            ]}
                          >
                            {favorite}
                          </Text>
                          <Text
                            style={[
                              styles.favoriteGroupName,
                              isFavoriteSelected &&
                                styles.favoriteGroupNameSelected,
                            ]}
                          >
                            {group.name}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.postList}>
                {isPostsLoading && filteredPosts.length === 0 ? (
                  <View style={styles.noPostBox}>
                    <Text style={styles.noPostTitle}>
                      분철 글을 불러오는 중이에요
                    </Text>
                  </View>
                ) : postError ? (
                  <View style={styles.noPostBox}>
                    <Text style={styles.noPostTitle}>{postError}</Text>
                  </View>
                ) : filteredPosts.length === 0 ? (
                  <View style={styles.noPostBox}>
                    <Text style={styles.noPostTitle}>
                      모집중인 분철 글이 없어요
                    </Text>
                  </View>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={`post-${post.id}`}
                      post={post}
                      onPress={() =>
                        router.push({
                          pathname: "/divide-detail",
                          params: {
                            postId: String(post.id),
                            postData: JSON.stringify(post),
                            groups: groupParam,
                            members: memberParam,
                          },
                        } as any)
                      }
                    />
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>

        <Pressable
          style={styles.writeButton}
          onPress={() =>
            router.push({
              pathname: "/divide-create",
              params: {
                groups: groupParam,
                members: memberParam,
              },
            } as any)
          }
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.writeText}>글쓰기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function extractPostList(response: any): PostListItem[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function normalizeApiPosts(
  apiPosts: PostListItem[],
  selectedGroups: FavoriteGroupForHome[],
  completedMembers: CompletedMemberItem[]
): DisplayPost[] {
  return apiPosts.reduce<DisplayPost[]>((result, post: any) => {
    const postId = post.id ?? post.postId;

    if (postId === undefined || postId === null) {
      return result;
    }

    const matchedGroup = selectedGroups.find(
      (group) =>
        group.displayName === post.idolName ||
        group.name === post.idolName ||
        group.id === String(post.idolName)
    );

    if (!matchedGroup) return result;

    const members = Array.isArray(post.memberItems)
      ? post.memberItems.map((member: any) => {
          const memberItemId = String(
            member.id ??
              member.memberItemId ??
              member.itemId ??
              member.divideMemberItemId ??
              member.postMemberItemId ??
              member.memberName
          );

          const isCompletedByLocal = isCompletedMember(
            String(postId),
            memberItemId,
            completedMembers
          );

          return {
            memberItemId,
            name: member.memberName,
            state: isCompletedByLocal
              ? "모집완료"
              : getMemberStatus(member.status),
            price: Number(member.price ?? 0),
          };
        })
      : [];

    const baseCompleted =
      post.status === "COMPLETED" ||
      post.status === "CLOSED" ||
      post.status === "모집완료";

    const allMembersCompleted =
      members.length > 0 &&
      members.every(
        (member: DisplayPost["members"][number]) => member.state === "모집완료"
      );

    result.push({
      id: String(postId),
      groupId: matchedGroup.id,
      groupName: post.idolName,
      userName: post.nickname || "알 수 없음",
      title: post.title || "제목 없음",
      albumName: post.albumName || "",
      time: formatTime(post.createdAt),
      date: post.createdAt?.slice(0, 10) ?? "",
      status:
        baseCompleted || allMembersCompleted
          ? "모집완료"
          : getPostStatus(post.status, Boolean(post.almostFull)),
      completed: baseCompleted || allMembersCompleted,
      content: post.description || "",
      components: Array.isArray(post.components) ? post.components : [],
      deliveryMethod: post.shippingFeeType || "",
      members,
    });

    return result;
  }, []);
}

function isCompletedMember(
  postId: string,
  memberItemId: string,
  completedMembers: CompletedMemberItem[]
) {
  return completedMembers.some((item) => {
    return (
      String(item.postId) === String(postId) &&
      String(item.memberItemId) === String(memberItemId)
    );
  });
}

function removeDuplicateApiPosts(posts: PostListItem[]) {
  const map = new Map<string, any>();

  posts.forEach((post: any) => {
    const semanticKey = [
      post.userId ?? post.nickname ?? "",
      post.idolName ?? "",
      post.albumName ?? "",
      post.title ?? "",
      post.description ?? "",
    ].join("|");

    const current = map.get(semanticKey);

    if (!current) {
      map.set(semanticKey, post);
      return;
    }

    const currentMemberCount = Array.isArray(current.memberItems)
      ? current.memberItems.length
      : 0;

    const nextMemberCount = Array.isArray(post.memberItems)
      ? post.memberItems.length
      : 0;

    const currentTime = current.createdAt
      ? new Date(current.createdAt).getTime()
      : 0;

    const nextTime = post.createdAt ? new Date(post.createdAt).getTime() : 0;

    const shouldReplace =
      nextMemberCount > currentMemberCount ||
      (nextMemberCount === currentMemberCount && nextTime > currentTime);

    if (shouldReplace) {
      map.set(semanticKey, post);
    }
  });

  return Array.from(map.values());
}

function removeDuplicateDisplayPosts(posts: DisplayPost[]) {
  const map = new Map<string, DisplayPost>();

  posts.forEach((post) => {
    const semanticKey = [
      post.userName,
      post.groupName,
      post.albumName,
      post.title,
      post.content,
    ].join("|");

    const current = map.get(semanticKey);

    if (!current) {
      map.set(semanticKey, post);
      return;
    }

    if (post.members.length > current.members.length) {
      map.set(semanticKey, post);
    }
  });

  return Array.from(map.values());
}

function getGroupColor(codeOrName: string) {
  const key = codeOrName.toLowerCase();

  if (key.includes("bts")) return "#E8D8FF";
  if (key.includes("seventeen")) return "#DDEFFF";
  if (key.includes("stray")) return "#FFE1E1";
  if (key.includes("aespa")) return "#E5E9FF";
  if (key.includes("newjeans")) return "#E7FFF7";
  if (key.includes("ive")) return "#FFE6F2";
  if (key.includes("exo")) return "#EFEFEF";
  if (key.includes("nct")) return "#DFFFE1";
  if (key.includes("twice")) return "#FFE8EF";
  if (key.includes("blackpink")) return "#F1E6FF";

  return "#F6C74F";
}

function getPostStatus(status: string, almostFull: boolean) {
  if (status === "COMPLETED" || status === "CLOSED" || status === "모집완료") {
    return "모집완료";
  }

  if (almostFull) {
    return "마감임박";
  }

  return "모집중";
}

function getMemberStatus(status: string) {
  if (status === "COMPLETED" || status === "모집완료") return "모집완료";
  if (status === "RESERVED" || status === "예약중") return "예약중";
  return "모집중";
}

function formatTime(createdAt: string) {
  if (!createdAt) return "";

  const created = new Date(createdAt);
  const now = new Date();
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);

  if (Number.isNaN(diff)) return "";
  if (diff < 1) return "방금 전";
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;

  return `${Math.floor(diff / 1440)}일 전`;
}

function PostCard({
  post,
  onPress,
}: {
  post: DisplayPost;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={post.completed}
      style={({ pressed }) => [
        styles.postCard,
        pressed && !post.completed && styles.postCardPressed,
        post.completed && styles.postCardCompleted,
      ]}
    >
      <View style={styles.postTop}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileInitial}>{post.userName[0]}</Text>
        </View>

        <View style={styles.postInfo}>
          <View style={styles.postMetaRow}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.timeText}>{post.time}</Text>
          </View>

          <View style={styles.titleRow}>
            <View style={styles.titleTextWrap}>
              <Text style={styles.postTitle}>{post.title}</Text>
            </View>

            {post.status === "마감임박" && (
              <View style={styles.deadlineBadge}>
                <Text style={styles.deadlineText}>마감임박</Text>
              </View>
            )}

            {post.status === "모집완료" && (
              <View style={styles.completeBadge}>
                <Text style={styles.completeText}>모집완료</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.memberGrid}>
        {post.members.map((member, index) => (
          <View
            key={`${post.id}-${member.memberItemId}-${member.name}-${index}`}
            style={[
              styles.memberBox,
              member.state === "모집완료" && styles.memberBoxCompleted,
            ]}
          >
            <Text
              style={[
                styles.memberName,
                member.state === "모집완료" && styles.disabledText,
              ]}
              numberOfLines={1}
            >
              {member.name}
            </Text>

            <View style={styles.memberBottom}>
              <View style={styles.stateRow}>
                <View
                  style={[
                    styles.stateDot,
                    member.state === "모집중" && styles.greenDot,
                    member.state === "예약중" && styles.orangeDot,
                    member.state === "모집완료" && styles.grayDot,
                  ]}
                />

                <Text
                  style={[
                    styles.stateText,
                    member.state === "모집완료" && styles.disabledText,
                  ]}
                  numberOfLines={1}
                >
                  {member.state}
                </Text>
              </View>

              <Text
                style={[
                  styles.priceText,
                  member.state === "모집완료" && styles.disabledText,
                ]}
                numberOfLines={1}
              >
                ₩{member.price.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Pressable>
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
    paddingTop: 0,
    paddingHorizontal: 22,
    paddingBottom: 170,
  },

  header: {
    height: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  logo: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.black,
  },

  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  searchBox: {
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.gray100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 22,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.black,
  },

  emptyBox: {
    marginTop: 90,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 20,
  },

  noPostBox: {
    marginTop: 78,
    paddingVertical: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  noPostTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 7,
  },

  groupList: {
    gap: 14,
    paddingBottom: 22,
  },

  addGroupButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },

  groupItem: {
    width: 76,
    alignItems: "center",
  },

  groupCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  groupInitial: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.black,
  },

  groupName: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.gray900,
    textAlign: "center",
  },

  selectedGroupName: {
    color: COLORS.black,
    fontWeight: "900",
  },

  favoriteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.black,
  },

  editText: {
    fontSize: 13,
    color: COLORS.gray500,
  },

  favoriteList: {
    gap: 8,
    paddingBottom: 26,
  },

  favoriteChip: {
    minHeight: 38,
    borderRadius: 19,
    paddingLeft: 5,
    paddingRight: 14,
    backgroundColor: COLORS.gray200,
    flexDirection: "row",
    alignItems: "center",
  },

  favoriteChipSelected: {
    backgroundColor: COLORS.black,
  },

  favoriteImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.beige,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    overflow: "hidden",
  },

  favoriteImageSelected: {
    backgroundColor: COLORS.white,
  },

  favoriteInitial: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: "900",
  },

  favoriteInitialSelected: {
    color: COLORS.black,
  },

  favoriteName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.black,
  },

  favoriteNameSelected: {
    color: COLORS.white,
    fontWeight: "700",
  },

  favoriteGroupName: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.gray500,
    marginTop: 1,
  },

  favoriteGroupNameSelected: {
    color: COLORS.gray300,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sortButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  sortText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.black,
  },

  postList: {
    gap: 14,
  },

  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  postCardPressed: {
    backgroundColor: "#FAFAFA",
    transform: [{ scale: 0.99 }],
  },

  postCardCompleted: {
    opacity: 0.42,
  },

  postTop: {
    flexDirection: "row",
    marginBottom: 16,
  },

  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.yellow,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.white,
  },

  postInfo: {
    flex: 1,
    justifyContent: "center",
  },

  postMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray700,
  },

  timeText: {
    fontSize: 11,
    color: COLORS.gray500,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3,
  },

  titleTextWrap: {
    flex: 1,
    marginRight: 8,
  },

  postTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    lineHeight: 23,
  },

  deadlineBadge: {
    backgroundColor: "#FFECEC",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 2,
  },

  deadlineText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.red,
  },

  completeBadge: {
    backgroundColor: COLORS.gray200,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 2,
  },

  completeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.gray500,
  },

  memberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MEMBER_GAP,
  },

  memberBox: {
    width: MEMBER_BOX_WIDTH,
    minHeight: 58,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    justifyContent: "space-between",
  },

  memberBoxCompleted: {
    backgroundColor: "#FAFAFA",
  },

  memberName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 6,
  },

  memberBottom: {
    gap: 3,
  },

  stateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },

  greenDot: {
    backgroundColor: COLORS.green,
  },

  orangeDot: {
    backgroundColor: COLORS.orange,
  },

  grayDot: {
    backgroundColor: COLORS.gray300,
  },

  stateText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.gray700,
  },

  disabledText: {
    color: COLORS.gray400,
  },

  priceText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.black,
    textAlign: "right",
  },

  writeButton: {
    position: "absolute",
    right: 22,
    bottom: 28,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.yellow,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  writeText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.white,
    marginLeft: 5,
  },
});