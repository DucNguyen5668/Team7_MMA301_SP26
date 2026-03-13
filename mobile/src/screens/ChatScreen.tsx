import React, { useState } from "react";
import { StyleSheet } from "react-native";
import InboxScreen from "../components/Chat/InboxScreen";
import ChatRoomScreen from "../components/Chat/ChatRoomScreen";
import ProfileScreen from "../components/Rating/RatingProfileScreen";
import SearchUserModal, {
  UserResult,
} from "../components/Chat/SearchUserModal";
import { Conversation } from "../types/message";
import { SafeAreaView } from "react-native-safe-area-context";

type TCurrentScreen = "inbox" | "chat" | "profile";

export default function ChatScreen() {
  const [currentScreen, setCurrentScreen] = useState<TCurrentScreen>("inbox");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  // User được chọn từ search nhưng chưa có conversation
  const [tempUser, setTempUser] = useState<UserResult | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Mở chat với conversation đã tồn tại (từ InboxScreen)
  const openChat = (conversation: Conversation) => {
    setTempUser(null);
    setSelectedConversation(conversation);
    setCurrentScreen("chat");
  };

  // Mở temp chat sau khi chọn user từ SearchModal (chưa có conversation)
  const openTempChat = (user: UserResult) => {
    setTempUser(user);
    setSelectedConversation(null);
    setCurrentScreen("chat");
  };

  // Callback từ ChatRoomScreen khi tin nhắn đầu tiên được gửi và conv được tạo
  const onConversationCreated = (conversation: Conversation) => {
    setTempUser(null);
    setSelectedConversation(conversation);
  };

  const backToInbox = () => {
    setCurrentScreen("inbox");
    setSelectedConversation(null);
    setTempUser(null);
  };

  const openProfile = () => {
    setCurrentScreen("profile");
  };

  const backToChat = () => {
    setCurrentScreen("chat");
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === "inbox" && (
        <InboxScreen
          onOpenChat={openChat}
          onCompose={() => setShowSearchModal(true)}
        />
      )}

      {currentScreen === "chat" && (selectedConversation || tempUser) && (
        <ChatRoomScreen
          conversation={selectedConversation}
          tempUser={tempUser}
          onConversationCreated={onConversationCreated}
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

      <SearchUserModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectUser={(user) => {
          setShowSearchModal(false);
          openTempChat(user);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
