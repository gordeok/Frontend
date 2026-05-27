// 최애 그룹 선택 화면

import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getIdols } from "../../services/idol";
import { saveFavoriteIdols } from "../../services/user";

type Idol = {
  id: number;
  name: string;
  code?: string;
  imageUrl?: string;
  logoUrl?: string;
  profileImage?: string;
  idolImageUrl?: string;
};

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
        console.log("아이돌 목록 응답:", data);

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

  const getGroupImageUrl = (group: Idol) => {
    return (
      group.imageUrl ||
      group.logoUrl ||
      group.profileImage ||
      group.idolImageUrl ||
      ""
    );
  };

  const goNext = async () => {
    try {
      setIsSaving(true);
      setErrorMessage("");

      await saveFavoriteIdols(selectedGroups);

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

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#A6A6B0" />

          <TextInput
            placeholder="그룹 검색"
            placeholderTextColor="#B8B8C2"
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
          />
        </View>

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
              const imageUrl = getGroupImageUrl(group);

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
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={[
                          styles.groupImage,
                          isSelected && styles.selectedImage,
                        ]}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text
                        style={[
                          styles.logoText,
                          isSelected && styles.selectedLogoText,
                        ]}
                      >
                        {group.name.slice(0, 3)}
                      </Text>
                    )}

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
          <Text style={styles.nextText}>{isSaving ? "다음" : "다음"}</Text>
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
          <View
            style={[
              styles.stepCircle,
              current === step && styles.activeStep,
            ]}
          >
            <Text style={styles.stepNum}>{step}</Text>
          </View>

          <Text
            style={[
              styles.stepLabel,
              current === step && styles.activeLabel,
            ]}
          >
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
    top: 14,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: "#E2E2E6",
    zIndex: 0,
  },
  stepItem: {
    alignItems: "center",
    zIndex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DFDFE3",
    alignItems: "center",
    justifyContent: "center",
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
  searchBox: {
    height: 44,
    backgroundColor: "#F1F1F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#202633",
    padding: 0,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  groupItem: {
    width: "33.333%",
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    opacity: 0.95,
    borderWidth: 1.5,
    borderColor: "#E4E4EA",
  },
  selectedCircle: {
    backgroundColor: "#FFF7D8",
    opacity: 1,
    borderWidth: 2.5,
    borderColor: "#F7C94B",
  },
  groupImage: {
    width: "100%",
    height: "100%",
  },
  selectedImage: {
    opacity: 0.88,
  },
  logoText: {
    color: "#A0A0A8",
    fontWeight: "800",
    fontSize: 16,
  },
  selectedLogoText: {
    color: "#202633",
  },
  checkBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F7C94B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
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