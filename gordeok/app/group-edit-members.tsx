// 최애 그룹 멤버 설정 화면

import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const idolData = [
  { id: "boynextdoor", name: "BOYNEXTDOOR", members: ["성호", "리우", "명재현", "태산", "이한", "운학"] },
  { id: "txt", name: "TXT", members: ["연준", "수빈", "범규", "태현", "휴닝카이"] },
  { id: "bts", name: "BTS", members: ["RM", "진", "슈가", "제이홉", "지민", "뷔", "정국"] },
  { id: "straykids", name: "Stray Kids", members: ["방찬", "리노", "창빈", "현진", "한", "필릭스"] },
  { id: "seventeen", name: "SEVENTEEN", members: ["에스쿱스", "정한", "조슈아", "준", "호시", "원우"] },
  { id: "nct", name: "NCT", members: ["태용", "재현", "도영", "정우", "마크", "해찬"] },
  { id: "enhypen", name: "ENHYPEN", members: ["정원", "희승", "제이", "제이크", "성훈", "선우"] },
  { id: "ive", name: "IVE", members: ["안유진", "가을", "레이", "장원영", "리즈", "이서"] },
  { id: "aespa", name: "aespa", members: ["카리나", "윈터", "지젤", "닝닝"] },
  { id: "newjeans", name: "NewJeans", members: ["민지", "하니", "다니엘", "해린", "혜인"] },
  { id: "zerobaseone", name: "ZEROBASEONE", members: ["성한빈", "김지웅", "장하오", "석매튜", "김태래"] },
  { id: "riize", name: "RIIZE", members: ["쇼타로", "은석", "성찬", "원빈", "소희", "앤톤"] },
  { id: "theboyz", name: "THE BOYZ", members: ["상연", "현재", "주연", "케빈", "선우", "에릭"] },
  { id: "stayc", name: "STAYC", members: ["수민", "시은", "아이사", "세은", "윤", "재이"] },
  { id: "le_sserafim", name: "LE SSERAFIM", members: ["사쿠라", "김채원", "허윤진", "카즈하", "홍은채"] },
  { id: "monstax", name: "MONSTA X", members: ["셔누", "민혁", "기현", "형원", "주헌", "아이엠"] },
  { id: "exo", name: "EXO", members: ["수호", "찬열", "백현", "디오", "카이", "세훈"] },
  { id: "sf9", name: "SF9", members: ["영빈", "인성", "재윤", "다원", "로운", "찬희"] },
  { id: "pentagon", name: "PENTAGON", members: ["후이", "진호", "홍석", "키노", "우석", "유토"] },
  { id: "twice", name: "TWICE", members: ["나연", "정연", "모모", "사나", "지효", "쯔위"] },
  { id: "itzy", name: "ITZY", members: ["예지", "리아", "류진", "채령", "유나"] },
];

export default function GroupEditMembers() {
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

  const targetGroupParam =
    typeof params.targetGroups === "string" && params.targetGroups.length > 0
      ? params.targetGroups
      : "";

  const selectedGroupIds = groupParam.split(",").filter(Boolean);
  const oldSelectedMembers = memberParam.split(",").filter(Boolean);
  const targetGroupIds = targetGroupParam.split(",").filter(Boolean);

  const targetGroups = idolData.filter((group) =>
    targetGroupIds.includes(group.id)
  );

  const [newSelectedMembers, setNewSelectedMembers] = useState<string[]>(
    oldSelectedMembers.filter((memberId) =>
      targetGroupIds.some((groupId) => memberId.startsWith(`${groupId}-`))
    )
  );

  const isConfirmEnabled = targetGroups.every((group) =>
    newSelectedMembers.some((memberId) => memberId.startsWith(`${group.id}-`))
  );

  const toggleMember = (memberId: string) => {
    setNewSelectedMembers((prev) => {
      const alreadySelected = prev.includes(memberId);
  
      if (alreadySelected) {
        return prev.filter((id) => id !== memberId);
      }
  
      return [...prev, memberId];
    });
  };

  const handleConfirm = () => {
    const keptOldMembers = oldSelectedMembers.filter(
      (memberId) =>
        !targetGroupIds.some((groupId) => memberId.startsWith(`${groupId}-`))
    );
  
    const finalMembers = [...keptOldMembers, ...newSelectedMembers];
  
    router.replace({
      pathname: "/(tabs)/home",
      params: {
        groups: selectedGroupIds.join(","),
        members: finalMembers.join(","),
      },
    } as any);
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
        {targetGroups.map((group) => (
          <View key={group.id} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.name}</Text>

            <View style={styles.grid}>
              {group.members.map((member) => {
                const memberId = `${group.id}-${member}`;
                const isSelected = newSelectedMembers.includes(memberId);

                return (
                  <Pressable
                    key={memberId}
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
                      {member}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>이전</Text>
        </Pressable>

        <Pressable
          style={[
            styles.confirmButton,
            !isConfirmEnabled && styles.disabledButton,
          ]}
          disabled={!isConfirmEnabled}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>확인</Text>
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
    fontSize: 24,
    fontWeight: "900",
    color: "#202633",
  },

  headerBlank: {
    width: 28,
  },

  scrollContent: {
    paddingBottom: 140,
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