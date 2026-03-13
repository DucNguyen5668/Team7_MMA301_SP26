import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
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
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {showMenu && (
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)} />
      )}

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

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowMenu((prev) => !prev)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>

        {/* Dropdown menu */}
        {showMenu && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowMenu(false);
                onViewProfile();
              }}
            >
              <Text style={styles.dropdownText}>Đánh giá</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
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
    position: "relative",
    zIndex: 10,
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

  /** Dropdown */
  dropdown: {
    position: "absolute",
    top: 54,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
    width: 140,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: "#222",
  },

  /** Overlay to close menu */
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    zIndex: 5,
  },
});
