import React, { useState, useRef, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useChatMessages } from "../../hooks/useChatMessages";
import { Conversation, Message } from "../../types/message";
import { AuthContext } from "../../context/authContext";
import { requestPermission } from "../../utils";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInputBar from "./ChatInputBar";
import AttachMenu from "./AttachMenu";
import ImagePreviewModal from "./ImagePreviewModal";

interface ChatRoomScreenProps {
  conversation: Conversation;
  onBack: () => void;
  onViewProfile: () => void;
}

export default function ChatRoomScreen({
  conversation,
  onBack,
  onViewProfile,
}: ChatRoomScreenProps) {
  const { user } = useContext(AuthContext);
  const [messageInput, setMessageInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const flatListRef = useRef<FlatList>(null);

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
  } = useChatMessages({
    conversationId: conversation.id.toString(),
    currentUserId: user.id,
  });

  const handlePickImage = async () => {
    setShowAttachMenu(false);
    if (!(await requestPermission("mediaLibrary"))) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: false,
      quality: 0.8,
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
      await sendMediaMessage(result.assets, "video");
    }
  };

  const handleSendMessage = async () => {
    const hasText = messageInput.trim().length > 0;
    const hasImage = !!pendingImage;

    if (!hasText && !hasImage) return;

    if (hasImage) {
      await sendMediaMessage([pendingImage!], "image");
      setPendingImage(null);
    }

    if (hasText) {
      sendMessage(messageInput.trim());
      setMessageInput("");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FDD835" />
        <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={30}
    >
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onViewProfile={onViewProfile}
      />

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }: { item: Message }) => (
          <MessageBubble
            item={item}
            onImagePress={setImagePreview}
            onVideoPress={() => {}}
            isFirstMessage={item.id === messages[0].id}
          />
        )}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
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
              Gửi tin nhắn đầu tiên để bắt đầu trò chuyện
            </Text>
          </View>
        }
      />

      <ChatInputBar
        value={messageInput}
        onChangeText={setMessageInput}
        onSend={handleSendMessage}
        onAttach={() => setShowAttachMenu(true)}
        sending={sending}
        pendingImage={pendingImage}
        onRemovePendingImage={() => setPendingImage(null)}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
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
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#FF5722",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
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
  },
});