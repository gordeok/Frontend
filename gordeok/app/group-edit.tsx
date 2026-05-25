// 그룹 편집 화면

import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getIdols } from "@/services/idol";
import {
  getFavoriteIdols,
  getFavoriteMembers,
  saveFavoriteIdols,
  saveFavoriteMembers,
} from "@/services/user";

type Idol = {
  id: number;
  name: string;
  code: string;
};

type FavoriteMember = {
  id: number;
  idolId: number;
  name: string;
};

export default function GroupEditScreen() {
  const router = useRouter();

  const [allGroups, setAllGroups] = useState<Idol[]>([]);
  const [initialSelectedGroups, setInitialSelectedGroups] = useState<number[]>(
    []
  );
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [favoriteMembers, setFavoriteMembers] = useState<FavoriteMember[]>([]);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const idols = await getIdols();
        const savedIdols = await getFavoriteIdols();
        const savedMembers = await getFavoriteMembers();

        const savedIdolIds = savedIdols.map((idol) => Number(idol.id));

        setAllGroups(Array.isArray(idols) ? idols : []);
        setInitialSelectedGroups(savedIdolIds);
        setSelectedGroups(savedIdolIds);
        setFavoriteMembers(savedMembers as FavoriteMember[]);
      } catch (error: any) {
        console.log("그룹 편집 정보 조회 실패:", error);
        setErrorMessage(error?.message || "그룹 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const visibleGroups = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    const filtered = lowerKeyword
      ? allGroups.filter((group) =>
          group.name.toLowerCase().includes(lowerKeyword)
        )
      : allGroups;

    const selectedFirst = selectedGroups
      .map((id) => filtered.find((group) => Number(group.id) === Number(id)))
      .filter(Boolean) as Idol[];

    const restGroups = filtered.filter(
      (group) => !selectedGroups.includes(Number(group.id))
    );

    return [...selectedFirst, ...restGroups];
  }, [keyword, allGroups, selectedGroups]);

  const toggleGroup = (groupId: number) => {
    setSelectedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      }

      return [...prev, groupId];
    });
  };

  const handleCancel = () => {
    router.replace("/(tabs)/home" as any);
  };

  const handleNext = async () => {
    const newlyAddedGroups = selectedGroups.filter(
      (groupId) => !initialSelectedGroups.includes(groupId)
    );

    const validOldMembers = favoriteMembers
      .filter((member) => selectedGroups.includes(Number(member.idolId)))
      .map((member) => Number(member.id));

    if (newlyAddedGroups.length === 0) {
      try {
        setIsSaving(true);
        setErrorMessage("");

        await saveFavoriteIdols(selectedGroups);
        await saveFavoriteMembers(validOldMembers);

        router.replace("/(tabs)/home" as any);
      } catch (error: any) {
        console.log("최애 그룹/멤버 저장 실패:", error);
        setErrorMessage(error?.message || "최애 그룹 저장에 실패했습니다.");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    router.push({
      pathname: "/group-edit-members",
      params: {
        groups: selectedGroups.join(","),
        members: validOldMembers.join(","),
        targetGroups: newlyAddedGroups.join(","),
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleCancel} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#202633" />
        </Pressable>

        <Text style={styles.headerTitle}>그룹 편집</Text>

        <View style={styles.headerBlank} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TextInput
          placeholder="그룹 검색"
          placeholderTextColor="#B8B8C2"
          style={styles.search}
          value={keyword}
          onChangeText={setKeyword}
        />

        {isLoading ? (
          <Text style={styles.noticeText}>그룹 정보를 불러오는 중이에요.</Text>
        ) : errorMessage ? (
          <Text style={styles.noticeText}>{errorMessage}</Text>
        ) : (
          <View style={styles.grid}>
            {visibleGroups.map((group) => {
              const groupId = Number(group.id);
              const isSelected = selectedGroups.includes(groupId);

              return (
                <Pressable
                  key={String(group.id)}
                  style={({ pressed }) => [
                    styles.groupItem,
                    pressed && styles.pressedItem,
                  ]}
                  onPress={() => toggleGroup(groupId)}
                >
                  <View
                    style={[
                      styles.logoCircle,
                      isSelected && styles.selectedCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.logoText,
                        isSelected && styles.selectedLogoText,
                      ]}
                    >
                      {group.name.slice(0, 3)}
                    </Text>
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
        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>취소</Text>
        </Pressable>

        <Pressable
          style={[
            styles.nextButton,
            (selectedGroups.length === 0 || isSaving) && styles.disabledButton,
          ]}
          disabled={selectedGroups.length === 0 || isSaving}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>{isSaving ? "저장 중" : "다음"}</Text>
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
    width: 36,
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingBottom: 130,
  },

  search: {
    height: 44,
    backgroundColor: "#F1F1F6",
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 28,
    fontSize: 14,
    color: "#202633",
  },

  noticeText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 36,
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
    opacity: 0.45,
    borderWidth: 2,
    borderColor: "transparent",
  },

  selectedCircle: {
    backgroundColor: YELLOW,
    opacity: 1,
    borderColor: "#202633",
  },

  logoText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  selectedLogoText: {
    color: "#fff",
  },

  groupName: {
    marginTop: 10,
    fontSize: 12,
    color: "#C7C7C7",
    textAlign: "center",
  },

  selectedText: {
    fontWeight: "800",
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

  nextButton: {
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

  nextText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});