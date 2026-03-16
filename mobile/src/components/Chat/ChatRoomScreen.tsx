import React, { useState, useRef, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useChatMessages } from "../../hooks/useChatMessages";
import { Conversation, Message } from "../../types/message";
import { AuthContext } from "../../context/authContext";
import { generateVideoThumbnail, requestPermission } from "../../utils";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInputBar from "./ChatInputBar";
import AttachMenu from "./AttachMenu";
import ImagePreviewModal from "./ImagePreviewModal";
import VideoModal from "./VideoModal";
import { UserResult } from "./SearchUserModal";

interface ChatRoomScreenProps {
  // Một trong hai phải có:
  conversation: Conversation | null; // chat đã tồn tại
  tempUser?: UserResult | null; // chat chưa tạo conversation
  onConversationCreated?: (conv: Conversation) => void; // callback sau khi tạo conv
  onBack: () => void;
  onViewProfile: () => void;
}

export default function ChatRoomScreen({
  conversation,
  tempUser,
  onConversationCreated,
  onBack,
  onViewProfile,
}: ChatRoomScreenProps) {
  const { user } = useContext(AuthContext);
  const [messageInput, setMessageInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [showVideo, setShowVideo] = useState(false);
  const [videoMessageId, setVideoMessageId] = useState<string | null>(null);

  const [pendingImage, setPendingImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pendingVideo, setPendingVideo] = useState<
    (ImagePicker.ImagePickerAsset & { thumbnail?: string }) | null
  >(null);

  const {
    messages,
    loading,
    sending,
    loadingMore,
    hasMore,
    error,
    sendMessage,
    sendMediaMessage,
    loadMoreMessages,
    deleteMessage,
  } = useChatMessages({
    conversationId: conversation?.id?.toString() ?? null,
    targetUserId: tempUser?._id ?? null,
    currentUserId: user._id,
    onConversationCreated,
  });

  // Header info: dùng conversation nếu có, fallback sang tempUser
  const headerName = conversation?.opponentName ?? tempUser?.fullName ?? "";

  const headerAvatar =
    conversation?.opponentAvatar ??
    (tempUser
      ? tempUser.avatar ||
        `https://cdn-icons-png.flaticon.com/128/847/847969.png`
      : "");

  const handlePickImage = async () => {
    setShowAttachMenu(false);
    if (!(await requestPermission("mediaLibrary"))) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: false,
      quality: 0.75,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPendingImage(result.assets[0]);
    }
  };

  const handlePickVideo = async () => {
    setShowAttachMenu(false);
    if (!(await requestPermission("mediaLibrary"))) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsMultipleSelection: false,
      videoMaxDuration: 60,
      quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.duration! > 60000) {
        Alert.alert("Video phải ngắn hơn 60 giây!");
        return;
      }
      const thumbnail = await generateVideoThumbnail(asset.uri);
      setPendingVideo({ ...asset, thumbnail: thumbnail ?? undefined });
    }
  };

  const handleSendMessage = async () => {
    const hasText = messageInput.trim().length > 0;
    const hasImage = pendingImage;
    const hasVideo = pendingVideo;

    if (!hasText && !hasImage && !hasVideo) return;

    if (hasVideo) {
      await sendMediaMessage([pendingVideo], "video", messageInput.trim());
      setMessageInput("");
      setPendingVideo(null);
      return;
    }

    if (hasImage) {
      await sendMediaMessage([pendingImage], "image", messageInput.trim());
      setMessageInput("");
      setPendingImage(null);
      return;
    }

    if (hasText) {
      sendMessage(messageInput.trim());
      setMessageInput("");
    }
  };

  const fallBackConversation: Conversation = {
    id: "",
    opponentId: tempUser?._id ?? "",
    opponentName: headerName,
    opponentAvatar: headerAvatar,
    lastMessage: "",
    lastMessageTime: new Date(),
    timestamp: "",
    unread: 0,
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header dùng dữ liệu từ conversation hoặc tempUser */}
      <ChatHeader
        conversation={conversation ?? fallBackConversation}
        onBack={onBack}
        onViewProfile={onViewProfile}
      />

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FDD835" />
          <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={({ item }: { item: Message }) => (
            <MessageBubble
              item={item}
              onImagePress={setImagePreview}
              onVideoPress={(messageId) => {
                setShowVideo(true);
                setVideoMessageId(messageId);
              }}
              onDelete={deleteMessage}
              isFirstMessage={item.id === messages[0]?.id}
            />
          )}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#FDD835" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ddd" />
              <Text style={styles.emptyMessagesText}>Chưa có tin nhắn nào</Text>
              <Text style={styles.emptyMessagesSubtext}>
                {tempUser
                  ? `Gửi tin nhắn để bắt đầu trò chuyện với ${tempUser.fullName}`
                  : "Gửi tin nhắn đầu tiên để bắt đầu trò chuyện"}
              </Text>
            </View>
          }
        />
      )}

      <ChatInputBar
        value={messageInput}
        onChangeText={setMessageInput}
        onSend={handleSendMessage}
        onAttach={() => setShowAttachMenu(true)}
        sending={sending}
        pendingImage={pendingImage}
        onRemovePendingImage={() => setPendingImage(null)}
        pendingVideo={pendingVideo}
        onRemovePendingVideo={() => setPendingVideo(null)}
      />

      <AttachMenu
        visible={showAttachMenu}
        onClose={() => setShowAttachMenu(false)}
        onPickImage={handlePickImage}
        onPickVideo={handlePickVideo}
      />

      <ImagePreviewModal
        imageUri={imagePreview}
        onClose={() => setImagePreview(null)}
      />

      <VideoModal
        messageId={videoMessageId}
        visible={showVideo}
        onClose={() => {
          setShowVideo(false);
          setVideoMessageId(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE0B2",
  },
  errorText: { flex: 1, fontSize: 13, color: "#FF5722" },
  messagesList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  loadMoreContainer: { paddingVertical: 16, alignItems: "center" },
  emptyMessages: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
