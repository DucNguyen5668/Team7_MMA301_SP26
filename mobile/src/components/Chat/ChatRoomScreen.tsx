import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  Conversation,
  Message,
  useChatMessages,
} from "../../hooks/useChatMessages";
import { AuthContext } from "../../context/authContext";
import { requestPermission } from "../../utils/permissions";

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
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    loading,
    sending,
    loadingMore,
    hasMore,
    error,
    sendMessage,
    sendImageMessage,
    loadMoreMessages,
  } = useChatMessages({
    conversationId: conversation.id.toString(),
    currentUserId: user.id,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Pick image from gallery
  const handlePickImage = async () => {
    setShowAttachMenu(false);
    const hasPermission = await requestPermission("mediaLibrary");
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      // TODO: Upload image to your server/CDN and get URL back,
      sendImageMessage(uri);
    }
  };

  // Pick video from gallery
  const handlePickVideo = async () => {
    setShowAttachMenu(false);
    const hasPermission = await requestPermission("mediaLibrary");
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      // TODO: Upload video to your server/CDN and get URL back,
      // then call sendMessage(uploadedUrl, "video")
      sendMessage(uri, "video");
    }
  };

  // Take photo with camera
  const handleOpenCamera = async () => {
    setShowAttachMenu(false);
    const hasPermission = await requestPermission("camera");
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      sendImageMessage(uri);
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput("");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === "me";

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.messageContainerMe : styles.messageContainerOpponent,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOpponent,
          ]}
        >
          {item.type === "text" && (
            <Text style={styles.messageText}>{item.content as string}</Text>
          )}

          {item.type === "image" && (
            <TouchableOpacity
              onPress={() => setImagePreview(item.content as string)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.content as string }}
                style={styles.messageImage}
              />
            </TouchableOpacity>
          )}

          {item.type === "video" && (
            <TouchableOpacity
              style={styles.videoContainer}
              onPress={() => setVideoPreview(item.content as string)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.content as string }}
                style={styles.messageImage}
                blurRadius={2}
              />
              <View style={styles.videoPlayButton}>
                <Ionicons name="play-circle" size={44} color="#fff" />
              </View>
              <Text style={styles.videoLabel}>Video</Text>
            </TouchableOpacity>
          )}

          {item.type === "location" && (
            <View style={styles.locationContainer}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={16} color="#FF5722" />
                <Text style={styles.locationLabel}>Vị trí</Text>
              </View>
              <View style={styles.locationMap}>
                <Ionicons name="map" size={32} color="#999" />
              </View>
              <Text style={styles.locationAddress}>
                {(item.content as any).address}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
      </View>
    );
  };

  // Attach menu modal
  const AttachMenu = () => (
    <Modal
      visible={showAttachMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAttachMenu(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowAttachMenu(false)}
      >
        <View style={styles.attachMenu}>
          <TouchableOpacity
            style={styles.attachMenuItem}
            onPress={handlePickImage}
          >
            <View
              style={[styles.attachIconCircle, { backgroundColor: "#E8F5E9" }]}
            >
              <Ionicons name="image" size={22} color="#43A047" />
            </View>
            <Text style={styles.attachMenuText}>Ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachMenuItem}
            onPress={handlePickVideo}
          >
            <View
              style={[styles.attachIconCircle, { backgroundColor: "#E3F2FD" }]}
            >
              <Ionicons name="videocam" size={22} color="#1E88E5" />
            </View>
            <Text style={styles.attachMenuText}>Video</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  // Image preview modal
  const ImagePreviewModal = () => (
    <Modal
      visible={!!imagePreview}
      transparent
      animationType="fade"
      onRequestClose={() => setImagePreview(null)}
    >
      <Pressable
        style={styles.imagePreviewOverlay}
        onPress={() => setImagePreview(null)}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setImagePreview(null)}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        {imagePreview && (
          <Image
            source={{ uri: imagePreview }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}
      </Pressable>
    </Modal>
  );

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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#222" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUserInfo}
          onPress={onViewProfile}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: conversation.opponentAvatar }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{conversation.opponentName}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.5}
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

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.inputIconButton}
            onPress={() => setShowAttachMenu(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#999"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageInput.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageInput.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#222" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={messageInput.trim() ? "#222" : "#999"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <AttachMenu />
      <ImagePreviewModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  attachIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#f0f0f0",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  headerRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerRatingCount: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  moreButton: {
    padding: 8,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    borderBottomWidth: 2,
    borderBottomColor: "#FDD835",
  },
  productCardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
    marginRight: 12,
  },
  productCardInfo: {
    flex: 1,
  },
  productCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  productCardPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5722",
  },
  productCardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FDD835",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  productCardButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
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
  messageContainer: {
    marginBottom: 12,
  },
  messageContainerMe: {
    alignItems: "flex-end",
  },
  messageContainerOpponent: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleMe: {
    backgroundColor: "#FDD835",
    borderBottomRightRadius: 4,
  },
  messageBubbleOpponent: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#222",
    lineHeight: 20,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  videoContainer: {
    position: "relative",
    width: 220,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  videoPlayButton: {
    justifyContent: "center",
    ...StyleSheet.absoluteFillObject,

    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  videoLabel: {
    position: "absolute",
    bottom: 6,
    left: 8,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  locationContainer: {
    width: 200,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  locationMap: {
    height: 120,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 13,
    color: "#666",
  },
  messageTimestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickActions: {
    marginBottom: 8,
  },
  quickActionsContent: {
    gap: 8,
  },
  quickActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  quickActionText: {
    fontSize: 13,
    color: "#666",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputIconButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textInput: {
    fontSize: 15,
    color: "#222",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FDD835",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  attachMenu: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 8,
    marginBottom: 0,
  },
  attachMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 8,
  },
  attachMenuText: {
    fontSize: 14,
    color: "#222",
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  previewImage: {
    width: "90%",
    height: "80%",
  },
});
