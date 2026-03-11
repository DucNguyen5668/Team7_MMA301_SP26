import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "../../types/message";

interface MessageBubbleProps {
  item: Message;
  onImagePress: (uri: string) => void;
  onVideoPress: (uri: string) => void;
}

export default function MessageBubble({
  item,
  onImagePress,
  onVideoPress,
}: MessageBubbleProps) {
  const isMe = item.sender === "me";

  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.messageContainerMe : styles.messageContainerOpponent,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleMe : styles.messageBubbleOpponent,
        ]}
      >
        {item.type === "text" && (
          <Text style={styles.messageText}>{item.content as string}</Text>
        )}

        {item.type === "image" && (
          <TouchableOpacity
            onPress={() => onImagePress(item.content as string)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.content as string }}
              style={styles.messageImage}
            />
          </TouchableOpacity>
        )}

        {item.type === "video" && (
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => onVideoPress(item.content as string)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.content as string }}
              style={styles.messageImage}
              blurRadius={2}
            />
            <View style={styles.videoPlayButton}>
              <Ionicons name="play-circle" size={44} color="#fff" />
            </View>
            <Text style={styles.videoLabel}>Video</Text>
          </TouchableOpacity>
        )}

        {item.type === "location" && (
          <View style={styles.locationContainer}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={16} color="#FF5722" />
              <Text style={styles.locationLabel}>Vị trí</Text>
            </View>
            <View style={styles.locationMap}>
              <Ionicons name="map" size={32} color="#999" />
            </View>
            <Text style={styles.locationAddress}>
              {(item.content as any).address}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
    </View>
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
