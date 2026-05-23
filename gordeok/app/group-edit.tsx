// 그룹 편집 화면

import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveFavoriteIdols, saveFavoriteMembers } from "../services/user";

const idolData = [
  {
    id: "boynextdoor",
    name: "BOYNEXTDOOR",
    members: ["성호", "리우", "명재현", "태산", "이한", "운학"],
  },
  {
    id: "txt",
    name: "TXT",
    members: ["연준", "수빈", "범규", "태현", "휴닝카이"],
  },
  {
    id: "bts",
    name: "BTS",
    members: ["RM", "진", "슈가", "제이홉", "지민", "뷔", "정국"],
  },
  {
    id: "straykids",
    name: "Stray Kids",
    members: ["방찬", "리노", "창빈", "현진", "한", "필릭스"],
  },
  {
    id: "seventeen",
    name: "SEVENTEEN",
    members: ["에스쿱스", "정한", "조슈아", "준", "호시", "원우"],
  },
  {
    id: "nct",
    name: "NCT",
    members: ["태용", "재현", "도영", "정우", "마크", "해찬"],
  },
  {
    id: "enhypen",
    name: "ENHYPEN",
    members: ["정원", "희승", "제이", "제이크", "성훈", "선우"],
  },
  {
    id: "ive",
    name: "IVE",
    members: ["안유진", "가을", "레이", "장원영", "리즈", "이서"],
  },
  {
    id: "aespa",
    name: "aespa",
    members: ["카리나", "윈터", "지젤", "닝닝"],
  },
  {
    id: "newjeans",
    name: "NewJeans",
    members: ["민지", "하니", "다니엘", "해린", "혜인"],
  },
  {
    id: "zerobaseone",
    name: "ZEROBASEONE",
    members: ["성한빈", "김지웅", "장하오", "석매튜", "김태래"],
  },
  {
    id: "riize",
    name: "RIIZE",
    members: ["쇼타로", "은석", "성찬", "원빈", "소희", "앤톤"],
  },
  {
    id: "theboyz",
    name: "THE BOYZ",
    members: ["상연", "현재", "주연", "케빈", "선우", "에릭"],
  },
  {
    id: "stayc",
    name: "STAYC",
    members: ["수민", "시은", "아이사", "세은", "윤", "재이"],
  },
  {
    id: "le_sserafim",
    name: "LE SSERAFIM",
    members: ["사쿠라", "김채원", "허윤진", "카즈하", "홍은채"],
  },
  {
    id: "monstax",
    name: "MONSTA X",
    members: ["셔누", "민혁", "기현", "형원", "주헌", "아이엠"],
  },
  {
    id: "exo",
    name: "EXO",
    members: ["수호", "찬열", "백현", "디오", "카이", "세훈"],
  },
  {
    id: "sf9",
    name: "SF9",
    members: ["영빈", "인성", "재윤", "다원", "로운", "찬희"],
  },
  {
    id: "pentagon",
    name: "PENTAGON",
    members: ["후이", "진호", "홍석", "키노", "우석", "유토"],
  },
  {
    id: "twice",
    name: "TWICE",
    members: ["나연", "정연", "모모", "사나", "지효", "쯔위"],
  },
  {
    id: "itzy",
    name: "ITZY",
    members: ["예지", "리아", "류진", "채령", "유나"],
  },
];

const IDOL_API_ID_MAP: Record<string, number> = {
  boynextdoor: 1,
  txt: 2,
  bts: 3,
  straykids: 4,
  seventeen: 5,
  nct: 6,
  enhypen: 7,
  ive: 8,
  aespa: 9,
  newjeans: 10,
  zerobaseone: 11,
  riize: 12,
  theboyz: 13,
  stayc: 14,
  le_sserafim: 15,
  monstax: 16,
  exo: 17,
  sf9: 18,
  pentagon: 19,
  twice: 20,
  itzy: 21,
};

function toApiIdolIds(groupIds: string[]) {
  return groupIds
    .map((groupId) => IDOL_API_ID_MAP[groupId])
    .filter((id): id is number => typeof id === "number");
}

function toApiMemberIds(memberIds: string[]) {
  const allMembers = idolData.flatMap((group) =>
    group.members.map((member) => `${group.id}-${member}`)
  );

  return memberIds
    .map((memberId) => allMembers.indexOf(memberId) + 1)
    .filter((id) => id > 0);
}

export default function GroupEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const groupParam =
    typeof params.groups === "string" && params.groups.length > 0
      ? params.groups
      : "";

  const memberParam =
    typeof params.members === "string" && params.members.length > 0
      ? params.members
      : "";

  const initialSelectedGroups = useMemo(() => {
    return groupParam.split(",").filter(Boolean);
  }, [groupParam]);

  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    initialSelectedGroups
  );

  const [keyword, setKeyword] = useState("");

  const visibleGroups = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    const filtered = lowerKeyword
      ? idolData.filter((group) =>
          group.name.toLowerCase().includes(lowerKeyword)
        )
      : idolData;

    const initiallySelected = initialSelectedGroups
      .map((id) => filtered.find((group) => group.id === id))
      .filter(Boolean) as typeof idolData;

    const restGroups = filtered.filter(
      (group) => !initialSelectedGroups.includes(group.id)
    );

    return [...initiallySelected, ...restGroups];
  }, [keyword, initialSelectedGroups]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      }

      return [...prev, groupId];
    });
  };

  const handleCancel = () => {
    router.replace({
      pathname: "/(tabs)/home",
      params: {
        groups: groupParam,
        members: memberParam,
      },
    } as any);
  };

  const handleNext = async () => {
    const newlyAddedGroups = selectedGroups.filter(
      (groupId) => !initialSelectedGroups.includes(groupId)
    );

    const validOldMembers = memberParam
      .split(",")
      .filter(Boolean)
      .filter((memberId) => {
        const groupId = memberId.split("-")[0];
        return selectedGroups.includes(groupId);
      });

    if (newlyAddedGroups.length === 0) {
      try {
        await saveFavoriteIdols({
          idolIds: toApiIdolIds(selectedGroups),
        });

        await saveFavoriteMembers({
          memberIds: toApiMemberIds(validOldMembers),
        });
      } catch (error) {
        console.log("최애 그룹/멤버 저장 실패 또는 백엔드 미연결:", error);
      } finally {
        router.replace({
          pathname: "/(tabs)/home",
          params: {
            groups: selectedGroups.join(","),
            members: validOldMembers.join(","),
          },
        } as any);
      }

      return;
    }

    router.push({
      pathname: "/onboarding/group-edit-members",
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

        <View style={styles.grid}>
          {visibleGroups.map((group) => {
            const isSelected = selectedGroups.includes(group.id);

            return (
              <Pressable
                key={group.id}
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
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>취소</Text>
        </Pressable>

        <Pressable
          style={[
            styles.nextButton,
            selectedGroups.length === 0 && styles.disabledButton,
          ]}
          disabled={selectedGroups.length === 0}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>다음</Text>
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
    fontSize: 24,
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