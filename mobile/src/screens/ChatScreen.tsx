import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import InboxScreen from "../components/Chat/InboxScreen";
import ChatRoomScreen from "../components/Chat/ChatRoomScreen";
import ProfileScreen from "../components/Rating/ProfileScreen";
import RatingModal from "../components/Rating/RatingModal";

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
  rating: number;
  totalRatings: number;
  memberSince: string;
  responseRate: string;
  responseTime: string;
}

export interface Message {
  id: number;
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
  const [showRatingModal, setShowRatingModal] = useState(false);

  const openChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    console.log('selectedConversation', conversation)
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

  const handleRatingSubmit = (rating: number, review: string) => {
    console.log("Rating submitted:", { rating, review });
    // In real app, send to backend
    // You can add API call here
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
          user={{
            name: selectedConversation.opponentName,
            avatar: selectedConversation.opponentAvatar,
            rating: selectedConversation.rating,
            totalRatings: selectedConversation.totalRatings,
            memberSince: selectedConversation.memberSince,
            responseRate: selectedConversation.responseRate,
            responseTime: selectedConversation.responseTime,
          }}
          onBack={backToChat}
          onOpenRatingModal={() => setShowRatingModal(true)}
        />
      )}

      {selectedConversation && (
        <RatingModal
          visible={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={handleRatingSubmit}
          user={{
            name: selectedConversation.opponentName,
            avatar: selectedConversation.opponentAvatar,
          }}
          productTitle={selectedConversation.productTitle}
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