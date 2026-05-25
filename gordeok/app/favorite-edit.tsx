// 최애 편집 화면

import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getIdolMembers } from "@/services/idol";
import {
  getFavoriteIdols,
  getFavoriteMembers,
  saveFavoriteMembers,
} from "@/services/user";

type Idol = {
  id: number;
  name: string;
  code: string;
};

type Member = {
  id: number;
  idolId: number;
  name: string;
};

type GroupWithMembers = Idol & {
  members: Member[];
};

export default function FavoriteEditScreen() {
  const router = useRouter();

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

        setSelectedMembers(favoriteMembers.map((member) => Number(member.id)));

        const groupsWithMembers = await Promise.all(
          favoriteIdols.map(async (idol) => {
            const members = await getIdolMembers(Number(idol.id));

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
  }, []);

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
        {isLoading ? (
          <Text style={styles.noticeText}>최애 정보를 불러오는 중이에요.</Text>
        ) : errorMessage ? (
          <Text style={styles.noticeText}>{errorMessage}</Text>
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

                  return (
                    <Pressable
                      key={String(member.id)}
                      style={[styles.card, isSelected && styles.selectedCard]}
                      onPress={() => toggleMember(memberId)}
                    >
                      <View style={styles.imagePlaceholder} />

                      <Text
                        style={[
                          styles.memberName,
                          isSelected && styles.selectedText,
                        ]}
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
    gap: 17
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

  imagePlaceholder: {
    height: 88,
    backgroundColor: "#E2E3E7",
  },

  memberName: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
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