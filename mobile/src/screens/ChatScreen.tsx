import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import InboxScreen from "../components/Chat/InboxScreen";
import ChatRoomScreen from "../components/Chat/ChatRoomScreen";

export interface Conversation {
  id: number;
  opponentName: string;
  opponentAvatar: string;
  productImage: string;
  productTitle: string;
  productPrice: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  lastMessageTime: Date;
}

export interface Message {
  id: number;
  sender: "opponent" | "me";
  type: "text" | "image" | "location";
  content: string | { lat: number; lng: number; address: string };
  timestamp: string;
}

export default function ChatScreen() {
  const [currentScreen, setCurrentScreen] = useState<"inbox" | "chat">("inbox");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const openChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentScreen("chat");
  };

  const backToInbox = () => {
    setCurrentScreen("inbox");
    setSelectedConversation(null);
  };

  return (
    <View style={styles.container}>
      {currentScreen === "inbox" ? (
        <InboxScreen onOpenChat={openChat} />
      ) : (
        <ChatRoomScreen
          conversation={selectedConversation!}
          onBack={backToInbox}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});