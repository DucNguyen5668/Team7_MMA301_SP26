import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tin nhắn</Text>
      <Text style={styles.subtitle}>Bạn chưa có cuộc trò chuyện nào</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { marginTop: 8, color: "#777" },
});
