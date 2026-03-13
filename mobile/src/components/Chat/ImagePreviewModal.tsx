import React from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ImagePreviewModalProps {
  imageUri: string | null;
  onClose: () => void;
}

export default function ImagePreviewModal({
  imageUri,
  onClose,
}: ImagePreviewModalProps) {
  return (
    <Modal
      visible={!!imageUri}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.imagePreviewOverlay} onPress={onClose}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
