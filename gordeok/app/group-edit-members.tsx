import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getIdols, getIdolMembers } from "@/services/idol";
import { saveFavoriteIdols, saveFavoriteMembers } from "@/services/user";

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

export default function GroupEditMembers() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const selectedGroupIds = useMemo(() => {
    const value = typeof params.groups === "string" ? params.groups : "";

    return value
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((id) => !Number.isNaN(id));
  }, [params.groups]);

  const oldSelectedMembers = useMemo(() => {
    const value = typeof params.members === "string" ? params.members : "";

    return value
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((id) => !Number.isNaN(id));
  }, [params.members]);

  const targetGroupIds = useMemo(() => {
    const value =
      typeof params.targetGroups === "string" ? params.targetGroups : "";

    return value
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((id) => !Number.isNaN(id));
  }, [params.targetGroups]);

  const [targetGroups, setTargetGroups] = useState<GroupWithMembers[]>([]);
  const [newSelectedMembers, setNewSelectedMembers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadTargetGroups = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const idols = await getIdols();
        const targetIdols = idols.filter((idol) =>
          targetGroupIds.includes(Number(idol.id))
        );

        const groupsWithMembers = await Promise.all(
          targetIdols.map(async (idol) => {
            const members = await getIdolMembers(Number(idol.id));

            return {
              id: Number(idol.id),
              name: idol.name,
              code: idol.code,
              members: Array.isArray(members) ? members : [],
            };
          })
        );

        setTargetGroups(groupsWithMembers);

        const targetMemberIds = groupsWithMembers.flatMap((group) =>
          group.members.map((member) => Number(member.id))
        );

        setNewSelectedMembers(
          oldSelectedMembers.filter((memberId) =>
            targetMemberIds.includes(memberId)
          )
        );
      } catch (error: any) {
        console.log("추가 그룹 멤버 조회 실패:", error);
        setErrorMessage(error?.message || "멤버 정보를 불러오지 못했습니다.");
        setTargetGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTargetGroups();
  }, [targetGroupIds, oldSelectedMembers]);

  const isConfirmEnabled = targetGroups.every((group) =>
    group.members.some((member) =>
      newSelectedMembers.includes(Number(member.id))
    )
  );

  const toggleMember = (memberId: number) => {
    setNewSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleConfirm = async () => {
    const targetMemberIdSet = new Set(
      targetGroups.flatMap((group) =>
        group.members.map((member) => Number(member.id))
      )
    );

    const keptOldMembers = oldSelectedMembers.filter(
      (memberId) => !targetMemberIdSet.has(memberId)
    );

    const finalMembers = [...keptOldMembers, ...newSelectedMembers];

    try {
      setIsSaving(true);
      setErrorMessage("");

      await saveFavoriteIdols(selectedGroupIds);
      await saveFavoriteMembers(finalMembers);

      router.replace("/(tabs)/home" as any);
    } catch (error: any) {
      console.log("최애 그룹/멤버 저장 실패:", error);
      setErrorMessage(error?.message || "최애 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#202633" />
        </Pressable>

        <Text style={styles.headerTitle}>최애 선택</Text>

        <View style={styles.headerBlank} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <Text style={styles.noticeText}>멤버 정보를 불러오는 중이에요.</Text>
        ) : errorMessage ? (
          <Text style={styles.noticeText}>{errorMessage}</Text>
        ) : targetGroups.length === 0 ? (
          <Text style={styles.noticeText}>추가 선택할 그룹이 없어요.</Text>
        ) : (
          targetGroups.map((group) => (
            <View key={String(group.id)} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{group.name}</Text>

              <View style={styles.grid}>
                {group.members.map((member) => {
                  const memberId = Number(member.id);
                  const isSelected = newSelectedMembers.includes(memberId);

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
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>이전</Text>
        </Pressable>

        <Pressable
          style={[
            styles.confirmButton,
            (!isConfirmEnabled || isSaving) && styles.disabledButton,
          ]}
          disabled={!isConfirmEnabled || isSaving}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>
            {isSaving ? "저장 중" : "확인"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

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
    marginBottom: 42,
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
    gap: 14,
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
    borderColor: "#F7C94B",
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
    gap: 16,
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
    backgroundColor: "#F7C94B",
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