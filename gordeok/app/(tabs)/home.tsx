// 홈 화면

import { useEffect, useMemo, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPosts } from "@/services/post";
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

const idolData = [
  {
    id: "boynextdoor",
    name: "BOYNEXTDOOR",
    displayName: "보이넥스트도어",
    shortName: "BND",
    color: "#F6C74F",
    members: ["성호", "리우", "명재현", "태산", "이한", "운학"],
  },
  {
    id: "txt",
    name: "TXT",
    displayName: "투모로우바이투게더",
    shortName: "TXT",
    color: "#D9E8FF",
    members: ["연준", "수빈", "범규", "태현", "휴닝카이"],
  },
  {
    id: "bts",
    name: "BTS",
    displayName: "방탄소년단",
    shortName: "BTS",
    color: "#E8D8FF",
    members: ["RM", "진", "슈가", "제이홉", "지민", "뷔", "정국"],
  },
  {
    id: "straykids",
    name: "Stray Kids",
    displayName: "스트레이 키즈",
    shortName: "SKZ",
    color: "#FFE1E1",
    members: ["방찬", "리노", "창빈", "현진", "한", "필릭스"],
  },
  {
    id: "seventeen",
    name: "SEVENTEEN",
    displayName: "세븐틴",
    shortName: "SVT",
    color: "#DDEFFF",
    members: ["에스쿱스", "정한", "조슈아", "준", "호시", "원우"],
  },
  {
    id: "nct",
    name: "NCT",
    displayName: "엔시티",
    shortName: "NCT",
    color: "#DFFFE1",
    members: ["태용", "재현", "도영", "정우", "마크", "해찬"],
  },
  {
    id: "enhypen",
    name: "ENHYPEN",
    displayName: "엔하이픈",
    shortName: "ENH",
    color: "#F1E6FF",
    members: ["정원", "희승", "제이", "제이크", "성훈", "선우"],
  },
  {
    id: "ive",
    name: "IVE",
    displayName: "아이브",
    shortName: "IVE",
    color: "#FFE6F2",
    members: ["안유진", "가을", "레이", "장원영", "리즈", "이서"],
  },
  {
    id: "aespa",
    name: "aespa",
    displayName: "에스파",
    shortName: "AES",
    color: "#E5E9FF",
    members: ["카리나", "윈터", "지젤", "닝닝"],
  },
  {
    id: "newjeans",
    name: "NewJeans",
    displayName: "뉴진스",
    shortName: "NWJ",
    color: "#E7FFF7",
    members: ["민지", "하니", "다니엘", "해린", "혜인"],
  },
  {
    id: "zerobaseone",
    name: "ZEROBASEONE",
    displayName: "제로베이스원",
    shortName: "ZB1",
    color: "#EEF0FF",
    members: ["성한빈", "김지웅", "장하오", "석매튜", "김태래"],
  },
  {
    id: "riize",
    name: "RIIZE",
    displayName: "라이즈",
    shortName: "RIIZE",
    color: "#FFF1D8",
    members: ["쇼타로", "은석", "성찬", "원빈", "소희", "앤톤"],
  },
  {
    id: "theboyz",
    name: "THE BOYZ",
    displayName: "더보이즈",
    shortName: "TBZ",
    color: "#F2F2F2",
    members: ["상연", "현재", "주연", "케빈", "선우", "에릭"],
  },
  {
    id: "stayc",
    name: "STAYC",
    displayName: "스테이씨",
    shortName: "STC",
    color: "#FFEAF3",
    members: ["수민", "시은", "아이사", "세은", "윤", "재이"],
  },
  {
    id: "le_sserafim",
    name: "LE SSERAFIM",
    displayName: "르세라핌",
    shortName: "LSF",
    color: "#FFFFFF",
    members: ["사쿠라", "김채원", "허윤진", "카즈하", "홍은채"],
  },
  {
    id: "monstax",
    name: "MONSTA X",
    displayName: "몬스타엑스",
    shortName: "MX",
    color: "#E9ECFF",
    members: ["셔누", "민혁", "기현", "형원", "주헌", "아이엠"],
  },
  {
    id: "exo",
    name: "EXO",
    displayName: "엑소",
    shortName: "EXO",
    color: "#EFEFEF",
    members: ["수호", "찬열", "백현", "디오", "카이", "세훈"],
  },
  {
    id: "twice",
    name: "TWICE",
    displayName: "트와이스",
    shortName: "TWC",
    color: "#FFE8EF",
    members: ["나연", "정연", "모모", "사나", "지효", "쯔위"],
  },
  {
    id: "itzy",
    name: "ITZY",
    displayName: "있지",
    shortName: "ITZY",
    color: "#F0E6FF",
    members: ["예지", "리아", "류진", "채령", "유나"],
  },
];

const MEMBER_GAP = 8;
const MEMBER_BOX_WIDTH = (SCREEN_WIDTH - 44 - 32 - MEMBER_GAP * 2) / 3;

const FAVORITE_GROUPS_KEY = "GO_REUDEOK_FAVORITE_GROUPS";
const FAVORITE_MEMBERS_KEY = "GO_REUDEOK_FAVORITE_MEMBERS";

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
    name: string;
    state: string;
    price: number;
  }[];
};

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const routeGroupParam =
    typeof params.groups === "string" && params.groups.length > 0
      ? params.groups
      : "";

  const routeMemberParam =
    typeof params.members === "string" && params.members.length > 0
      ? params.members
      : "";

  const [savedGroupParam, setSavedGroupParam] = useState("");
  const [savedMemberParam, setSavedMemberParam] = useState("");
  const [isFavoriteLoaded, setIsFavoriteLoaded] = useState(false);

  const groupParam = routeGroupParam || savedGroupParam;
  const memberParam = routeMemberParam || savedMemberParam;

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedGroups = await AsyncStorage.getItem(FAVORITE_GROUPS_KEY);
        const savedMembers = await AsyncStorage.getItem(FAVORITE_MEMBERS_KEY);

        if (!routeGroupParam && savedGroups) {
          setSavedGroupParam(savedGroups);
        }

        if (!routeMemberParam && savedMembers) {
          setSavedMemberParam(savedMembers);
        }
      } catch (error) {
        console.log("최애 정보 불러오기 실패", error);
      } finally {
        setIsFavoriteLoaded(true);
      }
    };

    loadFavorites();
  }, [routeGroupParam, routeMemberParam]);

  useEffect(() => {
    const saveFavorites = async () => {
      try {
        if (routeGroupParam) {
          await AsyncStorage.setItem(FAVORITE_GROUPS_KEY, routeGroupParam);
          setSavedGroupParam(routeGroupParam);
        }

        if (routeMemberParam) {
          await AsyncStorage.setItem(FAVORITE_MEMBERS_KEY, routeMemberParam);
          setSavedMemberParam(routeMemberParam);
        }
      } catch (error) {
        console.log("최애 정보 저장 실패", error);
      }
    };

    saveFavorites();
  }, [routeGroupParam, routeMemberParam]);

  const selectedGroupIds = useMemo(() => {
    return groupParam.split(",").filter(Boolean);
  }, [groupParam]);

  const selectedMemberIds = useMemo(() => {
    return memberParam.split(",").filter(Boolean);
  }, [memberParam]);

  const selectedGroups = useMemo(() => {
    return idolData
      .filter((group) => selectedGroupIds.includes(group.id))
      .map((group) => {
        const favorites = selectedMemberIds
          .filter((memberId) => memberId.startsWith(`${group.id}-`))
          .map((memberId) => memberId.replace(`${group.id}-`, ""));

        return {
          ...group,
          favorites,
        };
      });
  }, [selectedGroupIds, selectedMemberIds]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedFavoriteMember, setSelectedFavoriteMember] = useState<
    string | null
  >(null);

  const [apiPosts, setApiPosts] = useState<PostListItem[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    if (selectedGroups.length === 1) {
      setSelectedGroupId(selectedGroups[0].id);
      return;
    }

    if (
      selectedGroupId &&
      !selectedGroups.some((group) => group.id === selectedGroupId)
    ) {
      setSelectedGroupId(null);
      setSelectedFavoriteMember(null);
    }
  }, [selectedGroups, selectedGroupId]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsPostsLoading(true);
        setPostError("");

        const selectedGroup = selectedGroups.find(
          (group) => group.id === selectedGroupId
        );

        const response = await getPosts({
          page: 0,
          size: 20,
          sort: "latest",
          idolName: selectedGroup?.displayName,
        });

        const list = Array.isArray(response) ? response : response.content;

        setApiPosts(list ?? []);
      } catch (error) {
        console.log("게시글 조회 실패:", error);
        setApiPosts([]);
        setPostError("게시글을 불러오지 못했어요");
      } finally {
        setIsPostsLoading(false);
      }
    };

    if (selectedGroups.length > 0) {
      loadPosts();
    } else {
      setApiPosts([]);
    }
  }, [selectedGroups, selectedGroupId]);

  const posts = useMemo(() => {
    return normalizeApiPosts(apiPosts, selectedGroups);
  }, [selectedGroups, apiPosts]);

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
                        if (selectedGroups.length === 1) return;

                        setSelectedGroupId(isSelected ? null : group.id);
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

              <View style={styles.listHeader}>
                <View />

                <Pressable style={styles.sortButton}>
                  <Text style={styles.sortText}>최신 등록순</Text>
                  <Ionicons
                    name="swap-vertical"
                    size={16}
                    color={COLORS.black}
                  />
                </Pressable>
              </View>

              <View style={styles.postList}>
                {isPostsLoading ? (
                  <View style={styles.noPostBox}>
                    <Text style={styles.noPostTitle}>분철 글을 불러오는 중이에요</Text>
                  </View>
                ) : postError ? (
                  <View style={styles.noPostBox}>
                    <Text style={styles.noPostTitle}>{postError}</Text>
                  </View>
                ) : filteredPosts.length === 0 ? (
                  <View style={styles.noPostBox}>
                    <Text style={styles.noPostTitle}>모집중인 분철 글이 없어요</Text>
                  </View>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={String(post.id)}
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

function normalizeApiPosts(
  apiPosts: PostListItem[],
  selectedGroups: typeof idolData
): DisplayPost[] {
  return apiPosts.reduce<DisplayPost[]>((result, post) => {
    const matchedGroup = selectedGroups.find(
      (group) =>
        group.displayName === post.idolName ||
        group.name === post.idolName ||
        group.id === post.idolName
    );

    if (!matchedGroup) return result;

    result.push({
      id: String(post.id),
      groupId: matchedGroup.id,
      groupName: post.idolName,
      userName: post.nickname || "알 수 없음",
      title: post.title || "제목 없음",
      albumName: post.albumName || "",
      time: formatTime(post.createdAt),
      date: post.createdAt?.slice(0, 10) ?? "",
      status: getPostStatus(post.status, post.almostFull),
      completed:
        post.status === "COMPLETED" ||
        post.status === "CLOSED" ||
        post.status === "모집완료",
      content: post.description || "",
      components: post.components || [],
      deliveryMethod: post.shippingFeeType || "",
      members: (post.memberItems || []).map((member) => ({
        name: member.memberName,
        state: getMemberStatus(member.status),
        price: member.price,
      })),
    });

    return result;
  }, []);
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
  post: any;
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
              <Text style={styles.postTitle} numberOfLines={1}>
                {post.title}
              </Text>
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
        {post.members.map((member: any, index: number) => (
          <View
            key={`${member.name}-${index}`}
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
    paddingBottom: 120,
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
    fontWeight: "900",
    color: COLORS.black,
  },

  favoriteNameSelected: {
    color: COLORS.white,
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

  listTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
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
    alignItems: "center",
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
  },

  deadlineBadge: {
    backgroundColor: "#FFECEC",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
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