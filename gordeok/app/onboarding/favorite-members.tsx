import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getIdolMembers, getIdols } from "../../services/idol";
import { saveFavoriteMembers } from "../../services/user";
import type { Idol, IdolMember } from "../../types/idol";

type GroupWithMembers = Idol & {
  members: IdolMember[];
};

export default function FavoriteMembers() {
  const router = useRouter();
  const { groups } = useLocalSearchParams();

  const selectedGroupIds = useMemo(() => {
    if (typeof groups !== "string") return [];

    return groups
      .split(",")
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
  }, [groups]);

  const [selectedGroups, setSelectedGroups] = useState<GroupWithMembers[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadMembers = async () => {
      if (selectedGroupIds.length === 0) {
        setSelectedGroups([]);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const idols = await getIdols();
        const filteredIdols = idols.filter((idol) =>
          selectedGroupIds.includes(idol.id)
        );

        const groupsWithMembers = await Promise.all(
          filteredIdols.map(async (idol) => {
            const members = await getIdolMembers(idol.id);

            return {
              ...idol,
              members: Array.isArray(members) ? members : [],
            };
          })
        );

        setSelectedGroups(groupsWithMembers);
      } catch (error: any) {
        console.log("최애 멤버 목록 조회 실패:", error);
        setErrorMessage(
          error?.message || "최애 멤버 목록을 불러오지 못했습니다."
        );
        setSelectedGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [selectedGroupIds]);

  const isNextEnabled =
    selectedGroups.length > 0 &&
    selectedGroups.every((group) =>
      group.members.some((member) => selectedMembers.includes(member.id))
    );

  const toggleMember = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const goNext = async () => {
    try {
      setIsSaving(true);
      setErrorMessage("");

      await saveFavoriteMembers(selectedMembers);

      router.push({
        pathname: "/onboarding/complete",
        params: {
          groups: selectedGroupIds.join(","),
          members: selectedMembers.join(","),
        },
      } as any);
    } catch (error: any) {
      console.log("최애 멤버 저장 실패:", error);
      setErrorMessage(error?.message || "최애 멤버 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StepHeader current={2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>최애 멤버를 선택해 주세요</Text>

        {isLoading ? (
          <Text style={styles.noticeText}>멤버 목록을 불러오는 중이에요.</Text>
        ) : errorMessage ? (
          <Text style={styles.noticeText}>{errorMessage}</Text>
        ) : selectedGroups.length === 0 ? (
          <Text style={styles.noticeText}>선택된 그룹이 없어요.</Text>
        ) : (
          selectedGroups.map((group) => (
            <View key={String(group.id)} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{group.name}</Text>

              <View style={styles.grid}>
                {group.members.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);

                  return (
                    <Pressable
                      key={String(member.id)}
                      style={[styles.card, isSelected && styles.selectedCard]}
                      onPress={() => toggleMember(member.id)}
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
        <Pressable style={styles.prevButton} onPress={() => router.back()}>
          <Text style={styles.prevText}>이전</Text>
        </Pressable>

        <Pressable
          style={[styles.nextButton, !isNextEnabled && styles.disabledButton]}
          disabled={!isNextEnabled || isSaving}
          onPress={goNext}
        >
          <Text style={styles.nextText}>{isSaving ? "저장 중" : "다음"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StepHeader({ current }: { current: number }) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepLine} />

      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View style={[styles.stepCircle, current === step && styles.activeStep]}>
            <Text style={styles.stepNum}>{step}</Text>
          </View>

          <Text style={[styles.stepLabel, current === step && styles.activeLabel]}>
            {step === 1
              ? "최애 그룹 선택"
              : step === 2
              ? "내 최애 선택"
              : "선택 완료"}
          </Text>
        </View>
      ))}
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
  scrollContent: {
    paddingBottom: 140,
  },
  stepWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 52,
    position: "relative",
  },
  stepLine: {
    position: "absolute",
    top: 13,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: "#E5E5E5",
    zIndex: 0,
  },
  stepItem: {
    alignItems: "center",
    zIndex: 2,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DFDFE3",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  activeStep: {
    backgroundColor: "#F7C94B",
  },
  stepNum: {
    color: "#fff",
    fontWeight: "700",
  },
  stepLabel: {
    marginTop: 8,
    fontSize: 11,
    color: "#9A9AA0",
  },
  activeLabel: {
    color: "#F4B900",
    fontWeight: "700",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#202633",
    marginBottom: 36,
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
  noticeText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 36,
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
  prevButton: {
    flex: 1,
    height: 58,
    borderRadius: 10,
    backgroundColor: "#D1D1D8",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
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
  prevText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  nextText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});