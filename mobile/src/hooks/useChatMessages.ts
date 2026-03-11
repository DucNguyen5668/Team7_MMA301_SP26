import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IP_ADDRESS } from "../constants/ip";
import { Message } from "../types/message";
import { formatMessageTimestamp } from "../utils";

const SOCKET_URL = `http://${IP_ADDRESS}:5000`;

/** Maps a raw backend message to the FE Message shape. */
function toMessage(msg: any, currentUserId: string): Message {
  const isMe =
    msg.sender === currentUserId || msg.sender?._id === currentUserId;
  const senderId =
    typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
  const isRead = Array.isArray(msg.readBy)
    ? msg.readBy.some((id: string) => id !== senderId)
    : false;

  return {
    id: msg._id,
    sender: isMe ? "me" : "opponent",
    type: msg.type || "text",
    content: msg.content,
    timestamp: formatMessageTimestamp(msg.createdAt),
    createdAt: new Date(msg.createdAt),
    isRead,
  };
}

interface UseChatMessagesOptions {
  conversationId: string;
  currentUserId: string;
  onMessagesRead?: (data: { conversationId: string; readBy: string }) => void;
}

export const useChatMessages = ({
  conversationId,
  currentUserId,
  onMessagesRead,
}: UseChatMessagesOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  console.log("messages", messages);

  // ─── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let socket: Socket;

    (async () => {
      const token = await AsyncStorage.getItem("token");
      socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on("connect", () =>
        socket.emit("joinConversation", conversationId),
      );
      socket.on("connect_error", (err) => console.error("Socket error:", err));
      socket.on("error", (e: any) =>
        setError(e.msg || "Socket connection error"),
      );

      console.log('messages', messages)

      socket.on("newMessage", (msg: any) => {
        setMessages((prev) => [toMessage(msg, currentUserId), ...prev]); 

        const senderId =
          typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
        if (senderId !== currentUserId) {
          socket.emit("joinConversation", conversationId);
        }
      });

      socket.on(
        "messagesRead",
        (data: { conversationId: string; readBy: string }) => {
          setMessages((prev) =>
            prev.map((m) => (m.sender === "me" ? { ...m, isRead: true } : m)),
          );
          onMessagesRead?.(data);
        },
      );
    })();

    return () => {
      socket?.emit("leaveConversation", conversationId);
      socket?.disconnect();
    };
  }, [conversationId, currentUserId]);

  // ─── Fetch messages (paginated) ────────────────────────────────────────────
  const fetchMessages = useCallback(
    async (pageNum: number) => {
      try {
        setError(null);
        pageNum === 1 ? setLoading(true) : setLoadingMore(true);

        const { data } = await API.get(`/messages/${conversationId}/messages`, {
          params: { page: pageNum, limit: 10 },
        });

        const transformed: Message[] = data.messages.map((m: Message) =>
          toMessage(m, currentUserId),
        );

        setMessages((prev) =>
          pageNum === 1 ? transformed : [...prev, ...transformed],
        );
        setHasMore(data.hasMore);
        setPage(pageNum);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load messages");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [conversationId, currentUserId],
  );
  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingMore) fetchMessages(page + 1);
  }, [hasMore, loadingMore, page, fetchMessages]);

  // ─── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string, type = "text") => {
      if (!content.trim() || !socketRef.current) return;
      setSending(true);
      socketRef.current.emit("sendMessage", {
        conversationId,
        content: content.trim(),
        type,
      });
      setSending(false);
    },
    [conversationId],
  );

  const sendImageMessage = useCallback(
    (uri: string) => sendMessage(uri, "image"),
    [sendMessage],
  );

  const sendLocationMessage = useCallback(
    (loc: { lat: number; lng: number; address: string }) =>
      sendMessage(JSON.stringify(loc), "location"),
    [sendMessage],
  );

  return {
    messages,
    loading,
    sending,
    loadingMore,
    hasMore,
    error,
    sendMessage,
    sendImageMessage,
    sendLocationMessage,
    loadMoreMessages,
    refreshMessages: () => fetchMessages(1),
  };
};

export default useChatMessages;
