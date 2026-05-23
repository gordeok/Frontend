// 최애 그룹 선택 화면

import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { getIdols } from "../../services/idol";
import { saveFavoriteIdols } from "../../services/user";
import type { Idol } from "../../types/idol";

export default function FavoriteGroups() {
  const router = useRouter();

  const [groups, setGroups] = useState<Idol[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getIdols();
        setGroups(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.log("아이돌 목록 조회 실패:", error);
        setErrorMessage(
          error?.message || "아이돌 목록을 불러오지 못했습니다."
        );
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, []);

  const filteredGroups = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    if (!lowerKeyword) return groups;

    return groups.filter((group) =>
      group.name.toLowerCase().includes(lowerKeyword)
    );
  }, [keyword, groups]);

  const toggleGroup = (groupId: number) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const goNext = async () => {
    try {
      setIsSaving(true);
      await saveFavoriteIdols({ idolIds: selectedGroups });

      router.push({
        pathname: "/onboarding/favorite-members",
        params: {
          groups: selectedGroups.join(","),
        },
      } as any);
    } catch (error: any) {
      console.log("최애 그룹 저장 실패:", error);
      setErrorMessage(error?.message || "최애 그룹 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StepHeader current={1} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>최애 그룹을 선택해 주세요</Text>

        <TextInput
          placeholder="그룹 검색"
          placeholderTextColor="#B8B8C2"
          style={styles.search}
          value={keyword}
          onChangeText={setKeyword}
        />

        {isLoading ? (
          <Text style={styles.noticeText}>그룹 목록을 불러오는 중이에요.</Text>
        ) : errorMessage ? (
          <Text style={styles.noticeText}>{errorMessage}</Text>
        ) : filteredGroups.length === 0 ? (
          <Text style={styles.noticeText}>표시할 그룹이 없어요.</Text>
        ) : (
          <View style={styles.grid}>
            {filteredGroups.map((group) => {
              const isSelected = selectedGroups.includes(group.id);

              return (
                <Pressable
                  key={String(group.id)}
                  style={({ pressed }) => [
                    styles.groupItem,
                    pressed && styles.pressedItem,
                  ]}
                  onPress={() => toggleGroup(group.id)}
                >
                  <View
                    style={[
                      styles.logoCircle,
                      isSelected && styles.selectedCircle,
                    ]}
                  >
                    <Text style={styles.logoText}>{group.name.slice(0, 3)}</Text>
                  </View>

                  <Text
                    style={[
                      styles.groupName,
                      isSelected && styles.selectedText,
                    ]}
                    numberOfLines={1}
                  >
                    {group.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable style={styles.prevButton} onPress={() => router.back()}>
          <Text style={styles.prevText}>이전</Text>
        </Pressable>

        <Pressable
          style={[
            styles.nextButton,
            selectedGroups.length === 0 && styles.disabledButton,
          ]}
          disabled={selectedGroups.length === 0 || isSaving}
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
  search: {
    height: 44,
    backgroundColor: "#F1F1F6",
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  groupItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 24,
  },
  pressedItem: {
    opacity: 0.75,
  },
  logoCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },
  selectedCircle: {
    backgroundColor: "#F7C94B",
    opacity: 1,
    borderWidth: 2,
    borderColor: "#202633",
  },
  logoText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  groupName: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  selectedText: {
    fontWeight: "800",
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
