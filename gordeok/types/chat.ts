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

function extractUserId(value: any): number {
  if (value === null || value === undefined) {
    throw new Error("로그인된 userId가 없습니다.");
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error("로그인된 userId가 없습니다.");
    }

    const parsed = Number(trimmed);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    try {
      const json = JSON.parse(trimmed);
      return extractUserId(json);
    } catch {
      throw new Error("userId 문자열을 숫자로 변환할 수 없습니다.");
    }
  }

  if (typeof value === "object") {
    if (value.userId !== undefined) {
      return extractUserId(value.userId);
    }

    if (value.id !== undefined) {
      return extractUserId(value.id);
    }

    if (value.user?.userId !== undefined) {
      return extractUserId(value.user.userId);
    }

    if (value.user?.id !== undefined) {
      return extractUserId(value.user.id);
    }

    if (value.data?.userId !== undefined) {
      return extractUserId(value.data.userId);
    }

    if (value.data?.id !== undefined) {
      return extractUserId(value.data.id);
    }

    if (value.result?.userId !== undefined) {
      return extractUserId(value.result.userId);
    }

    if (value.result?.id !== undefined) {
      return extractUserId(value.result.id);
    }
  }

  console.log("userId 추출 실패 value:", value);
  throw new Error("userId를 찾을 수 없습니다.");
}

async function requireUserId() {
  const storedUserId = await getStoredUserId();
  const userId = extractUserId(storedUserId);

  console.log("현재 userId:", userId);

  return userId;
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

export async function createSellerChatRoom(postId: number | string) {
  const sellerId = await requireUserId();

  console.log("판매자 채팅방 생성 sellerId:", sellerId);

  return apiRequest<CreateSellerChatRoomResponse>(
    `/api/chat-rooms/posts/${postId}`,
    {
      method: "POST",
      query: {
        sellerId,
      },
    }
  );
}

export async function selectMemberItem(
  memberItemId: number | string,
  body: Omit<SelectMemberItemRequest, "buyerId">
) {
  const buyerId = await requireUserId();

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