import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import InboxScreen from "../components/Chat/InboxScreen";
import ChatRoomScreen from "../components/Chat/ChatRoomScreen";
import ProfileScreen from "../components/Rating/ProfileScreen";

export interface Conversation {
  id: string;
  opponentId: string; 
  opponentName: string;
  opponentAvatar: string;
  productImage: string;
  productPrice: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  lastMessageTime: Date;
}

export interface Message {
  id: string;
  sender: "opponent" | "me";
  type: "text" | "image" | "location";
  content: string | { lat: number; lng: number; address: string };
  timestamp: string;
}

export default function ChatScreen() {
  const [currentScreen, setCurrentScreen] = useState<
    "inbox" | "chat" | "profile"
  >("inbox");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const openChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    console.log("selectedConversation", conversation);
    setCurrentScreen("chat");
  };

  const backToInbox = () => {
    setCurrentScreen("inbox");
    setSelectedConversation(null);
  };

  const openProfile = () => {
    setCurrentScreen("profile");
  };

  const backToChat = () => {
    setCurrentScreen("chat");
  };

  return (
    <View style={styles.container}>
      {currentScreen === "inbox" && <InboxScreen onOpenChat={openChat} />}

      {currentScreen === "chat" && selectedConversation && (
        <ChatRoomScreen
          conversation={selectedConversation}
          onBack={backToInbox}
          onViewProfile={openProfile}
        />
      )}

      {currentScreen === "profile" && selectedConversation && (
        <ProfileScreen
          opponentId={selectedConversation.opponentId}
          opponentName={selectedConversation.opponentName}
          opponentAvatar={selectedConversation.opponentAvatar}
          conversationId={selectedConversation.id.toString()}
          onBack={backToChat}
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