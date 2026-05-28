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
  Image,
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

const DEFAULT_PROFILE = require("../../assets/img/profile.jpg");

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://frostily-derby-underpass.ngrok-free.dev";

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

type FavoriteMemberForHome = {
  id: string;
  name: string;
  imageUrl: string;
};

type FavoriteGroupForHome = {
  id: string;
  name: string;
  displayName: string;
  shortName: string;
  color: string;
  imageUrl: string;
  members: string[];
  favorites: FavoriteMemberForHome[];
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
  profileImage: string;
  imageUrl: string;
  title: string;
  albumName: string;
  time: string;
  date: string;
  status: string;
  completed: boolean;
  createdAtTime: number;
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
  const [refreshKey, setRefreshKey] = useState(0);

  const groupParam = useMemo(() => {
    return selectedGroups.map((group) => group.id).join(",");
  }, [selectedGroups]);

  const memberParam = useMemo(() => {
    return selectedGroups
      .flatMap((group) =>
        group.favorites.map((favorite) => `${group.id}-${favorite.name}`)
      )
      .join(",");
  }, [selectedGroups]);

  useFocusEffect(
    useCallback(() => {
      setSelectedGroupId(null);
      setSelectedFavoriteMember(null);
      setRefreshKey((k) => k + 1);

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

        console.log("내 최애 그룹 응답:", favoriteIdols);
        console.log("내 최애 멤버 응답:", favoriteMembers);

        const groupsWithMembers = await Promise.all(
          favoriteIdols.map(async (idol: any) => {
            let allMembers: any[] = [];

            try {
              allMembers = await getIdolMembers(idol.id);
              console.log(`${idol.name} 전체 멤버 응답:`, allMembers);
            } catch (error) {
              console.log("아이돌 멤버 목록 조회 실패:", error);
              allMembers = [];
            }

            const myFavoriteMembers: FavoriteMemberForHome[] = favoriteMembers
              .filter((member: any) => Number(member.idolId) === Number(idol.id))
              .map((member: any) => {
                const matchedMember = allMembers.find(
                  (item: any) =>
                    Number(item.id) === Number(member.id) ||
                    item.name === member.name
                );

                return {
                  id: String(member.id),
                  name: member.name,
                  imageUrl: getImageUrl(member) || getImageUrl(matchedMember),
                };
              });

            return {
              id: String(idol.id),
              name: idol.name,
              displayName: idol.name,
              shortName: idol.code
                ? idol.code.toUpperCase().slice(0, 5)
                : idol.name.slice(0, 3),
              color: getGroupColor(idol.code || idol.name),
              imageUrl: getImageUrl(idol),
              members: allMembers.map((member: any) => member.name),
              favorites: myFavoriteMembers,
            };
          })
        );

        setSelectedGroups(groupsWithMembers);
        setSelectedGroupId(null);
        setSelectedFavoriteMember(null);
      } catch (error) {
        console.log("최애 정보 불러오기 실패:", error);
        setSelectedGroups([]);
        setSelectedGroupId(null);
        setSelectedFavoriteMember(null);
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
      !selectedGroup.favorites.some(
        (favorite) => favorite.name === selectedFavoriteMember
      )
    ) {
      setSelectedFavoriteMember(null);
    }
  }, [selectedGroups, selectedGroupId, selectedFavoriteMember]);

  const loadPosts = useCallback(async () => {
    void refreshKey;
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
        size: 50,
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
  }, [isFavoriteLoaded, selectedGroups, selectedGroupId, refreshKey]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const posts = useMemo(() => {
    return removeDuplicateDisplayPosts(
      normalizeApiPosts(apiPosts, selectedGroups, completedMembers)
    );
  }, [selectedGroups, apiPosts, completedMembers]);

  const filteredPosts: DisplayPost[] = posts
    .filter((post) => {
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
    })
    .sort(sortPostsForHome);

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
            <Text style={styles.logo}>홈</Text>

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
            <View style={styles.emptyBox} />
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
                            backgroundColor: group.imageUrl
                              ? COLORS.white
                              : group.color,
                            borderColor: isSelected
                              ? COLORS.yellow
                              : COLORS.gray300,
                            borderWidth: isSelected ? 3 : 1,
                          },
                        ]}
                      >
                        {group.imageUrl ? (
                          <Image
                            source={{ uri: group.imageUrl }}
                            style={styles.groupImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.groupInitial}>
                            {group.shortName}
                          </Text>
                        )}
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
                        editGroupId: selectedGroupId ?? "",
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
                      selectedFavoriteMember === favorite.name;

                    return (
                      <Pressable
                        key={`${group.id}-${favorite.id}-${favorite.name}`}
                        style={[
                          styles.favoriteChip,
                          isFavoriteSelected && styles.favoriteChipSelected,
                        ]}
                        onPress={() => {
                          setSelectedGroupId(group.id);
                          setSelectedFavoriteMember((prev) =>
                            prev === favorite.name && selectedGroupId === group.id
                              ? null
                              : favorite.name
                          );
                        }}
                      >
                        <View
                          style={[
                            styles.favoriteImage,
                            isFavoriteSelected && styles.favoriteImageSelected,
                          ]}
                        >
                          {favorite.imageUrl ? (
                            <Image
                              source={{ uri: favorite.imageUrl }}
                              style={styles.favoriteMemberImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text
                              style={[
                                styles.favoriteInitial,
                                isFavoriteSelected &&
                                  styles.favoriteInitialSelected,
                              ]}
                            >
                              {favorite.name[0]}
                            </Text>
                          )}
                        </View>

                        <View>
                          <Text
                            style={[
                              styles.favoriteName,
                              isFavoriteSelected &&
                                styles.favoriteNameSelected,
                            ]}
                          >
                            {favorite.name}
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
                  <View style={styles.noPostBox} />
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

function normalizeImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmedUrl = String(url).trim();

  if (!trimmedUrl) return "";

  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith("/")) {
    return `${API_BASE_URL}${trimmedUrl}`;
  }

  return `${API_BASE_URL}/${trimmedUrl}`;
}

function getImageUrl(data: any) {
  if (!data) return "";

  return normalizeImageUrl(
    data.imageUrl ||
      data.profileImage ||
      data.profileImageUrl ||
      data.memberImageUrl ||
      data.idolImageUrl ||
      data.photoUrl ||
      data.image ||
      data.imagePath ||
      data.thumbnailUrl
  );
}

function getProfileImageUrl(data: any) {
  if (!data) return "";

  return normalizeImageUrl(
    data.profileImage ||
      data.profileImageUrl ||
      data.sellerProfileImage ||
      data.authorProfileImage ||
      data.userProfileImage ||
      data.seller?.profileImage ||
      data.seller?.profileImageUrl ||
      data.user?.profileImage ||
      data.user?.profileImageUrl
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

    const postIdolName = String(
      post.idolName ?? post.idol?.name ?? post.groupName ?? post.group?.name ?? ""
    ).trim().toLowerCase();

    const matchedGroup = selectedGroups.find((group) => {
      if (!postIdolName) return false;
      return (
        group.displayName.trim().toLowerCase() === postIdolName ||
        group.name.trim().toLowerCase() === postIdolName ||
        group.id === String(post.idolName)
      );
    });

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
            member.memberName,
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
      userName: post.nickname || post.seller?.nickname || "알 수 없음",
      profileImage: getProfileImageUrl(post) || getProfileImageUrl(post.seller),
      imageUrl: normalizeImageUrl(
        post.imageUrls?.[0] || post.imageUrl || post.thumbnailUrl || post.albumImageUrl || ""
      ),
      title: post.title || "제목 없음",
      albumName: post.albumName || "",
      time: formatTime(post.createdAt),
      date: post.createdAt?.slice(0, 10) ?? "",
      status:
        baseCompleted || allMembersCompleted
          ? "모집완료"
          : getPostStatus(post.status, Boolean(post.almostFull)),
      completed: baseCompleted || allMembersCompleted,
      createdAtTime: getCreatedAtTime(post.createdAt),
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
  memberName: string,
  completedMembers: CompletedMemberItem[]
) {
  return completedMembers.some((item) => {
    const samePost = String(item.postId) === String(postId);
    const sameMemberItemId = String(item.memberItemId) === String(memberItemId);
    const sameMemberName =
      !!item.selectedMember &&
      !!memberName &&
      String(item.selectedMember).trim() === String(memberName).trim();

    return samePost && (sameMemberItemId || sameMemberName);
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

function sortPostsForHome(a: DisplayPost, b: DisplayPost) {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }

  return b.createdAtTime - a.createdAtTime;
}

function getCreatedAtTime(createdAt: string) {
  if (!createdAt) return 0;

  const parsed = parseCreatedAt(createdAt);
  return parsed ? parsed.getTime() : 0;
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
  if (
    status === "COMPLETED" ||
    status === "CLOSED" ||
    status === "SOLD_OUT" ||
    status === "RESERVED" ||
    status === "예약중" ||
    status === "모집완료"
  ) {
    return "모집완료";
  }

  return "모집중";
}

function parseCreatedAt(createdAt: string) {
  const trimmed = createdAt.trim();

  if (!trimmed) return null;

  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);

  if (hasTimezone) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const normalized = trimmed.replace(" ", "T");
  const matched = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/
  );

  if (!matched) {
    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [, year, month, day, hour, minute, second = "0", fraction = "0"] =
    matched;
  const millisecond = Number(fraction.slice(0, 3).padEnd(3, "0"));

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    millisecond
  );
}

function formatTime(createdAt: string) {
  if (!createdAt) return "";

  const created = parseCreatedAt(createdAt);
  if (!created) return "";

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
      style={({ pressed }) => [
        styles.postCard,
        pressed && styles.postCardPressed,
        post.completed && styles.postCardCompleted,
      ]}
    >
      <View style={styles.postTop}>
        <View style={styles.postThumb}>
          <Image
            source={post.imageUrl ? { uri: post.imageUrl } : DEFAULT_PROFILE}
            style={styles.postThumbImage}
            resizeMode="cover"
          />
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

  groupImage: {
    width: "100%",
    height: "100%",
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

  favoriteMemberImage: {
    width: "100%",
    height: "100%",
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
    overflow: "hidden",
  },

  profileImage: {
    width: "100%",
    height: "100%",
  },

  postThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.gray200,
    marginRight: 12,
    overflow: "hidden",
  },

  postThumbImage: {
    width: "100%",
    height: "100%",
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
  },

  writeText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.white,
    marginLeft: 5,
  },
});