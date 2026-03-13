import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AttachMenuProps {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
}

export default function AttachMenu({
  visible,
  onClose,
  onPickImage,
  onPickVideo,
}: AttachMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.attachMenu}>
          <TouchableOpacity style={styles.attachMenuItem} onPress={onPickImage}>
            <View
              style={[styles.attachIconCircle, { backgroundColor: "#E8F5E9" }]}
            >
              <Ionicons name="image" size={22} color="#43A047" />
            </View>
            <Text style={styles.attachMenuText}>Ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.attachMenuItem} onPress={onPickVideo}>
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
}

const styles = StyleSheet.create({
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
  },
  attachMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 8,
  },
  attachIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  attachMenuText: {
    fontSize: 14,
    color: "#222",
  },
});
