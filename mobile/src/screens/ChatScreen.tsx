import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import InboxScreen from "../components/Chat/InboxScreen";
import ChatRoomScreen from "../components/Chat/ChatRoomScreen";
import ProfileScreen from "../components/Rating/RatingProfileScreen";
import { Conversation } from "../types/message";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const [currentScreen, setCurrentScreen] = useState<
    "inbox" | "chat" | "profile"
  >("inbox");
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

  const openProfile = () => {
    setCurrentScreen("profile");
  };

  const backToChat = () => {
    setCurrentScreen("chat");
  };

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
