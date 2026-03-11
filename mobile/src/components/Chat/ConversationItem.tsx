import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Conversation } from "../../types/message";

interface ConversationItemProps {
  item: Conversation;
  onPress: (item: Conversation) => void;
}

export default function ConversationItem({
  item,
  onPress,
}: ConversationItemProps) {
  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onPress(item)}
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
}

const styles = StyleSheet.create({
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
  opponentNameUnread: {
    fontWeight: "700",
    color: "#222",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
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
