import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
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
import { IP_ADDRESS } from "../../constants/ip";
import { Conversation } from "../../types/message";
import ConversationItem from "./ConversationItem";
import { formatChatTimestamp } from "../../utils";

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

  const socketRef = useRef<Socket | null>(null);

  console.log('conversations', conversations)

  const fetchConversations = async () => {
    try {
      setError(null);
      const params: Record<string, string> = {};
      if (filter === "unread") params.filter = "unread";
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const { data } = await API.get("/conversations", { params });
      setConversations(
        data.map(
          (conv: any): Conversation => ({
            id: conv._id,
            opponentId: conv.opponent?._id || "",
            opponentName: conv.opponent?.fullName || "Unknown User",
            opponentAvatar:
              conv.opponent?.avatar ||
              `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            lastMessage: conv.lastMessage?.content || "",
            lastMessageTime: new Date(
              conv.lastMessage?.createdAt || conv.updatedAt,
            ),
            timestamp: formatChatTimestamp(
              conv.lastMessage?.createdAt || conv.updatedAt,
            ),
            unread: conv.unreadCount || 0,
          }),
        ),
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Socket: update unread badges in real-time
  useEffect(() => {
    let socket: any;
    (async () => {
      const token = await AsyncStorage.getItem("token");
      socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on("unreadUpdate", ({ conversationId, unreadCount }: any) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id.toString() === conversationId.toString()
              ? { ...c, unread: unreadCount }
              : c,
          ),
        );
      });

      socket.on("markedAsRead", ({ conversationId }: any) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id.toString() === conversationId.toString()
              ? { ...c, unread: 0 }
              : c,
          ),
        );
      });
    })();

    return () => socket?.disconnect();
  }, []);

  // Refetch immediately when filter changes
  useEffect(() => {
    fetchConversations();
  }, [filter]);

  // Debounced refetch when search changes
  useEffect(() => {
    const t = setTimeout(fetchConversations, searchQuery ? 350 : 0);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [filter, searchQuery]);

  // badge: total unread across ALL conversations (not filtered)
  const unreadCount = conversations.reduce(
    (sum, c) => sum + (c.unread > 0 ? 1 : 0),
    0,
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
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={80} color="#FF5722" />
          <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchConversations}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <LinearGradient
        colors={["#fff5e1", "#ffffff"]}
        style={styles.headerGradient}
      >
        {/* Header */}
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
          {(["all", "unread"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                filter === tab && styles.filterTabActive,
              ]}
              onPress={() => setFilter(tab)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === tab && styles.filterTabTextActive,
                ]}
              >
                {tab === "all" ? "Tất cả" : "Chưa đọc"}
              </Text>
              {tab === "unread" && unreadCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ConversationItem item={item} onPress={onOpenChat} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          conversations.length === 0
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={80} color="#ddd" />
            <Text style={styles.emptyStateTitle}>Chưa có tin nhắn</Text>
            <Text style={styles.emptyStateText}>
              Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
  headerGradient: { paddingTop: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#222" },
  composeButton: {
    backgroundColor: "#FDD835",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#222" },
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
  filterTabActive: { backgroundColor: "#FDD835" },
  filterTabText: { fontSize: 14, fontWeight: "600", color: "#666" },
  filterTabTextActive: { color: "#222" },
  filterBadge: {
    backgroundColor: "#FF5722",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  listContent: { paddingVertical: 8 },
  emptyListContent: { flexGrow: 1 },
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
  emptyStateText: { fontSize: 15, color: "#999", textAlign: "center" },
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
  retryButtonText: { fontSize: 16, fontWeight: "600", color: "#222" },
});
