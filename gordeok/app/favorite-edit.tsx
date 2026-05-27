// 최애 편집 화면

import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getIdolMembers } from "@/services/idol";
import {
  getFavoriteIdols,
  getFavoriteMembers,
  saveFavoriteMembers,
} from "@/services/user";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://frostily-derby-underpass.ngrok-free.dev";

type Idol = {
  id: number;
  name: string;
  code: string;
};

type Member = {
  id: number;
  idolId: number;
  name: string;

  imageUrl?: string;
  profileImage?: string;
  profileImageUrl?: string;
  memberImageUrl?: string;
  photoUrl?: string;
  image?: string;
  imagePath?: string;
  thumbnailUrl?: string;
};

type GroupWithMembers = Idol & {
  members: Member[];
};

export default function FavoriteEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const editGroupId =
    typeof params.editGroupId === "string" && params.editGroupId
      ? Number(params.editGroupId)
      : null;

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const favoriteIdols = await getFavoriteIdols();
        const favoriteMembers = await getFavoriteMembers();

        console.log("최애 편집 그룹 응답:", favoriteIdols);
        console.log("최애 편집 멤버 응답:", favoriteMembers);
        console.log("현재 편집할 그룹 ID:", editGroupId);

        setSelectedMembers(favoriteMembers.map((member) => Number(member.id)));

        const targetIdols = editGroupId
          ? favoriteIdols.filter((idol) => Number(idol.id) === editGroupId)
          : favoriteIdols;

        const groupsWithMembers = await Promise.all(
          targetIdols.map(async (idol) => {
            const members = await getIdolMembers(Number(idol.id));

            console.log(`${idol.name} 전체 멤버 응답:`, members);

            return {
              id: Number(idol.id),
              name: idol.name,
              code: idol.code,
              members: Array.isArray(members) ? members : [],
            };
          })
        );

        setGroups(groupsWithMembers);
      } catch (error: any) {
        console.log("최애 정보 조회 실패:", error);
        setErrorMessage(error?.message || "최애 정보를 불러오지 못했습니다.");
        setGroups([]);
        setSelectedMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [editGroupId]);

  const isConfirmEnabled = useMemo(() => {
    if (groups.length === 0) return false;

    return groups.every((group) =>
      group.members.some((member) => selectedMembers.includes(Number(member.id)))
    );
  }, [groups, selectedMembers]);

  const toggleMember = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const normalizeImageUrl = (url?: string) => {
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
  };

  const getMemberImageUrl = (member: Member) => {
    return normalizeImageUrl(
      member.imageUrl ||
        member.profileImage ||
        member.profileImageUrl ||
        member.memberImageUrl ||
        member.photoUrl ||
        member.image ||
        member.imagePath ||
        member.thumbnailUrl
    );
  };

  const handleCancel = () => {
    router.back();
  };

  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      setErrorMessage("");

      await saveFavoriteMembers(selectedMembers);

      router.replace("/(tabs)/home" as any);
    } catch (error: any) {
      console.log("최애 멤버 저장 실패:", error);
      setErrorMessage(error?.message || "최애 멤버 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#202633" />
        </Pressable>

        <Text style={styles.headerTitle}>최애 편집</Text>

        <View style={styles.headerBlank} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {errorMessage ? (
          <Text style={styles.noticeText}>{errorMessage}</Text>
        ) : isLoading ? (
          <View style={styles.loadingBlank} />
        ) : groups.length === 0 ? (
          <Text style={styles.noticeText}>선택된 최애 그룹이 없어요.</Text>
        ) : (
          groups.map((group) => (
            <View key={String(group.id)} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{group.name}</Text>

              <View style={styles.grid}>
                {group.members.map((member) => {
                  const memberId = Number(member.id);
                  const isSelected = selectedMembers.includes(memberId);
                  const memberImageUrl = getMemberImageUrl(member);

                  return (
                    <Pressable
                      key={String(member.id)}
                      style={[styles.card, isSelected && styles.selectedCard]}
                      onPress={() => toggleMember(memberId)}
                    >
                      <View style={styles.imageBox}>
                        {memberImageUrl ? (
                          <Image
                            source={{ uri: memberImageUrl }}
                            style={[
                              styles.memberImage,
                              !isSelected && styles.unselectedImage,
                            ]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>
                              {member.name.slice(0, 2)}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.memberName,
                          isSelected && styles.selectedText,
                        ]}
                        numberOfLines={1}
                      >
                        {member.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>취소</Text>
        </Pressable>

        <Pressable
          style={[
            styles.confirmButton,
            (!isConfirmEnabled || isSaving) && styles.disabledButton,
          ]}
          disabled={!isConfirmEnabled || isSaving}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>{isSaving ? "저장 중" : "확인"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const YELLOW = "#F7C94B";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 70,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#202633",
  },

  headerBlank: {
    width: 28,
  },

  scrollContent: {
    paddingBottom: 140,
  },

  loadingBlank: {
    height: 36,
  },

  noticeText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 36,
  },

  groupSection: {
    marginBottom: 28,
  },

  groupTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#202633",
    marginBottom: 14,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 17,
  },

  card: {
    width: "30%",
    height: 138,
    borderRadius: 10,
    backgroundColor: "#F3F3F3",
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    opacity: 0.45,
  },

  selectedCard: {
    opacity: 1,
    borderWidth: 2,
    borderColor: YELLOW,
    backgroundColor: "#fff",
  },

  imageBox: {
    height: 88,
    backgroundColor: "#E2E3E7",
    overflow: "hidden",
  },

  memberImage: {
    width: "100%",
    height: "100%",
  },

  unselectedImage: {
    opacity: 0.65,
  },

  imagePlaceholder: {
    flex: 1,
    backgroundColor: "#E2E3E7",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  memberName: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    paddingHorizontal: 4,
  },

  selectedText: {
    color: "#202633",
  },

  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },

  cancelButton: {
    flex: 1,
    height: 58,
    borderRadius: 10,
    backgroundColor: "#D1D1D8",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmButton: {
    flex: 1,
    height: 58,
    borderRadius: 10,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.5,
  },

  cancelText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  confirmText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});