import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { API_BASE_URL } from "../utils/api";

export type ChatSocketMessage = {
  messageId?: number;
  senderId: number | null;
  senderNickname?: string;
  content: string;
  messageType:
    | "TEXT"
    | "IMAGE"
    | "TRANSACTION_COMPLETE"
    | "TRACKING_SHARED"
    | "FRAUD_WARNING"
    | "FRAUD_DANGER"
    | string;
  createdAt?: string;
  reason?: string;
};

type ConnectChatSocketParams = {
  chatRoomId: number | string;
  onMessage: (message: ChatSocketMessage) => void;
  onConnect?: () => void;
  onError?: (error: unknown) => void;
};

function getWebSocketUrl() {
  return API_BASE_URL.replace(/^http/, "ws") + "/ws";
}

export function connectChatSocket({
  chatRoomId,
  onMessage,
  onConnect,
  onError,
}: ConnectChatSocketParams) {
  let subscription: StompSubscription | null = null;

  const client = new Client({
    brokerURL: getWebSocketUrl(),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (message) => {
      console.log("[STOMP]", message);
    },
    onConnect: () => {
      subscription = client.subscribe(
        `/sub/chat/rooms/${chatRoomId}`,
        (frame: IMessage) => {
          try {
            const body = JSON.parse(frame.body);
            onMessage(body);
          } catch (error) {
            console.log("채팅 메시지 파싱 실패:", error, frame.body);
          }
        }
      );

      onConnect?.();
    },
    onStompError: (frame) => {
      console.log("STOMP 오류:", frame.headers, frame.body);
      onError?.(frame);
    },
    onWebSocketError: (error) => {
      console.log("WebSocket 오류:", error);
      onError?.(error);
    },
  });

  client.activate();

  return {
    sendTextMessage: (payload: {
      chatRoomId: number | string;
      senderId: number | string;
      content: string;
    }) => {
      if (!client.connected) {
        throw new Error("채팅 서버에 아직 연결되지 않았어요.");
      }

      client.publish({
        destination: "/pub/chat/message",
        body: JSON.stringify({
          chatRoomId: Number(payload.chatRoomId),
          senderId: Number(payload.senderId),
          content: payload.content,
          messageType: "TEXT",
        }),
      });
    },

    disconnect: () => {
      subscription?.unsubscribe();
      subscription = null;
      client.deactivate();
    },
  };
}