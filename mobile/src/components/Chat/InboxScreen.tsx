import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Conversation } from "../../screens/ChatScreen";

// Mock data with rating information
const mockConversations: Conversation[] = [
  {
    id: 1,
    opponentName: "Nguyễn Văn A",
    opponentAvatar: "https://i.pravatar.cc/150?img=12",
    productImage:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    productTitle: "Đồng hồ nam cao cấp",
    productPrice: "2.500.000đ",
    lastMessage: "Sản phẩm còn không bạn?",
    timestamp: "2 phút",
    unread: 2,
    lastMessageTime: new Date(),
    rating: 4.8,
    totalRatings: 127,
    memberSince: "Tháng 3, 2023",
    responseRate: "98%",
    responseTime: "~ 5 phút",
  },
  {
    id: 2,
    opponentName: "Trần Thị B",
    opponentAvatar: "https://i.pravatar.cc/150?img=25",
    productImage:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    productTitle: "Tai nghe Bluetooth Sony WH-1000XM5",
    productPrice: "7.200.000đ",
    lastMessage: "Bạn có thể giao hàng không?",
    timestamp: "15 phút",
    unread: 0,
    lastMessageTime: new Date(Date.now() - 15 * 60000),
    rating: 5.0,
    totalRatings: 89,
    memberSince: "Tháng 1, 2022",
    responseRate: "100%",
    responseTime: "~ 2 phút",
  },
  {
    id: 3,
    opponentName: "Lê Minh C",
    opponentAvatar: "https://i.pravatar.cc/150?img=33",
    productImage:
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=400&fit=crop",
    productTitle: "Giày thể thao Nike Air Max 270",
    productPrice: "1.850.000đ",
    lastMessage: "Cảm ơn bạn nhiều!",
    timestamp: "1 giờ",
    unread: 0,
    lastMessageTime: new Date(Date.now() - 60 * 60000),
    rating: 4.5,
    totalRatings: 234,
    memberSince: "Tháng 8, 2021",
    responseRate: "95%",
    responseTime: "~ 10 phút",
  },
  {
    id: 4,
    opponentName: "Phạm Thị D",
    opponentAvatar: "https://i.pravatar.cc/150?img=45",
    productImage:
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
    productTitle: "Bàn làm việc gỗ sồi",
    productPrice: "3.200.000đ",
    lastMessage: "Tôi muốn xem trực tiếp",
    timestamp: "3 giờ",
    unread: 1,
    lastMessageTime: new Date(Date.now() - 3 * 60 * 60000),
    rating: 4.9,
    totalRatings: 56,
    memberSince: "Tháng 11, 2023",
    responseRate: "99%",
    responseTime: "~ 3 phút",
  },
];

interface InboxScreenProps {
  onOpenChat: (conversation: Conversation) => void;
}

export default function InboxScreen({ onOpenChat }: InboxScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = mockConversations.filter((c) => c.unread > 0).length;

  const filteredConversations = mockConversations.filter((conv) => {
    const matchesSearch =
      conv.opponentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.productTitle.toLowerCase().includes(searchQuery.toLowerCase());
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
            <Text style={styles.unreadBadgeText}>{item.unread}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.opponentName}>{item.opponentName}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Image
            source={{ uri: item.productImage }}
            style={styles.productImage}
          />
          <View style={styles.productDetails}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {item.productTitle}
            </Text>
            <Text style={styles.productPrice}>{item.productPrice}</Text>
          </View>
        </View>

        {/* Last Message */}
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  productTitle: {
    fontSize: 13,
    color: "#666",
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
});