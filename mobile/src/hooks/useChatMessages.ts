import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = "http://10.0.2.2:5000"; // Update with your backend URL

// Type definitions for Conversation and Message

interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

// Backend message structure
export interface MessageBackend {
  _id: string;
  conversation: string;
  sender: string | User;
  content: string;
  type: "text" | "image" | "location" | "video" | "product";
  createdAt: Date;
  updatedAt: Date;
}

// Frontend message structure (used in chat UI)
export interface Message {
  id: string | number;
  sender: "me" | "opponent";
  type: "text" | "image" | "location" | "video" | "product";
  content: string | { lat: number; lng: number; address: string };
  timestamp: string;
  createdAt?: Date;
}

// Backend conversation structure
export interface ConversationBackend {
  _id: string;
  participants: User[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: MessageBackend;
  unreadCount?: number;
}

// Frontend conversation structure (used in UI)
export interface Conversation {
  id: number | string;
  opponentName: string;
  opponentAvatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

// Create conversation request
export interface CreateConversationRequest {
  userId: string;
}

// Create conversation response
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
}

export const useChatMessages = ({
  conversationId,
  currentUserId,
}: UseChatMessagesOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Transform backend message to frontend format
  const transformMessage = useCallback(
    (msg: any): Message => {
      const isMe =
        msg.sender === currentUserId || msg.sender?._id === currentUserId;

      return {
        id: msg._id,
        sender: isMe ? "me" : "opponent",
        type: msg.type || "text",
        content: msg.content,
        timestamp: formatTimestamp(msg.createdAt),
        createdAt: new Date(msg.createdAt),
      };
    },
    [currentUserId],
  );

  // Format timestamp
  const formatTimestamp = (date: string | Date): string => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;

    // If same day, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Otherwise show date and time
    return messageDate.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSocket = async () => {
    const token = await AsyncStorage.getItem("token");

    const socket = io(SOCKET_URL, {
      auth: { token: token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // sau khi connect socket thì join vào conversation
    socket.on("connect", () => {
      socket.emit("joinConversation", conversationId);
    });

    socket.on("connect_error", (err) => {
      console.error("connect_error:", err);
    });

    socket.on("disconnect", () => {});

    socket.on("error", (socketError) => {
      setError(socketError.msg || "Socket connection error");
    });

    socket.on("newMessage", (newMessage) => {
      setMessages((prev) => [...prev, transformMessage(newMessage)]);
    });

    return () => {
      socket.emit("leaveConversation", conversationId);
      socket.disconnect();
    };
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    handleSocket();
  }, [conversationId, transformMessage]);

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
          params: {
            page: pageNum,
            limit: 20,
          },
        });

        const { messages: fetchedMessages, totalPages } = response.data;

        const transformedMessages = fetchedMessages.map(transformMessage);

        if (pageNum === 1) {
          setMessages(transformedMessages);
        } else {
          setMessages((prev) => [...transformedMessages, ...prev]);
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

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchMessages(page + 1);
    }
  }, [hasMore, loadingMore, page, fetchMessages]);

  const sendMessage = useCallback(
    (content: string, type: string = "text") => {
      if (!content.trim() || !socketRef.current) return;
      setSending(true);

      const messageData = {
        conversationId,
        content: content.trim(),
        type,
      };

      socketRef.current.emit("sendMessage", messageData);

      setSending(false);
    },
    [conversationId],
  );

  // Send image message
  const sendImageMessage = useCallback(
    (imageUrl: string) => {
      sendMessage(imageUrl, "image");
    },
    [sendMessage],
  );

  // Send location message
  const sendLocationMessage = useCallback(
    (location: { lat: number; lng: number; address: string }) => {
      sendMessage(JSON.stringify(location), "location");
    },
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
