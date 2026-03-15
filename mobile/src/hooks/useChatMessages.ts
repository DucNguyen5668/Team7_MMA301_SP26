import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IP_ADDRESS } from "../constants/ip";
import { Message, MessageBackend, User, Conversation } from "../types/message";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { formatMessageTimestamp, formatChatTimestamp } from "../utils";
import messageService from "../services/messageService";
import { API } from "../services/api";

const SOCKET_URL = `http://${IP_ADDRESS}:5000`;

function toMessage(msg: MessageBackend, currentUserId: string): Message {
  const isMe =
    msg.sender === currentUserId || (msg.sender as User)?._id === currentUserId;

  const isRead = Array.isArray(msg.readBy)
    ? msg.readBy.includes(currentUserId)
    : false;

  let content = msg.content ?? "";
  let attachment = undefined;

  if (msg.attachment) {
    attachment = {
      data: msg.attachment.data,
      type: msg.attachment.type,
      thumbnail: msg.attachment.thumbnail,
    };
  }

  return {
    id: msg._id,
    sender: isMe ? "me" : "opponent",
    type: msg.type,
    content,
    attachment,
    timestamp: formatMessageTimestamp(msg.createdAt),
    createdAt: new Date(msg.createdAt),
    isRead,
  };
}

interface UseChatMessagesOptions {
  // null = temp mode (chưa có conversation)
  conversationId: string | null;
  // targetUserId dùng khi conversationId = null để tạo conversation khi gửi tin đầu tiên
  targetUserId?: string | null;
  currentUserId: string;
  onMessagesRead?: (data: { conversationId: string; readBy: string }) => void;
  onConversationCreated?: (conversation: Conversation) => void;
}

export const useChatMessages = ({
  conversationId,
  targetUserId,
  currentUserId,
  onMessagesRead,
  onConversationCreated,
}: UseChatMessagesOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(conversationId !== null); // temp mode không cần load
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Lưu conversationId hiện tại (có thể thay đổi sau khi tạo conversation)
  const activeConvIdRef = useRef<string | null>(conversationId);

  // ─── Socket setup ─────────────────────────────────────────────────────────
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

      // Chỉ join khi có conversationId
      socket.on("connect", () => {
        if (activeConvIdRef.current) {
          socket.emit("joinConversation", activeConvIdRef.current);
        }
      });

      socket.on("connect_error", (err) => console.error("Socket error:", err));
      socket.on("error", (e: any) =>
        setError(e.msg || "Socket connection error"),
      );

      socket.on("newMessage", (msg: any) => {
        const newMsg = toMessage(msg, currentUserId);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });
      });

      socket.on("messageDeleted", ({ messageId }: { messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
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
      if (activeConvIdRef.current) {
        socket?.emit("leaveConversation", activeConvIdRef.current);
      }
      socket?.disconnect();
    };
  }, [currentUserId]);

  // Join khi conversationId thay đổi (ví dụ: vừa tạo conversation mới)
  useEffect(() => {
    activeConvIdRef.current = conversationId;
    if (conversationId && socketRef.current?.connected) {
      socketRef.current.emit("joinConversation", conversationId);
    }
  }, [conversationId]);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteMessage = useCallback((messageId: string) => {
    if (!socketRef.current || !activeConvIdRef.current) return;
    socketRef.current.emit("deleteMessage", {
      messageId,
      conversationId: activeConvIdRef.current,
    });
  }, []);

  // ─── Fetch initial (chỉ khi có conversationId) ────────────────────────────
  const fetchInitialMessages = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);

      const data = await messageService.getMessages(conversationId, 1, 20);

      const transformed: Message[] = data.messages.map((m: MessageBackend) =>
        toMessage(m, currentUserId),
      );

      setMessages(transformed);
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  // ─── Load more ────────────────────────────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !activeConvIdRef.current) return;

    const oldestMessage = messages[messages.length - 1];
    if (!oldestMessage) return;

    try {
      setLoadingMore(true);
      setError(null);
      const data = await messageService.getMessages(
        activeConvIdRef.current,
        1,
        20,
        oldestMessage.id,
      );
      const transformed: Message[] = data.messages.map((m: any) =>
        toMessage(m, currentUserId),
      );
      setMessages((prev) => [...prev, ...transformed]);
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, currentUserId, hasMore, loadingMore, messages]);

  // ─── Ensure conversation exists (tạo nếu cần) ────────────────────────────
  /**
   * Nếu chưa có conversationId nhưng có targetUserId:
   * - Gọi API tạo conversation
   * - Join socket room mới
   * - Notify ChatScreen qua onConversationCreated
   * - Trả về conversationId mới
   */
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (activeConvIdRef.current) return activeConvIdRef.current;
    if (!targetUserId) return null;

    try {
      const { data } = await API.post("/conversations", {
        userId: targetUserId,
      });

      const newConvId = data._id;
      activeConvIdRef.current = newConvId;

      // Join socket room
      socketRef.current?.emit("joinConversation", newConvId);

      // Notify parent để cập nhật state conversation
      if (onConversationCreated) {
        const conv: Conversation = {
          id: newConvId,
          opponentId: targetUserId,
          opponentName:
            data.participants?.find((p: User) => p._id !== currentUserId)
              ?.fullName ?? "",
          opponentAvatar:
            data.participants?.find((p: User) => p._id !== currentUserId)
              ?.avatar ?? "",
          lastMessage: "",
          lastMessageTime: new Date(data.updatedAt ?? Date.now()),
          timestamp: formatChatTimestamp(data.updatedAt ?? new Date()),
          unread: 0,
        };
        onConversationCreated(conv);
      }

      return newConvId;
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tạo cuộc trò chuyện");
      return null;
    }
  }, [targetUserId, currentUserId, onConversationCreated]);

  // ─── Send text ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, type = "text") => {
      if (!content.trim() || !socketRef.current) return;

      const convId = await ensureConversation();
      if (!convId) return;

      setSending(true);
      socketRef.current.emit("sendMessage", {
        conversationId: convId,
        content: content.trim(),
        type,
      });
      setSending(false);
    },
    [ensureConversation],
  );

  // ─── Send media ───────────────────────────────────────────────────────────
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_VIDEO_SIZE_MB = 10;

  const sendMediaMessage = useCallback(
    async (
      assets: (ImagePicker.ImagePickerAsset & { thumbnail?: string })[],
      type: "image" | "video",
      content: string = "",
    ) => {
      if (!socketRef.current) return;

      const convId = await ensureConversation();
      if (!convId) return;

      const maxBytes =
        (type === "image" ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB) *
        1024 *
        1024;

      for (const asset of assets) {
        if (asset.fileSize && asset.fileSize > maxBytes) {
          setError(
            `File vượt quá ${type === "image" ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB}MB`,
          );
          continue;
        }

        try {
          setSending(true);
          setError(null);

          const file = new FileSystem.File(asset.uri);
          const base64 = await file.base64();
          const ext =
            asset.uri.split(".").pop() ?? (type === "image" ? "jpg" : "mp4");
          const mimeType = type === "image" ? `image/${ext}` : `video/${ext}`;
          const dataUri = `data:${mimeType};base64,${base64}`;

          let thumbnailDataUri: string | undefined;
          if (type === "video" && asset.thumbnail) {
            const thumbFile = new FileSystem.File(asset.thumbnail);
            const thumbBase64 = await thumbFile.base64();
            thumbnailDataUri = `data:image/jpeg;base64,${thumbBase64}`;
          }

          socketRef.current.emit("sendMessage", {
            conversationId: convId,
            type,
            content,
            attachment: {
              data: dataUri,
              type,
              thumbnail: thumbnailDataUri,
            },
          });
        } catch (err: any) {
          setError("Không thể đọc file");
        } finally {
          setSending(false);
        }
      }
    },
    [ensureConversation],
  );

  return {
    messages,
    loading,
    sending,
    loadingMore,
    hasMore,
    error,
    sendMessage,
    sendMediaMessage,
    deleteMessage,
    loadMoreMessages,
    refreshMessages: fetchInitialMessages,
  };
};

export default useChatMessages;
