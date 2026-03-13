import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  sending: boolean;
  pendingImage?: ImagePicker.ImagePickerAsset | null;
  onRemovePendingImage?: () => void;
  pendingVideo?: (ImagePicker.ImagePickerAsset & { thumbnail?: string }) | null;
  onRemovePendingVideo?: () => void;
}

export default function ChatInputBar({
  value,
  onChangeText,
  onSend,
  onAttach,
  sending,
  pendingImage = null,
  onRemovePendingImage,
  pendingVideo = null,
  onRemovePendingVideo,
}: ChatInputBarProps) {
  const canSend =
    (value.trim().length > 0 || !!pendingImage || !!pendingVideo) && !sending;

  return (
    <View style={styles.inputContainer}>
      {/* ── Input row ── */}
      <View style={styles.inputBar}>
        {!pendingImage && !pendingVideo && (
          <TouchableOpacity style={styles.inputIconButton} onPress={onAttach}>
            <Ionicons name="add-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
        )}

        {pendingImage && (
          <View style={styles.smallPreview}>
            <Image
              source={{ uri: pendingImage.uri }}
              style={styles.smallPreviewImage}
            />
            <TouchableOpacity
              style={styles.removeSmall}
              onPress={onRemovePendingImage}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {pendingVideo && (
          <View style={styles.smallPreview}>
            <View style={styles.smallPreviewImageContainer}>
              <Image
                source={{ uri: pendingVideo.thumbnail }}
                style={styles.smallPreviewImage}
              />
              <View style={styles.smallPreviewPlayButton}>
                <Ionicons name="play-circle" size={24} color="#fff" />
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeSmall}
              onPress={onRemovePendingVideo}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={1000}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={!canSend}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#222" />
          ) : (
            <Ionicons name="send" size={20} color={canSend ? "#222" : "#999"} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  smallPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 4,
    position: "relative",
  },
  smallPreviewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  smallPreviewImageContainer: {
    position: "relative",
    width: 40, 
    height: 40, 
  },
  smallPreviewPlayButton: {
    position: "absolute",
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
  },
  videoFallback: {
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  removeSmall: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 2,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  previewBar: {
    marginBottom: 8,
  },
  previewItem: {
    position: "relative",
    width: 80,
    height: 80,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 11,
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
});
