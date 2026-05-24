    import { apiRequest } from "../utils/api";

    export type ChatRoom = {
    chatRoomId: number;
    title: string;
    sellerName: string;
    currentMembers: number;
    maxMembers: number;
    lastMessage: string;
    unreadCount: number;
    lastMessageTime: string;
    status: "progress" | "done";
    myRole: "SELLER" | "BUYER";
    type: "GROUP" | "DIRECT";
    };

    export type ChatMessage = {
    messageId: number;
    senderId: number;
    senderNickname: string;
    content: string;
    messageType: "TEXT" | "IMAGE";
    createdAt: string;
    };

    export type ChatMenu = {
    chatRoomId: number;
    title: string;
    postStatus: string;
    myRole: "SELLER" | "BUYER";
    participants: {
        userId: number;
        nickname: string;
        memberName: string;
        role: "SELLER" | "BUYER";
    }[];
    };

    export async function getChatRooms(userId: number) {
    return apiRequest<ChatRoom[]>(`/api/chat-rooms?userId=${userId}`);
    }

    export async function getChatMessages(chatRoomId: number) {
    return apiRequest<ChatMessage[]>(`/api/chat-rooms/${chatRoomId}/messages`);
    }

    export async function getChatMenu(chatRoomId: number, userId: number) {
    return apiRequest<ChatMenu>(
        `/api/chat-rooms/${chatRoomId}/menu?userId=${userId}`
    );
    }

    export async function leaveChatRoom(chatRoomId: number, userId: number) {
    return apiRequest<void>(`/api/chat-rooms/${chatRoomId}/leave?userId=${userId}`, {
        method: "DELETE",
    });
    }