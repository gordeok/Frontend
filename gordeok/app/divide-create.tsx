import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPost } from "../services/post";
import { getIdolMembers, getIdols } from "../services/idol";
import { createSellerChatRoom } from "../services/chat";

type AiStatus = "idle" | "analyzing" | "done" | "error";
type SourceStatus = "none" | "ai" | "edited" | "manual";

type Member = {
  id: number;
  name: string;
  initial: string;
  price: string;
};

type Group = {
  id: number;
  name: string;
};

type AiAnalyzeResult = {
  titleSuggestion: string;
  groupSuggestion: Group;
};

async function analyzeDivideImage(): Promise<AiAnalyzeResult> {
  throw new Error("이미지 파일 선택 기능 연결 후 사용할 수 있습니다.");
}

async function searchGroups(keyword: string): Promise<Group[]> {
  const trimmedKeyword = keyword.trim();

  if (trimmedKeyword.length === 0) {
    return [];
  }

  const result = await getIdols(trimmedKeyword);

  const uniqueMap = new Map<string, Group>();

  result.forEach((idol) => {
    const name = idol.name.trim();
    const key = name.toLowerCase();

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        id: idol.id,
        name,
      });
    }
  });

  return Array.from(uniqueMap.values());
}

async function fetchGroupMembers(groupId: number): Promise<Member[]> {
  const result = await getIdolMembers(groupId);

  const uniqueMap = new Map<string, Member>();

  result.forEach((member) => {
    const name = member.name.trim();
    const key = name.toLowerCase();

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        id: member.id,
        name,
        initial: name.slice(0, 1),
        price: "",
      });
    }
  });

  return Array.from(uniqueMap.values());
}

export default function DivideCreate() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView | null>(null);

  const groupParam =
    typeof params.groups === "string" && params.groups.length > 0
      ? params.groups
      : "";

  const memberParam =
    typeof params.members === "string" && params.members.length > 0
      ? params.members
      : "";

  const [photoCount] = useState(0);

  const [title, setTitle] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [componentText, setComponentText] = useState("");

  const [deliveryMethod, setDeliveryMethod] = useState<"GS" | "CU" | null>(
    null
  );
  const [content, setContent] = useState("");

  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [titleSource, setTitleSource] = useState<SourceStatus>("none");
  const [groupSource, setGroupSource] = useState<SourceStatus>("none");

  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isGroupFocused, setIsGroupFocused] = useState(false);
  const [groupSuggestions, setGroupSuggestions] = useState<Group[]>([]);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGroupLoading, setIsGroupLoading] = useState(false);

  const isAnalyzing = aiStatus === "analyzing";
  const isAiDone = aiStatus === "done";

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setIsTitleFocused(false);
      setIsGroupFocused(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const keyword = groupName.trim();

    if (!isGroupFocused || selectedGroupId !== null || keyword.length === 0) {
      setGroupSuggestions([]);
      return;
    }

    let alive = true;

    const timer = setTimeout(async () => {
      try {
        const result = await searchGroups(keyword);

        if (!alive) return;

        setGroupSuggestions(result);
      } catch (error) {
        if (!alive) return;

        console.log("그룹 검색 실패:", error);
        setGroupSuggestions([]);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [groupName, isGroupFocused, selectedGroupId]);

  const isAllPriceFilled = useMemo(() => {
    return (
      members.length > 0 &&
      members.every((member) => member.price.trim().length > 0)
    );
  }, [members]);

  const isButtonActive =
    title.trim().length > 0 &&
    groupName.trim().length > 0 &&
    selectedGroupId !== null &&
    members.length > 0 &&
    isAllPriceFilled &&
    deliveryMethod !== null &&
    content.trim().length > 0 &&
    !isSubmitting &&
    !isGroupLoading;

  const showGroupDropdown =
    isGroupFocused && groupName.trim().length > 0 && selectedGroupId === null;

  const titleBadgeText =
    titleSource === "ai" ? "AI 완료" : titleSource === "edited" ? "수정됨" : "";

  const groupBadgeText =
    groupSource === "ai"
      ? "자동 인식됨"
      : groupSource === "edited"
      ? "수정 중"
      : groupSource === "manual"
      ? "직접 선택"
      : "";

  const formatPrice = (text: string) => {
    const onlyNumber = text.replace(/[^0-9]/g, "");
    return onlyNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const applyGroup = async (group: Group, source: SourceStatus) => {
    try {
      setIsGroupLoading(true);
      setSelectedGroupId(group.id);
      setGroupName(group.name);
      setGroupSource(source);
      setIsGroupFocused(false);
      setGroupSuggestions([]);
      Keyboard.dismiss();

      const groupMembers = await fetchGroupMembers(group.id);
      setMembers(groupMembers);
    } catch (error) {
      console.log("멤버 목록 불러오기 실패:", error);
      setMembers([]);
    } finally {
      setIsGroupLoading(false);
    }
  };

  const handleRunAiAnalyze = async () => {
    if (isAnalyzing) return;

    try {
      setAiStatus("analyzing");

      const result = await analyzeDivideImage();

      setTitle(result.titleSuggestion);
      setTitleSource("ai");

      await applyGroup(result.groupSuggestion, "ai");

      setAiStatus("done");
    } catch {
      setAiStatus("error");
    }
  };

  const handleAddPhoto = () => {
    return;
  };

  const handleTitleFocus = () => {
    setIsTitleFocused(true);

    if (titleSource === "ai") {
      setTitle("");
      setTitleSource("edited");
    }
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);

    if (titleSource === "ai" || titleSource === "edited") {
      setTitleSource("edited");
    } else {
      setTitleSource("none");
    }
  };

  const handleGroupFocus = () => {
    setIsGroupFocused(true);
  };

  const handleGroupChange = (text: string) => {
    setGroupName(text);
    setSelectedGroupId(null);
    setGroupSource(groupSource === "ai" ? "edited" : "none");
    setIsGroupFocused(true);
    setMembers([]);
  };

  const handleClearGroup = () => {
    setGroupName("");
    setSelectedGroupId(null);
    setGroupSource("none");
    setGroupSuggestions([]);
    setMembers([]);
    setIsGroupFocused(true);
  };

  const handlePriceChange = (id: number, text: string) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, price: formatPrice(text) } : member
      )
    );
  };

  const handleRemoveMember = (id: number) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleAddComponent = () => {
    const trimmed = componentText.trim();

    if (!trimmed) return;

    if (!components.includes(trimmed)) {
      setComponents((prev) => [...prev, trimmed]);
    }

    setComponentText("");
  };

  const handleRemoveComponent = (item: string) => {
    setComponents((prev) => prev.filter((component) => component !== item));
  };

  const handleContentFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 250);
  };

  const handleSubmit = async () => {
    if (!isButtonActive || deliveryMethod === null) return;

    try {
      setIsSubmitting(true);

      const result = await createPost({
        title: title.trim(),
        description: content.trim(),
        imageUrl: "",
        idolName: groupName.trim(),
        albumName: "",
        components,
        shippingFeeType: deliveryMethod,
        memberItems: members.map((member) => ({
          memberName: member.name,
          price: Number(member.price.replace(/,/g, "")),
        })),
      });

      const createdPostId =
        result && "postId" in result ? result.postId : null;

      if (!createdPostId) {
        throw new Error("게시글 ID를 받지 못했습니다.");
      }

      await createSellerChatRoom(createdPostId, title.trim());

      router.replace({
        pathname: "/(tabs)/home",
        params: {
          groups: groupParam,
          members: memberParam,
        },
      } as any);
    } catch (error) {
      console.log("게시글 등록 또는 판매자 채팅방 생성 실패:", error);
      Alert.alert(
        "등록 실패",
        "게시글 등록 또는 채팅방 생성에 실패했어요. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={25} color="#222222" />
            </Pressable>

            <Text style={styles.headerTitle}>분철 게시글 작성</Text>

            <View style={styles.headerRight} />
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              isKeyboardVisible && styles.scrollContentKeyboard,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            scrollEnabled
          >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>사진 추가</Text>
                <Text style={styles.photoCount}>{photoCount} / 5</Text>
              </View>

              <View style={styles.photoRow}>
                <Pressable style={styles.photoBox} onPress={handleAddPhoto}>
                  <Ionicons name="add" size={26} color="#A8A29E" />
                </Pressable>
              </View>

              {(isAnalyzing || isAiDone) && (
                <View style={[styles.aiNotice, isAiDone && styles.aiNoticeDone]}>
                  <Ionicons
                    name={isAnalyzing ? "sparkles-outline" : "checkmark-circle"}
                    size={14}
                    color={isAnalyzing ? "#8C8178" : "#20B979"}
                  />

                  <Text
                    style={[
                      styles.aiNoticeText,
                      isAiDone && styles.aiNoticeTextDone,
                    ]}
                  >
                    {isAnalyzing
                      ? "사진을 분석해서 제목과 그룹을 찾는 중이에요."
                      : "AI가 제목과 그룹을 채웠어요. 수정해도 괜찮아요."}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionTitle}>게시글 제목 *</Text>
                {titleBadgeText.length > 0 && (
                  <Text
                    style={[
                      styles.stateBadge,
                      titleSource === "edited" && styles.stateBadgeEdited,
                    ]}
                  >
                    {titleBadgeText}
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.inputWrap,
                  titleSource === "ai" && !isTitleFocused && styles.aiInputWrap,
                  isTitleFocused && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="제목을 입력해 주세요."
                  placeholderTextColor="#B4B4B4"
                  value={title}
                  onFocus={handleTitleFocus}
                  onBlur={() => setIsTitleFocused(false)}
                  onChangeText={handleTitleChange}
                />

                <Pressable
                  style={styles.smallAssistButton}
                  onPress={handleRunAiAnalyze}
                >
                  <Text style={styles.smallAssistText}>
                    {isAnalyzing ? "인식 중" : "AI"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionTitle}>그룹명 *</Text>
                {groupBadgeText.length > 0 && (
                  <Text
                    style={[
                      styles.stateBadge,
                      groupSource === "edited" && styles.stateBadgeEdited,
                      groupSource === "manual" && styles.stateBadgeManual,
                    ]}
                  >
                    {groupBadgeText}
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.inputWrap,
                  groupSource === "ai" && !isGroupFocused && styles.aiInputWrap,
                  isGroupFocused && styles.inputWrapFocused,
                ]}
              >
                <Ionicons
                  name="search"
                  size={17}
                  color="#B1AAA3"
                  style={styles.searchIcon}
                />

                <TextInput
                  style={styles.groupInput}
                  placeholder="그룹명을 검색해 주세요."
                  placeholderTextColor="#B4B4B4"
                  value={groupName}
                  onFocus={handleGroupFocus}
                  onChangeText={handleGroupChange}
                />

                {groupName.length > 0 && (
                  <Pressable hitSlop={8} onPress={handleClearGroup}>
                    <Ionicons name="close-circle" size={18} color="#C8C1BA" />
                  </Pressable>
                )}
              </View>

              {showGroupDropdown && (
                <View style={styles.groupDropdown}>
                  <Text style={styles.groupDropdownTitle}>검색 결과</Text>

                  {groupSuggestions.length > 0 ? (
                    groupSuggestions.map((group) => (
                      <Pressable
                        key={group.id}
                        onPress={() => applyGroup(group, "manual")}
                        style={({ pressed }) => [
                          styles.groupDropdownItem,
                          pressed && styles.groupDropdownItemPressed,
                        ]}
                      >
                        <View style={styles.groupResultLeft}>
                          <View style={styles.groupResultIcon}>
                            <Text style={styles.groupResultInitial}>
                              {group.name.slice(0, 1)}
                            </Text>
                          </View>

                          <View>
                            <Text style={styles.groupDropdownText}>
                              {group.name}
                            </Text>
                            <Text style={styles.groupDropdownSubText}>
                              멤버 목록 불러오기
                            </Text>
                          </View>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#B8B1AA"
                        />
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.groupEmptyBox}>
                      <Ionicons
                        name="search-outline"
                        size={18}
                        color="#B8B1AA"
                      />
                      <Text style={styles.emptyGroupText}>
                        검색 결과가 없어요
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {isGroupLoading && (
                <View style={styles.groupSelectedBox}>
                  <Ionicons name="sync-outline" size={15} color="#83776D" />
                  <Text style={styles.groupLoadingText}>
                    멤버 목록을 불러오는 중이에요.
                  </Text>
                </View>
              )}

              {selectedGroupId !== null && !showGroupDropdown && !isGroupLoading && (
                <View style={styles.groupSelectedBox}>
                  <Ionicons name="checkmark-circle" size={15} color="#20B979" />
                  <Text style={styles.groupSelectedText}>
                    선택한 그룹의 멤버 목록을 불러왔어요.
                  </Text>
                </View>
              )}

              {groupSource === "edited" && (
                <Text style={styles.fieldHelperText}>
                  그룹명을 수정한 뒤 검색 결과에서 그룹을 선택해 주세요.
                </Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>멤버별 가격 설정 *</Text>

              {members.length === 0 ? (
                <View style={styles.emptyMemberBox}>
                  <Text style={styles.emptyMemberText}>
                    그룹을 선택하면 멤버 리스트가 자동으로 표시돼요.
                  </Text>
                </View>
              ) : (
                <View style={styles.memberList}>
                  {members.map((member) => (
                    <View
                      key={`${selectedGroupId}-${member.id}`}
                      style={styles.memberItem}
                    >
                      <View style={styles.memberLeft}>
                        <View style={styles.memberCircle}>
                          <Text style={styles.memberInitial}>
                            {member.initial}
                          </Text>
                        </View>
                        <Text style={styles.memberName}>{member.name}</Text>
                      </View>

                      <View style={styles.priceInputWrap}>
                        <Text style={styles.wonText}>₩</Text>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="가격 입력"
                          placeholderTextColor="#B9B1AA"
                          keyboardType="number-pad"
                          value={member.price}
                          onChangeText={(text) =>
                            handlePriceChange(member.id, text)
                          }
                        />
                      </View>

                      <Pressable
                        onPress={() => handleRemoveMember(member.id)}
                        hitSlop={10}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close" size={22} color="#B8B1AA" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>구성품 설정</Text>

              <View style={styles.componentInputRow}>
                <TextInput
                  style={styles.componentInput}
                  placeholder="추가 구성품 입력"
                  placeholderTextColor="#B4B4B4"
                  value={componentText}
                  onChangeText={setComponentText}
                  returnKeyType="done"
                  onSubmitEditing={handleAddComponent}
                />

                <Pressable style={styles.addButton} onPress={handleAddComponent}>
                  <Text style={styles.addButtonText}>추가</Text>
                </Pressable>
              </View>

              {components.length > 0 ? (
                <View style={styles.chipWrap}>
                  {components.map((item) => (
                    <View key={item} style={styles.chip}>
                      <Text style={styles.chipText}>{item}</Text>
                      <Pressable onPress={() => handleRemoveComponent(item)}>
                        <Text style={styles.chipRemove}>x</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyChipText}>추가된 구성품이 없어요.</Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>배송 방법 *</Text>

              <View style={styles.deliveryRow}>
                <Pressable
                  style={[
                    styles.deliveryButton,
                    deliveryMethod === "GS" && styles.deliveryButtonActive,
                  ]}
                  onPress={() => setDeliveryMethod("GS")}
                >
                  <Text
                    style={[
                      styles.deliveryText,
                      deliveryMethod === "GS" && styles.deliveryTextActive,
                    ]}
                  >
                    GS 반값택배
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.deliveryButton,
                    deliveryMethod === "CU" && styles.deliveryButtonActive,
                  ]}
                  onPress={() => setDeliveryMethod("CU")}
                >
                  <Text
                    style={[
                      styles.deliveryText,
                      deliveryMethod === "CU" && styles.deliveryTextActive,
                    ]}
                  >
                    CU 반값택배
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>게시글 내용 *</Text>

              <TextInput
                style={styles.contentInput}
                placeholder={
                  "게시글 내용을 작성해주세요.\n예 ) 특이사항, 거래 시 유의사항 등"
                }
                placeholderTextColor="#B4B4B4"
                multiline
                textAlignVertical="top"
                value={content}
                onFocus={handleContentFocus}
                onChangeText={setContent}
                maxLength={500}
              />

              <Text style={styles.contentCount}>{content.length} / 500</Text>
            </View>
          </ScrollView>

          {!isKeyboardVisible && (
            <View style={styles.bottomArea}>
              <Pressable
                disabled={!isButtonActive}
                style={[
                  styles.submitButton,
                  !isButtonActive && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    !isButtonActive && styles.submitButtonTextDisabled,
                  ]}
                >
                  {isSubmitting ? "등록 중..." : "분철 게시글 등록하기"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111111",
  },

  headerRight: {
    width: 36,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 135,
  },

  scrollContentKeyboard: {
    paddingBottom: 6,
  },

  section: {
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B5651",
    marginBottom: 12,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  stateBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: "#F3EFEA",
    color: "#83776D",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 12,
    overflow: "hidden",
  },

  stateBadgeEdited: {
    backgroundColor: "#FFF8DE",
    color: "#D39B00",
  },

  stateBadgeManual: {
    backgroundColor: "#EEF7FF",
    color: "#4A83B8",
  },

  photoCount: {
    fontSize: 13,
    color: "#AAA29B",
    marginBottom: 12,
  },

  photoRow: {
    flexDirection: "row",
    gap: 12,
  },

  photoBox: {
    width: 82,
    height: 82,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DDD8D3",
    backgroundColor: "#F7F5F4",
    justifyContent: "center",
    alignItems: "center",
  },

  aiNotice: {
    marginTop: 11,
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "#F7F5F4",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  aiNoticeDone: {
    backgroundColor: "#F0FBF6",
  },

  aiNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#83776D",
  },

  aiNoticeTextDone: {
    color: "#20996A",
  },

  divider: {
    height: 1,
    backgroundColor: "#E9E4DE",
    marginBottom: 16,
  },

  inputWrap: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD8D3",
    borderRadius: 13,
    paddingLeft: 15,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  aiInputWrap: {
    backgroundColor: "#FAF8F2",
  },

  inputWrapFocused: {
    borderColor: "#CFC7BF",
    backgroundColor: "#FFFFFF",
  },

  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#222222",
  },

  fieldHelperText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 16,
    color: "#9A9189",
  },

  smallAssistButton: {
    height: 30,
    minWidth: 42,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F3EFEA",
    justifyContent: "center",
    alignItems: "center",
  },

  smallAssistText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#83776D",
  },

  searchIcon: {
    marginRight: 7,
  },

  groupInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#222222",
  },

  groupDropdown: {
    marginTop: 9,
    borderWidth: 1,
    borderColor: "#E4DED8",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  groupDropdownTitle: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#AAA29B",
  },

  groupDropdownItem: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },

  groupDropdownItemPressed: {
    backgroundColor: "#FFF8DE",
  },

  groupResultLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  groupResultIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3EFEA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  groupResultInitial: {
    fontSize: 12,
    fontWeight: "800",
    color: "#83776D",
  },

  groupDropdownText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2B2B2B",
  },

  groupDropdownSubText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#AAA29B",
  },

  groupEmptyBox: {
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },

  emptyGroupText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#AAA29B",
  },

  groupSelectedBox: {
    marginTop: 8,
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "#F0FBF6",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  groupSelectedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#20996A",
  },

  groupLoadingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#83776D",
  },

  emptyMemberBox: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#E1DDD8",
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FAF8F6",
  },

  emptyMemberText: {
    fontSize: 13,
    color: "#AAA29B",
  },

  memberList: {
    gap: 8,
  },

  memberItem: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E1DDD8",
    borderRadius: 13,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  memberLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  memberCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#F1ECE6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  memberInitial: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C7168",
  },

  memberName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2B2B2B",
  },

  priceInputWrap: {
    width: 122,
    height: 32,
    borderWidth: 1,
    borderColor: "#E1DDD8",
    borderRadius: 8,
    backgroundColor: "#FAF8F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
  },

  wonText: {
    fontSize: 13,
    color: "#B9B1AA",
    marginRight: 3,
  },

  priceInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: "#222222",
    padding: 0,
  },

  removeButton: {
    marginLeft: 10,
  },

  componentInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  componentInput: {
    flex: 1,
    height: 47,
    borderWidth: 1,
    borderColor: "#DDD8D3",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  addButton: {
    width: 61,
    height: 47,
    borderRadius: 12,
    backgroundColor: "#F7C94B",
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 9,
    backgroundColor: "#DDF8EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#20B979",
  },

  chipRemove: {
    fontSize: 12,
    color: "#5F9F82",
  },

  emptyChipText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#AAA29B",
  },

  deliveryRow: {
    flexDirection: "row",
    gap: 10,
  },

  deliveryButton: {
    width: 113,
    height: 41,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1DDD8",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  deliveryButtonActive: {
    borderColor: "#FFC400",
    backgroundColor: "#FFF8DE",
  },

  deliveryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#AAA29B",
  },

  deliveryTextActive: {
    color: "#E5A900",
  },

  contentInput: {
    height: 90,
    borderWidth: 1,
    borderColor: "#DDD8D3",
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 14,
    fontSize: 14,
    lineHeight: 20,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },

  contentCount: {
    marginTop: 6,
    textAlign: "right",
    fontSize: 12,
    color: "#B4AEA8",
  },

  bottomArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },

  submitButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: "#FFD84D",
    justifyContent: "center",
    alignItems: "center",
  },

  submitButtonDisabled: {
    backgroundColor: "#FFE8A6",
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  submitButtonTextDisabled: {
    color: "#FFFFFF",
  },
});