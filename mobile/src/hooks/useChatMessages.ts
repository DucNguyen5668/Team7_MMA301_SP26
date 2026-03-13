import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IP_ADDRESS } from "../constants/ip";
import { Message, MessageBackend, User } from "../types/message";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import { formatMessageTimestamp } from "../utils";
import messageService from "../services/messageService";

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
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ─── Socket ──────────────────────────────────────────────────────────────
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

      socket.on("newMessage", (msg: any) => {
        const newMsg = toMessage(msg, currentUserId);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });

        const senderId =
          typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
        if (senderId !== currentUserId) {
          socket.emit("joinConversation", conversationId);
        }
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
      socket?.emit("leaveConversation", conversationId);
      socket?.disconnect();
    };
  }, [conversationId, currentUserId]);

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socketRef.current) return;
      socketRef.current.emit("deleteMessage", {
        messageId,
        conversationId,
      });
    },
    [conversationId],
  );

  // ─── Fetch initial ────────────────────────────────────────────────────────
  const fetchInitialMessages = useCallback(async () => {
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

  // ─── Load more (cursor-based) ─────────────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    // Lấy id của tin nhắn cũ nhất hiện tại (cuối mảng vì inverted)
    const oldestMessage = messages[messages.length - 1];
    if (!oldestMessage) return;

    try {
      setLoadingMore(true);
      setError(null);

      const data = await messageService.getMessages(
        conversationId,
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

  // ─── Send ─────────────────────────────────────────────────────────────────
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

  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_VIDEO_SIZE_MB = 10;

  const sendMediaMessage = useCallback(
    async (
      assets: (ImagePicker.ImagePickerAsset & { thumbnail?: string })[],
      type: "image" | "video",
      content: string = "",
    ) => {
      if (!socketRef.current) return;

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

          // Encode thumbnail nếu là video
          let thumbnailDataUri: string | undefined;
          if (type === "video" && asset.thumbnail) {
            const thumbFile = new FileSystem.File(asset.thumbnail);
            const thumbBase64 = await thumbFile.base64();
            thumbnailDataUri = `data:image/jpeg;base64,${thumbBase64}`;
          }

          socketRef.current.emit("sendMessage", {
            conversationId,
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
    [conversationId],
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
    sendMediaMessage,
    deleteMessage,
    loadMoreMessages,
    refreshMessages: fetchInitialMessages,
  };
};

export default useChatMessages;
