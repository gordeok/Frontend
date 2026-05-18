// 채팅방 화면

import React, { useRef, useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type MemberStatus = "paid" | "reserved" | "empty";
type MemberRole = "seller" | "buyer";

type RoomMember = {
  id: number;
  nickname: string;
  memberName: string;
  role: MemberRole;
  status: MemberStatus;
};

type ChatMessage =
  | {
      id: number;
      type: "system";
      content: string;
    }
  | {
      id: number;
      type: "text";
      senderId: number;
      senderName: string;
      senderRole: MemberRole;
      memberName: string;
      content: string;
      time: string;
      isMine: boolean;
      showProfile: boolean;
      variant?: "normal" | "account";
    };

const MY_USER_ID = 2;
const YELLOW = "#F0CF63";

const dummyRoom = {
  id: 1,
  title: "에스파 Drama 정규 1집",
  status: "예약 진행중",
  date: "2026년 5월 11일 월요일",
  members: [
    {
      id: 1,
      nickname: "분철의달인",
      memberName: "카리나",
      role: "seller",
      status: "paid",
    },
    {
      id: 2,
      nickname: "나",
      memberName: "카리나",
      role: "buyer",
      status: "paid",
    },
    {
      id: 3,
      nickname: "윈터러버",
      memberName: "윈터",
      role: "buyer",
      status: "paid",
    },
    {
      id: 4,
      nickname: "닝구르트",
      memberName: "닝닝",
      role: "buyer",
      status: "reserved",
    },
    {
      id: 5,
      nickname: "지젤최고",
      memberName: "지젤",
      role: "buyer",
      status: "empty",
    },
  ] as RoomMember[],
};

const dummyMessages: ChatMessage[] = [
  {
    id: 1,
    type: "system",
    content: "분철의달인 님이 단톡방을 만들었어요",
  },
  {
    id: 2,
    type: "text",
    senderId: 1,
    senderName: "분철의달인",
    senderRole: "seller",
    memberName: "카리나",
    content:
      "안녕하세요! Drama 분철 참여해주셔서\n감사합니다 🙌 아래 계좌로 입금 부탁드려요.",
    time: "2:01 PM",
    isMine: false,
    showProfile: true,
  },
  {
    id: 3,
    type: "text",
    senderId: 1,
    senderName: "분철의달인",
    senderRole: "seller",
    memberName: "카리나",
    content:
      "입금 계좌\n카카오뱅크 3333-01-1234567\n예금주: 김○철\n입금 시 닉네임 + 멤버명 기재",
    time: "2:02 PM",
    isMine: false,
    showProfile: false,
    variant: "account",
  },
  {
    id: 4,
    type: "text",
    senderId: MY_USER_ID,
    senderName: "나",
    senderRole: "buyer",
    memberName: "카리나",
    content: "카리나 슬롯 입금 완료했어요!",
    time: "2:14 PM",
    isMine: true,
    showProfile: false,
  },
  {
    id: 5,
    type: "text",
    senderId: 3,
    senderName: "윈터러버",
    senderRole: "buyer",
    memberName: "윈터",
    content: "저도 윈터 슬롯 방금 보냈습니다 :)",
    time: "2:18 PM",
    isMine: false,
    showProfile: true,
  },
];

export default function ChatRoomScreen() {
  const router = useRouter();
  const { chatRoomId } = useLocalSearchParams();

  const [showMenu, setShowMenu] = useState(false);
  const [showDetailMenu, setShowDetailMenu] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(dummyMessages);
  const [inputText, setInputText] = useState("");

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      type: "text",
      senderId: MY_USER_ID,
      senderName: "나",
      senderRole: "buyer",
      memberName: "카리나",
      content: inputText,
      time: "방금",
      isMine: true,
      showProfile: false,
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputText("");
    setShowMenu(false);
    scrollToBottom();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#666" />
          </TouchableOpacity>

          <Text style={styles.title} numberOfLines={1}>
            {dummyRoom.title}
          </Text>

          <TouchableOpacity onPress={() => setShowDetailMenu(true)}>
            <Ionicons name="menu" size={30} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusTopRow}>
            <Text style={styles.statusLabel}>현재 상태</Text>

            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{dummyRoom.status}</Text>
            </View>

            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => setShowDetailMenu(true)}
            >
              <Text style={styles.detailText}>자세히 보기 ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.memberRow}>
            {dummyRoom.members
              .filter((member) => member.role !== "seller")
              .map((member) => (
                <MemberChip key={member.id} member={member} />
              ))}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{dummyRoom.date}</Text>
          </View>

          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))}
        </ScrollView>

        {showMenu && <PlusMenu />}

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons
              name={showMenu ? "close" : "add"}
              size={32}
              color="#666"
            />
          </TouchableOpacity>

          <TextInput
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#999"
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            onFocus={scrollToBottom}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color="black" />
          </TouchableOpacity>
        </View>

        {showDetailMenu && (
          <DetailMenu room={dummyRoom} onClose={() => setShowDetailMenu(false)} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MemberChip({ member }: { member: RoomMember }) {
  const chipStyle =
    member.status === "paid"
      ? styles.greenChip
      : member.status === "reserved"
      ? styles.brownChip
      : styles.grayChip;

  const dotStyle =
    member.status === "paid"
      ? styles.greenDot
      : member.status === "reserved"
      ? styles.brownDot
      : styles.grayDot;

  const textStyle =
    member.status === "paid"
      ? styles.greenChipText
      : member.status === "reserved"
      ? styles.brownChipText
      : styles.grayChipText;

  return (
    <View style={chipStyle}>
      <View style={dotStyle} />
      <Text style={textStyle}>{member.memberName}</Text>
    </View>
  );
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  if (message.type === "system") {
    return <Text style={styles.systemText}>{message.content}</Text>;
  }

  if (message.isMine) {
    return (
      <View style={styles.myMessageWrapper}>
        <Text style={styles.myTimeText}>{message.time}</Text>

        <View style={styles.rightMessage}>
          <Text style={styles.myMessageText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.otherMessageContainer}>
      {message.showProfile ? (
        <ProfileIcon message={message} />
      ) : (
        <View style={styles.profileBlank} />
      )}

      <View style={styles.messageContent}>
        {message.showProfile && (
          <View style={styles.nameRow}>
            <Text style={styles.username}>{message.senderName}</Text>

            {message.senderRole === "seller" && (
              <View style={styles.sellerBadge}>
                <Text style={styles.sellerBadgeText}>판매자</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.messageRow}>
          <View style={styles.leftMessage}>
            {message.variant === "account" ? (
              <AccountMessage content={message.content} />
            ) : (
              <Text style={styles.messageText}>{message.content}</Text>
            )}
          </View>

          {message.variant !== "account" && (
            <Text style={styles.timeText}>{message.time}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function ProfileIcon({
  message,
}: {
  message: Extract<ChatMessage, { type: "text" }>;
}) {
  if (message.senderRole === "seller") {
    return (
      <View style={styles.profileCircle}>
        <Text style={styles.profileText}>♛</Text>
      </View>
    );
  }

  return (
    <View style={styles.buyerProfileCircle}>
      <Text style={styles.buyerProfileText}>
        {message.memberName.slice(0, 1)}
      </Text>
    </View>
  );
}

function AccountMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <>
      <Text style={styles.boldText}>{lines[0]}</Text>

      <Text style={styles.messageText}>
        {lines[1]}
        {"\n"}
        {lines[2]}
      </Text>

      <Text style={styles.orangeText}>{lines[3]}</Text>
    </>
  );
}

function PlusMenu() {
  return (
    <View style={styles.plusMenu}>
      <View style={styles.menuRow}>
        <View style={styles.menuItem}>
          <View style={styles.pinkCircle}>
            <Ionicons name="image-outline" size={34} color="black" />
          </View>
          <Text style={styles.menuText}>사진 / 동영상</Text>
        </View>

        <View style={styles.menuItem}>
          <View style={styles.yellowCircle}>
            <Ionicons name="wallet-outline" size={34} color="black" />
          </View>
          <Text style={styles.menuText}>계좌 공유</Text>
        </View>

        <View style={styles.menuItem}>
          <View style={styles.greenCircle}>
            <Ionicons name="location-outline" size={34} color="black" />
          </View>
          <Text style={styles.menuText}>주소 공유</Text>
        </View>

        <View style={styles.menuItem}>
          <View style={styles.blueCircle}>
            <Ionicons name="cube-outline" size={34} color="black" />
          </View>
          <Text style={styles.menuText}>운송장 번호 공유</Text>
        </View>
      </View>
    </View>
  );
}

function DetailMenu({
  room,
  onClose,
}: {
  room: typeof dummyRoom;
  onClose: () => void;
}) {
  return (
    <View style={styles.detailMenuContainer}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={28} color="#666" />
        </TouchableOpacity>

        <Text style={styles.detailTitle}>메뉴</Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={styles.albumCard}>
        <View style={styles.albumIcon}>
          <Text style={styles.albumIconText}>♛</Text>
        </View>

        <Text style={styles.albumTitle}>{room.title}</Text>
      </View>

      <View style={styles.memberCard}>
        <Text style={styles.memberTitle}>
          대화상대 <Text style={styles.memberCount}>{room.members.length}</Text>
        </Text>

        {room.members.map((member, index) => (
          <DetailMemberItem
            key={member.id}
            member={member}
            isLast={index === room.members.length - 1}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.exitButton}>
        <View style={styles.exitLeft}>
          <Ionicons name="log-out-outline" size={26} color="#B44D47" />
          <Text style={styles.exitText}>채팅방 나가기</Text>
        </View>

        <Ionicons name="chevron-forward" size={26} color="#B44D47" />
      </TouchableOpacity>
    </View>
  );
}

function DetailMemberItem({
  member,
  isLast,
}: {
  member: RoomMember;
  isLast: boolean;
}) {
  return (
    <View style={isLast ? styles.memberItemNoBorder : styles.memberItem}>
      <DetailProfileIcon member={member} />

      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{member.nickname}</Text>

          {member.role === "seller" && (
            <View style={styles.menuSellerBadge}>
              <Text style={styles.menuSellerBadgeText}>판매자</Text>
            </View>
          )}
        </View>

        <Text style={styles.memberSub}>{member.memberName}</Text>
      </View>
    </View>
  );
}

function DetailProfileIcon({ member }: { member: RoomMember }) {
  if (member.role === "seller") {
    return (
      <View style={styles.memberProfileYellow}>
        <Text style={styles.memberProfileText}>♛</Text>
      </View>
    );
  }

  if (member.status === "paid") {
    return (
      <View style={styles.memberProfileGreen}>
        <Text style={styles.memberProfileGreenText}>
          {member.memberName.slice(0, 1)}
        </Text>
      </View>
    );
  }

  if (member.status === "reserved") {
    return (
      <View style={styles.memberProfileBrown}>
        <Text style={styles.memberProfileBrownText}>
          {member.memberName.slice(0, 1)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.memberProfileGray}>
      <Text style={styles.memberProfileGrayText}>
        {member.memberName.slice(0, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  header: {
    height: 78,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },

  title: {
    flex: 1,
    fontSize: 21,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginHorizontal: 12,
  },

  statusContainer: {
    backgroundColor: "#FFFBEA",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EFE6BD",
  },

  statusTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#555",
  },

  statusBadge: {
    backgroundColor: YELLOW,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 15,
  },

  statusBadgeText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "black",
  },

  detailButton: {
    marginLeft: "auto",
  },

  detailText: {
    color: "#777",
    fontSize: 14,
  },

  memberRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  greenChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF7EE",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 10,
  },

  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF7A",
    marginRight: 6,
  },

  greenChipText: {
    color: "#4CAF7A",
    fontWeight: "bold",
    fontSize: 13,
  },

  brownChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5E8",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 10,
  },

  brownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#B67A2E",
    marginRight: 6,
  },

  brownChipText: {
    color: "#B67A2E",
    fontWeight: "bold",
    fontSize: 13,
  },

  grayChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 10,
  },

  grayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#BDBDBD",
    marginRight: 6,
  },

  grayChipText: {
    color: "#BDBDBD",
    fontWeight: "bold",
    fontSize: 13,
  },

  chatArea: {
    flex: 1,
    paddingHorizontal: 20,
  },

  chatContent: {
    paddingTop: 20,
    paddingBottom: 2,
  },

  dateContainer: {
    alignItems: "center",
    marginBottom: 12,
  },

  dateText: {
    backgroundColor: "#E5E5E5",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 13,
    color: "#666",
  },

  systemText: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    marginBottom: 28,
  },

  otherMessageContainer: {
    flexDirection: "row",
    marginBottom: 18,
  },

  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FFFBEA",
    borderWidth: 1,
    borderColor: "#F0E5B0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  profileBlank: {
    width: 48,
    marginRight: 12,
  },

  profileText: {
    fontSize: 24,
    color: "#B18A27",
  },

  buyerProfileCircle: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F0FFF7",
    borderWidth: 1,
    borderColor: "#BEEBD1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  buyerProfileText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3E9F72",
  },

  messageContent: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  username: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },

  sellerBadge: {
    backgroundColor: "#FFF1B8",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginLeft: 8,
    marginBottom: 6,
  },

  sellerBadgeText: {
    color: "#A56700",
    fontSize: 12,
    fontWeight: "bold",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  leftMessage: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: "82%",
  },

  messageText: {
    color: "black",
    fontSize: 15,
    lineHeight: 24,
  },

  boldText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  orangeText: {
    color: "#9A551F",
    fontSize: 15,
    marginTop: 8,
  },

  timeText: {
    fontSize: 11,
    color: "#999",
    marginLeft: 8,
    marginBottom: 5,
  },

  myMessageWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginVertical: 15,
  },

  myTimeText: {
    fontSize: 11,
    color: "#999",
    marginRight: 8,
    marginBottom: 5,
  },

  rightMessage: {
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: "75%",
  },

  myMessageText: {
    color: "black",
    fontSize: 15,
    lineHeight: 23,
  },

  plusMenu: {
    backgroundColor: "white",
    paddingVertical: 25,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },

  menuRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  menuItem: {
    alignItems: "center",
    width: 80,
  },

  menuText: {
    marginTop: 10,
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },

  pinkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EAC7BC",
    justifyContent: "center",
    alignItems: "center",
  },

  yellowCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F7F3DD",
    justifyContent: "center",
    alignItems: "center",
  },

  greenCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#D8E5C8",
    justifyContent: "center",
    alignItems: "center",
  },

  blueCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#D5E1F2",
    justifyContent: "center",
    alignItems: "center",
  },

  inputArea: {
    height: 80,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },

  iconButton: {
    width: 38,
    alignItems: "center",
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: 45,
    backgroundColor: "#F2F2F2",
    borderRadius: 25,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "black",
  },

  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: YELLOW,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  detailMenuContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F7F5EF",
    zIndex: 999,
    elevation: 999,
  },

  detailHeader: {
    height: 78,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },

  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
  },

  albumCard: {
    backgroundColor: "#FFFBEA",
    margin: 20,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  albumIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: YELLOW,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  albumIconText: {
    fontSize: 28,
    color: "#A17800",
  },

  albumTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: "bold",
    color: "black",
  },

  memberCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -5,
    borderRadius: 20,
    padding: 20,
  },

  memberTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 20,
  },

  memberCount: {
    color: YELLOW,
  },

  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 18,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  memberItemNoBorder: {
    flexDirection: "row",
    alignItems: "center",
  },

  memberInfo: {
    marginLeft: 14,
  },

  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  memberName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "black",
  },

  memberSub: {
    fontSize: 15,
    color: "#999",
    marginTop: 3,
  },

  menuSellerBadge: {
    backgroundColor: "#E7C75C",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginLeft: 10,
  },

  menuSellerBadgeText: {
    color: "#7A4C00",
    fontSize: 12,
    fontWeight: "bold",
  },

  memberProfileYellow: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFF5CC",
    justifyContent: "center",
    alignItems: "center",
  },

  memberProfileText: {
    fontSize: 24,
    color: "#A17800",
  },

  memberProfileGreen: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#DDF1E3",
    justifyContent: "center",
    alignItems: "center",
  },

  memberProfileGreenText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#438E63",
  },

  memberProfileBrown: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F3E0D2",
    justifyContent: "center",
    alignItems: "center",
  },

  memberProfileBrownText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#B0682D",
  },

  memberProfileGray: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },

  memberProfileGrayText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#888",
  },

  exitButton: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  exitLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  exitText: {
    color: "#B44D47",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
});