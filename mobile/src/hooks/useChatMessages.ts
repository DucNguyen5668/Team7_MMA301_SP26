import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IP_ADDRESS } from "../constants/ip";

const SOCKET_URL = `http://${IP_ADDRESS}:5000`; // Update with your backend URL

interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface MessageBackend {
  _id: string;
  conversation: string;
  sender: string | User;
  content: string;
  type: "text" | "image" | "location" | "video" | "product";
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string | number;
  sender: "me" | "opponent";
  type: "text" | "image" | "location" | "video" | "product";
  content: string | { lat: number; lng: number; address: string };
  timestamp: string;
  createdAt?: Date;
  isRead?: boolean; // whether the opponent has read this message
}

export interface ConversationBackend {
  _id: string;
  participants: User[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: MessageBackend;
  unreadCount?: number;
}

export interface Conversation {
  id: number | string;
  opponentId: string;
  opponentName: string;
  opponentAvatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export interface CreateConversationRequest {
  userId: string;
}

export interface CreateConversationResponse {
  _id: string;
  participants: User[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: MessageBackend;
}

interface UseChatMessagesOptions {
  conversationId: string;
  currentUserId: string;
  // Optional: called when the other participant reads our messages (for "seen" UI)
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

  // ─── Transform backend → frontend message ───────────────────────────────────
  const transformMessage = useCallback(
    (msg: any): Message => {
      const isMe =
        msg.sender === currentUserId || msg.sender?._id === currentUserId;

      // A message is "read" if someone other than the sender is in readBy
      const isRead = Array.isArray(msg.readBy)
        ? msg.readBy.some(
            (id: string) => id !== currentUserId && id !== msg.sender,
          )
        : false;

      return {
        id: msg._id,
        sender: isMe ? "me" : "opponent",
        type: msg.type || "text",
        content: msg.content,
        timestamp: formatTimestamp(msg.createdAt),
        createdAt: new Date(msg.createdAt),
        isRead,
      };
    },
    [currentUserId],
  );

  // ─── Format timestamp ────────────────────────────────────────────────────────
  const formatTimestamp = (date: string | Date): string => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;

    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── Socket setup ────────────────────────────────────────────────────────────
  const handleSocket = async () => {
    const token = await AsyncStorage.getItem("token");

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Join this conversation's room — server will also mark messages as read
      socket.emit("joinConversation", conversationId);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("error", (socketError) => {
      setError(socketError.msg || "Socket connection error");
    });

    // ── New message arrives ──────────────────────────────────────────────────
    socket.on("newMessage", (newMessage) => {
      setMessages((prev) => [...prev, transformMessage(newMessage)]);

      // If it's from the opponent, mark it as read immediately since we're
      // in the chat room (server already did the DB update via joinConversation,
      // but new messages that arrive while we're open need a fresh mark)
      const senderId =
        typeof newMessage.sender === "string"
          ? newMessage.sender
          : newMessage.sender?._id;

      if (senderId !== currentUserId) {
        socket.emit("joinConversation", conversationId); // re-triggers markAsRead on server
      }
    });

    // ── Server confirmed our unread messages were marked as read ─────────────
    socket.on(
      "markedAsRead",
      ({ conversationId: convId }: { conversationId: string }) => {
        // Nothing needed in the chat UI itself — the server already updated DB.
        // The inbox will reflect 0 unread on next fetch or via unreadUpdate event.
        console.log("markedAsRead for conv:", convId);
      },
    );

    // ── The OTHER person read our messages (show "seen" tick) ────────────────
    socket.on(
      "messagesRead",
      (data: { conversationId: string; readBy: string }) => {
        // Mark all our sent messages as read in local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === "me" ? { ...msg, isRead: true } : msg,
          ),
        );
        // Bubble up to parent if needed
        onMessagesRead?.(data);
      },
    );

    return () => {
      socket.emit("leaveConversation", conversationId);
      socket.disconnect();
    };
  };

  useEffect(() => {
    const cleanup = handleSocket();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [conversationId, transformMessage]);

  // ─── Fetch messages (REST, paginated) ───────────────────────────────────────
  const fetchMessages = useCallback(
    async (pageNum: number) => {
      try {
        setError(null);
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await API.get(`/messages/${conversationId}/messages`, {
          params: { page: pageNum, limit: 20 },
        });

        const { messages: fetchedMessages, totalPages } = response.data;
        const transformed = fetchedMessages.map(transformMessage);

        if (pageNum === 1) {
          setMessages(transformed);
        } else {
          setMessages((prev) => [...transformed, ...prev]);
        }

        setHasMore(pageNum < totalPages);
        setPage(pageNum);
      } catch (err: any) {
        console.error("Error fetching messages:", err);
        setError(err.response?.data?.message || "Failed to load messages");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [conversationId, transformMessage],
  );

  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  // ─── Load older messages ─────────────────────────────────────────────────────
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchMessages(page + 1);
    }
  }, [hasMore, loadingMore, page, fetchMessages]);

  // ─── Send message via socket ─────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string, type: string = "text") => {
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
    (imageUrl: string) => sendMessage(imageUrl, "image"),
    [sendMessage],
  );

  const sendLocationMessage = useCallback(
    (location: { lat: number; lng: number; address: string }) =>
      sendMessage(JSON.stringify(location), "location"),
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
