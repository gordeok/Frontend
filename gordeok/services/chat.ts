import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getStoredUserId } from "../utils/api";

export type ChatRoomApiItem = {
  chatRoomId: number;
  title: string;
  sellerName: string;
  currentMembers: number;
  maxMembers: number;
  lastMessage: string;
  unreadCount: number;
  lastMessageTime: string;
  status: "progress" | "done" | string;
  myRole: "SELLER" | "BUYER" | string;
  type: "GROUP" | "DIRECT" | string;
};

export type ChatMessageApiItem = {
  messageId: number;
  senderId: number | null;
  senderNickname: string;
  content: string;
  messageType:
    | "TEXT"
    | "IMAGE"
    | "TRANSACTION_COMPLETE"
    | "TRACKING_SHARED"
    | "FRAUD_WARNING"
    | "FRAUD_DANGER"
    | string;
  createdAt: string;
  reason?: string;
};

export type ChatMenuParticipant = {
  userId: number;
  nickname: string;
  memberName: string;
  role: "SELLER" | "BUYER" | string;
};

export type ChatMenuResponse = {
  chatRoomId: number;
  title: string;
  postStatus: string;
  myRole: "SELLER" | "BUYER" | string;
  participants: ChatMenuParticipant[];
};

export type BuyerInfoResponse = {
  nickname: string;
  memberName: string;
  realName: string;
  phoneNumber: string;
  storeName: string;
  requestMessage: string;
};

export type TrackingSetupBuyer = {
  buyerUserId: number;
  nickname: string;
  memberName: string;
};

export type TrackingSetupResponse = {
  defaultCourierType: string;
  buyers: TrackingSetupBuyer[];
};

export type ShareTrackingRequest = {
  trackingList: {
    buyerUserId: number;
    courierType: string;
    trackingNumber: string;
  }[];
};

export type TrackingInfoResponse = {
  courierType: string;
  trackingNumber: string;
  trackingUrl: string;
};

export type CreateSellerChatRoomResponse = {
  chatRoomId: number;
  message: string;
};

export type SelectMemberItemRequest = {
  buyerId: number;
  recipientName: string;
  phoneNumber: string;
  convenienceStore: string;
  request?: string;
};

export type SelectMemberItemResponse = {
  chatRoomId: number;
  message: string;
};

const USER_STORAGE_KEYS = [
  "userId",
  "USER_ID",
  "GO_REUDEOK_USER_ID",
  "GO_REUDEOK_USER",
  "GO_REUDEOK_LOGIN_USER",
  "loginUser",
  "user",
  "auth",
  "authUser",
];

function extractUserId(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || trimmed === "null" || trimmed === "undefined") {
      return null;
    }

    const parsedNumber = Number(trimmed);

    if (!Number.isNaN(parsedNumber)) {
      return parsedNumber;
    }

    try {
      const parsedJson = JSON.parse(trimmed);
      return extractUserId(parsedJson);
    } catch {
      return null;
    }
  }

  if (typeof value === "object") {
    const candidates = [
      value.userId,
      value.id,
      value.memberId,
      value.user?.userId,
      value.user?.id,
      value.data?.userId,
      value.data?.id,
      value.data?.user?.userId,
      value.data?.user?.id,
      value.result?.userId,
      value.result?.id,
      value.result?.user?.userId,
      value.result?.user?.id,
      value.response?.userId,
      value.response?.id,
    ];

    for (const candidate of candidates) {
      const extracted = extractUserId(candidate);

      if (extracted !== null) {
        return extracted;
      }
    }
  }

  return null;
}

async function findUserIdFromStorage() {
  for (const key of USER_STORAGE_KEYS) {
    try {
      const value = await AsyncStorage.getItem(key);
      const userId = extractUserId(value);

      if (userId !== null) {
        return userId;
      }
    } catch {
      // 다음 key 확인
    }
  }

  return null;
}

async function requireUserId() {
  const storedValue = await Promise.resolve(getStoredUserId());
  const userIdFromUtil = extractUserId(storedValue);

  if (userIdFromUtil !== null) {
    console.log("현재 userId:", userIdFromUtil);
    return userIdFromUtil;
  }

  const userIdFromStorage = await findUserIdFromStorage();

  if (userIdFromStorage !== null) {
    console.log("현재 userId:", userIdFromStorage);
    return userIdFromStorage;
  }

  console.log("userId 추출 실패 getStoredUserId 값:", storedValue);
  throw new Error("userId를 찾을 수 없습니다. 로그인 후 다시 시도해주세요.");
}

export async function getChatRooms() {
  const userId = await requireUserId();

  return apiRequest<ChatRoomApiItem[]>("/api/chat-rooms", {
    method: "GET",
    query: {
      userId,
    },
  });
}

export async function createSellerChatRoom(
    postId: number | string,
    postTitle: string
  ) {
    const sellerId = await requireUserId();
  
    console.log("판매자 채팅방 생성 sellerId:", sellerId);
    console.log("판매자 채팅방 제목:", postTitle);
  
    return apiRequest<CreateSellerChatRoomResponse>(
      `/api/chat-rooms/posts/${postId}`,
      {
        method: "POST",
        query: {
          sellerId,
        },
        body: JSON.stringify({
          title: postTitle,
          postTitle,
        }),
      }
    );
}

export async function selectMemberItem(
  memberItemId: number | string,
  body: Omit<SelectMemberItemRequest, "buyerId">
) {
  const buyerId = await requireUserId();

  console.log("멤버 선택 완료 buyerId:", buyerId);

  return apiRequest<SelectMemberItemResponse>(
    `/api/member-items/${memberItemId}/select`,
    {
      method: "POST",
      body: JSON.stringify({
        buyerId,
        recipientName: body.recipientName,
        phoneNumber: body.phoneNumber,
        convenienceStore: body.convenienceStore,
        request: body.request ?? "",
      }),
    }
  );
}

export async function getChatMessages(chatRoomId: number | string) {
  return apiRequest<ChatMessageApiItem[]>(
    `/api/chat-rooms/${chatRoomId}/messages`,
    {
      method: "GET",
    }
  );
}

export async function getChatMenu(chatRoomId: number | string) {
  const userId = await requireUserId();

  return apiRequest<ChatMenuResponse>(`/api/chat-rooms/${chatRoomId}/menu`, {
    method: "GET",
    query: {
      userId,
    },
  });
}

export async function getBuyerInfo(
  chatRoomId: number | string,
  buyerUserId: number | string
) {
  return apiRequest<BuyerInfoResponse>(
    `/api/chat-rooms/${chatRoomId}/participants/${buyerUserId}/info`,
    {
      method: "GET",
    }
  );
}

export async function completeChatRoom(chatRoomId: number | string) {
  return apiRequest<void>(`/api/chat-rooms/${chatRoomId}/complete`, {
    method: "PATCH",
  });
}

export async function cancelChatRoom(chatRoomId: number | string) {
  return apiRequest<void>(`/api/chat-rooms/${chatRoomId}/cancel`, {
    method: "PATCH",
  });
}

export async function getTrackingSetup(chatRoomId: number | string) {
  return apiRequest<TrackingSetupResponse>(
    `/api/chat-rooms/${chatRoomId}/tracking/setup`,
    {
      method: "GET",
    }
  );
}

export async function shareTracking(
  chatRoomId: number | string,
  body: ShareTrackingRequest
) {
  return apiRequest<void>(`/api/chat-rooms/${chatRoomId}/tracking`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getTrackingInfo(chatRoomId: number | string) {
  const userId = await requireUserId();

  return apiRequest<TrackingInfoResponse>(
    `/api/chat-rooms/${chatRoomId}/tracking`,
    {
      method: "GET",
      query: {
        userId,
      },
    }
  );
}

export async function leaveChatRoom(chatRoomId: number | string) {
  const userId = await requireUserId();

  return apiRequest<void>(`/api/chat-rooms/${chatRoomId}/leave`, {
    method: "DELETE",
    query: {
      userId,
    },
  });
}
