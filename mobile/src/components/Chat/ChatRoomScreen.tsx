import React, { useState, useRef, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Conversation, Message } from "../../screens/ChatScreen";
import { io } from "socket.io-client";

const socket = io("http://192.168.0.106:5000");

// Mock messages
const mockMessages: Message[] = [
  {
    id: 1,
    sender: "opponent",
    type: "text",
    content: "Xin chào! Sản phẩm này còn không ạ?",
    timestamp: "10:30",
  },
  {
    id: 2,
    sender: "me",
    type: "text",
    content: "Dạ còn ạ. Bạn quan tâm đến sản phẩm này à?",
    timestamp: "10:31",
  },
  {
    id: 3,
    sender: "opponent",
    type: "text",
    content: "Vâng, tôi muốn hỏi giá có thể thương lượng được không?",
    timestamp: "10:32",
  },
  {
    id: 4,
    sender: "me",
    type: "text",
    content:
      "Giá này đã là tốt nhất rồi bạn ạ. Nhưng nếu bạn mua ngay thì tôi có thể miễn phí ship cho bạn.",
    timestamp: "10:33",
  },
  {
    id: 5,
    sender: "opponent",
    type: "image",
    content:
      "https://images.unsplash.com/photo-1593642532400-2682810df593?w=800&h=600&fit=crop",
    timestamp: "10:35",
  },
  {
    id: 6,
    sender: "opponent",
    type: "text",
    content: "Tôi có sản phẩm tương tự này, bạn xem nhé",
    timestamp: "10:35",
  },
  {
    id: 7,
    sender: "me",
    type: "location",
    content: { lat: 21.0285, lng: 105.8542, address: "Hà Nội, Việt Nam" },
    timestamp: "10:37",
  },
  {
    id: 8,
    sender: "me",
    type: "text",
    content: "Địa chỉ của tôi đây, bạn tiện thì qua xem trực tiếp nhé!",
    timestamp: "10:37",
  },
  {
    id: 9,
    sender: "opponent",
    type: "text",
    content: "Được ạ, tôi sẽ qua vào chiều nay. Cảm ơn bạn!",
    timestamp: "10:40",
  },
];

interface ChatRoomScreenProps {
  conversation: Conversation;
  onBack: () => void;
}

export default function ChatRoomScreen({
  conversation,
  onBack,
}: ChatRoomScreenProps) {
  const [messageInput, setMessageInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [received, setReceived] = useState("");

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setReceived(data);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);


  useEffect(() => {
    // Scroll to bottom when component mounts

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const sendMessage = () => {
    if (messageInput.trim()) {
      // In real app, send message here
      setMessageInput("");
      socket.emit("send_message", messageInput);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  };

  const handleAttach = (type: string) => {
    setShowAttachMenu(false);
    console.log("Attach:", type);
    // In real app, open respective picker
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
          {[
            { icon: "image", label: "Ảnh từ thư viện", type: "gallery" },
            { icon: "camera", label: "Chụp ảnh", type: "camera" },
            { icon: "videocam", label: "Video", type: "video" },
            { icon: "location", label: "Vị trí", type: "location" },
          ].map((item) => (
            <TouchableOpacity
              key={item.type}
              style={styles.attachMenuItem}
              onPress={() => handleAttach(item.type)}
            >
              <Ionicons name={item.icon as any} size={20} color="#666" />
              <Text style={styles.attachMenuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

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

        <Image
          source={{ uri: conversation.opponentAvatar }}
          style={styles.headerAvatar}
        />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{conversation.opponentName}</Text>
          <Text style={styles.headerStatus}>Đang hoạt động</Text>
        </View>
      </View>

      {/* Product Card */}
      <LinearGradient
        colors={["#FFF9E6", "#FFFBF0"]}
        style={styles.productCard}
      >
        <Image
          source={{ uri: conversation.productImage }}
          style={styles.productCardImage}
        />
        <View style={styles.productCardInfo}>
          <Text style={styles.productCardTitle} numberOfLines={1}>
            {conversation.productTitle}
          </Text>
          <Text style={styles.productCardPrice}>
            {conversation.productPrice}
          </Text>
        </View>
        <TouchableOpacity style={styles.productCardButton}>
          <Ionicons name="open-outline" size={14} color="#222" />
          <Text style={styles.productCardButtonText}>Xem</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={mockMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActions}
          contentContainerStyle={styles.quickActionsContent}
        >
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>👍 OK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>📍 Chia sẻ vị trí</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Main Input */}
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
              !messageInput.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!messageInput.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={messageInput.trim() ? "#222" : "#999"}
            />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  headerStatus: {
    fontSize: 13,
    color: "#999",
  },
  productCard: {
    flexDirection: "row",
    padding: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    marginBottom: 4,
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
    padding: 12,
    paddingHorizontal: 16,
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
    lineHeight: 21,
  },
  messageImage: {
    width: 240,
    height: 180,
    borderRadius: 12,
  },
  locationContainer: {
    minWidth: 200,
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
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
  },
  quickActions: {
    maxHeight: 40,
    paddingVertical: 8,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionButton: {
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
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },
  inputIconButton: {},
  textInputContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 15,
    color: "#222",
    maxHeight: 80,
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
    padding: 16,
    paddingBottom: 100,
  },
  attachMenu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
  },
  attachMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
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
    top: 50,
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
    borderRadius: 8,
  },
});
