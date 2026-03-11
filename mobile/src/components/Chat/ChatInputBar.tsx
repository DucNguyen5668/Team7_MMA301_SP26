import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  sending: boolean;
}

export default function ChatInputBar({
  value,
  onChangeText,
  onSend,
  onAttach,
  sending,
}: ChatInputBarProps) {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.inputIconButton} onPress={onAttach}>
          <Ionicons name="add-circle-outline" size={24} color="#666" />
        </TouchableOpacity>

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
          style={[
            styles.sendButton,
            (!value.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={onSend}
          disabled={!value.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#222" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={value.trim() ? "#222" : "#999"}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
