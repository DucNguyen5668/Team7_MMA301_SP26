import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../services/api";
import { AuthContext } from "../../context/authContext";
import { IP_ADDRESS } from "../../constants/ip";
import { Conversation } from "../../types/message";

const SOCKET_URL = `http://${IP_ADDRESS}:5000`;

interface InboxScreenProps {
  onOpenChat: (conversation: Conversation) => void;
}

export default function InboxScreen({ onOpenChat }: InboxScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useContext(AuthContext);
  const socketRef = useRef<Socket | null>(null);

  // ─── Fetch conversations from REST API ──────────────────────────────────────
  const fetchConversations = async () => {
    try {
      setError(null);
      const res = await API.get("/conversations");

      const transformed = res.data.map((conv: any) => {
        const opponent = conv.participants.find((p: any) => p._id !== user.id);
        return {
          id: conv._id,
          opponentId: opponent?._id || "",
          opponentName: opponent?.fullName || "Unknown User",
          opponentAvatar:
            opponent?.avatar ||
            `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          lastMessage: conv.lastMessage?.content || "",
          timestamp: formatTimestamp(
            conv.lastMessage?.createdAt || conv.updatedAt,
          ),
          unread: conv.unreadCount || 0,
        };
      });

      setConversations(transformed);
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
      setError(err.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ─── Socket: listen for live unread badge updates ───────────────────────────
  const connectSocket = async () => {
    const token = await AsyncStorage.getItem("token");

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("InboxScreen socket connected");
      // Personal room (user:${userId}) is joined server-side automatically
    });

    socket.on("connect_error", (err) => {
      console.error("InboxScreen socket error:", err);
    });

    // ── New message from someone → increment that conversation's unread badge ─
    socket.on(
      "unreadUpdate",
      ({
        conversationId,
        unreadCount,
      }: {
        conversationId: string;
        unreadCount: number;
      }) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id.toString() === conversationId.toString()
              ? { ...conv, unread: unreadCount }
              : conv,
          ),
        );
      },
    );

    // ── We opened a chat room → server marked as read → reset badge to 0 ─────
    socket.on(
      "markedAsRead",
      ({ conversationId }: { conversationId: string }) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id.toString() === conversationId.toString()
              ? { ...conv, unread: 0 }
              : conv,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  };

  useEffect(() => {
    fetchConversations();
    const cleanup = connectSocket();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, []);

  const formatTimestamp = (date: string | Date) => {
    if (!date) return "";
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    return messageDate.toLocaleDateString("vi-VN");
  };

  const unreadCount = conversations.filter((c) => c.unread > 0).length;

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.opponentName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" || (filter === "unread" && conv.unread > 0);
    return matchesSearch && matchesFilter;
  });

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onOpenChat(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.opponentAvatar }} style={styles.avatar} />
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unread > 99 ? "99+" : item.unread}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text
            style={[
              styles.opponentName,
              item.unread > 0 && styles.opponentNameUnread,
            ]}
          >
            {item.opponentName}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        <Text
          style={[
            styles.lastMessage,
            item.unread > 0 && styles.lastMessageUnread,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ddd" />
      <Text style={styles.emptyStateTitle}>Chưa có tin nhắn</Text>
      <Text style={styles.emptyStateText}>
        Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={80} color="#FF5722" />
      <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchConversations}>
        <Text style={styles.retryButtonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FDD835" />
        <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
      </View>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderError()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <LinearGradient
        colors={["#fff5e1", "#ffffff"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <TouchableOpacity style={styles.composeButton}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#222" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={18}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm tin nhắn..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "all" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === "all" && styles.filterTabTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "unread" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("unread")}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === "unread" && styles.filterTabTextActive,
              ]}
            >
              Chưa đọc
            </Text>
            {unreadCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          filteredConversations.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FDD835"]}
            tintColor="#FDD835"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  headerGradient: {
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
  },
  composeButton: {
    backgroundColor: "#FDD835",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#222",
  },
  filterTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: "#FDD835",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filterTabTextActive: {
    color: "#222",
  },
  filterBadge: {
    backgroundColor: "#FF5722",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF5722",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  opponentNameUnread: {
    fontWeight: "700",
    color: "#222",
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  productImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  productDetails: {
    flex: 1,
  },

  productPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF5722",
  },
  lastMessage: {
    fontSize: 14,
    color: "#999",
  },
  lastMessageUnread: {
    color: "#222",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FDD835",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
});
