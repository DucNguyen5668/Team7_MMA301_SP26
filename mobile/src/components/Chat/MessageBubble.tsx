import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "../../types/message";

interface MessageBubbleProps {
  item: Message;
  onImagePress: (uri: string) => void;
  onVideoPress: (uri: string) => void;
  isFirstMessage: boolean;
}

export default function MessageBubble({
  item,
  onImagePress,
  onVideoPress,
  isFirstMessage,
}: MessageBubbleProps) {
  const isMe = item.sender === "me";

  const [isShowTimeStamp, setIsShowTimeStamp] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.messageContainer,
        isMe ? styles.messageContainerMe : styles.messageContainerOpponent,
      ]}
      onPress={() => setIsShowTimeStamp(!isShowTimeStamp)}
    >
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleMe : styles.messageBubbleOpponent,
        ]}
      >
        {/* IMAGE */}
        {item.attachment?.type === "image" && (
          <TouchableOpacity
            onPress={() => onImagePress(item.attachment!.data)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.attachment!.data }}
              style={styles.messageImage}
            />
          </TouchableOpacity>
        )}

        {/* VIDEO */}
        {item.attachment?.type === "video" && (
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => onVideoPress(item.attachment!.data)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.attachment!.data }}
              style={styles.messageImage}
              blurRadius={2}
            />
            <View style={styles.videoPlayButton}>
              <Ionicons name="play-circle" size={44} color="#fff" />
            </View>
            <Text style={styles.videoLabel}>Video</Text>
          </TouchableOpacity>
        )}

        {/* TEXT */}
        {item.content?.length > 0 && (
          <Text style={styles.messageText}>{item.content}</Text>
        )}
      </View>

      {(isShowTimeStamp || isFirstMessage) && (
        <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 12,
  },
  messageContainerMe: {
    alignItems: "flex-end",
  },
  messageContainerOpponent: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleMe: {
    backgroundColor: "#FDD835",
    borderBottomRightRadius: 4,
  },
  messageBubbleOpponent: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#222",
    lineHeight: 20,
    marginTop: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  videoContainer: {
    position: "relative",
    width: 220,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  videoPlayButton: {
    justifyContent: "center",
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  videoLabel: {
    position: "absolute",
    bottom: 6,
    left: 8,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  locationContainer: {
    width: 200,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  locationMap: {
    height: 120,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 13,
    color: "#666",
  },
  messageTimestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
