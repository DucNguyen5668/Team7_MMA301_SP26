import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Conversation } from "../../types/message";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  onViewProfile: () => void;
}

export default function ChatHeader({
  conversation,
  onBack,
  onViewProfile,
}: ChatHeaderProps) {
  return (
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
  );
}

const styles = StyleSheet.create({
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
  },
  moreButton: {
    padding: 8,
  },
});
