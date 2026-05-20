import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    Keyboard,
  } from "react-native";
  import { Ionicons } from "@expo/vector-icons";
  import { useRouter } from "expo-router";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { useEffect, useState } from "react";
  
  export default function DivideJoin() {
    const router = useRouter();
  
    const [receiverName, setReceiverName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [storeName, setStoreName] = useState("");
    const [requestText, setRequestText] = useState("");
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
    useEffect(() => {
      const showSub = Keyboard.addListener("keyboardDidShow", () => {
        setIsKeyboardVisible(true);
      });
  
      const hideSub = Keyboard.addListener("keyboardDidHide", () => {
        setIsKeyboardVisible(false);
      });
  
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);
  
    const formatPhoneNumber = (text: string) => {
      const onlyNumber = text.replace(/[^0-9]/g, "");
  
      if (onlyNumber.length <= 3) {
        return onlyNumber;
      }
  
      if (onlyNumber.length <= 7) {
        return `${onlyNumber.slice(0, 3)}-${onlyNumber.slice(3)}`;
      }
  
      return `${onlyNumber.slice(0, 3)}-${onlyNumber.slice(
        3,
        7
      )}-${onlyNumber.slice(7, 11)}`;
    };
  
    const handlePhoneChange = (text: string) => {
      setPhoneNumber(formatPhoneNumber(text));
    };
  
    const isValidPhoneNumber = /^01[016789]-\d{3,4}-\d{4}$/.test(phoneNumber);
  
    const isButtonActive =
      receiverName.trim().length > 0 &&
      isValidPhoneNumber &&
      storeName.trim().length > 0;
  
    const handleEnterChat = () => {
      if (!isButtonActive) return;
  
      router.push("/chats");
    };
  
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={26} color="#222" />
            </Pressable>
  
            <Text style={styles.headerTitle}>분철 참여글 작성</Text>
  
            <View style={styles.headerRight} />
          </View>
  
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              isKeyboardVisible && styles.scrollContentKeyboard,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>받으시는 분</Text>
              <TextInput
                style={styles.input}
                placeholder="실명으로 입력해 주세요."
                placeholderTextColor="#AFAFAF"
                value={receiverName}
                onChangeText={setReceiverName}
                returnKeyType="next"
              />
            </View>
  
            <View style={styles.formGroup}>
              <Text style={styles.label}>전화번호</Text>
              <TextInput
                style={styles.input}
                placeholder="010-0000-0000"
                placeholderTextColor="#AFAFAF"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                maxLength={13}
              />
            </View>
  
            <View style={styles.divider} />
  
            <View style={styles.formGroup}>
              <Text style={styles.label}>편의점 지점명</Text>
              <TextInput
                style={styles.input}
                placeholder="예시 ) GS 25 숙대입구점"
                placeholderTextColor="#AFAFAF"
                value={storeName}
                onChangeText={setStoreName}
                returnKeyType="next"
              />
            </View>
  
            <View style={styles.divider} />
  
            <View style={styles.formGroup}>
              <Text style={styles.label}>요청사항</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="판매자에게 원하는 요청 사항을 적어 주세요."
                placeholderTextColor="#AFAFAF"
                multiline
                textAlignVertical="top"
                value={requestText}
                onChangeText={setRequestText}
              />
            </View>
          </ScrollView>
  
          {!isKeyboardVisible && (
            <View style={styles.bottomArea}>
              <Text style={styles.notice}>
                잘못된 정보 입력으로 인한 책임은 작성자 본인에게 있습니다.{"\n"}
                다시 한 번 작성한 정보를 확인해주시기 바랍니다.
              </Text>
  
              <Pressable
                disabled={!isButtonActive}
                style={[
                  styles.joinButton,
                  !isButtonActive && styles.joinButtonDisabled,
                ]}
                onPress={handleEnterChat}
              >
                <Text style={styles.joinButtonText}>채팅방 입장</Text>
              </Pressable>
            </View>
          )}
        </View>
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      backgroundColor: "#FFFFFF",
    },
  
    backButton: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "flex-start",
    },
  
    headerTitle: {
      fontSize: 20,
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
      paddingBottom: 24,
    },
  
    scrollContentKeyboard: {
      paddingBottom: 40,
    },
  
    formGroup: {
      marginBottom: 20,
    },
  
    label: {
      fontSize: 15,
      fontWeight: "700",
      color: "#555555",
      marginBottom: 9,
    },
  
    input: {
      width: "100%",
      height: 60,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      color: "#222222",
      backgroundColor: "#FFFFFF",
    },
  
    textArea: {
      height: 112,
      paddingTop: 17,
      paddingBottom: 17,
    },
  
    divider: {
      height: 1,
      backgroundColor: "#E5E1DA",
      marginBottom: 20,
    },
  
    bottomArea: {
      paddingHorizontal: 30,
      paddingTop: 8,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: "#E5E1DA",
      backgroundColor: "#FFFFFF",
    },
  
    notice: {
      fontSize: 11,
      lineHeight: 15,
      color: "#666666",
      textAlign: "center",
      marginBottom: 7,
    },
  
    joinButton: {
      height: 52,
      borderRadius: 15,
      backgroundColor: "#FFD84D",
      justifyContent: "center",
      alignItems: "center",
    },
  
    joinButtonDisabled: {
      backgroundColor: "#FFF1BF",
    },
  
    joinButtonText: {
      fontSize: 17,
      fontWeight: "800",
      color: "#FFFFFF",
    },
  });