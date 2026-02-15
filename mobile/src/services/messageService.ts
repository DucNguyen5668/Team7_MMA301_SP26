import { MessageBackend } from "../hooks/useChatMessages";
import { API } from "./api";

/**
 * Message API Service
 * Handles all message-related API calls
 */
export const messageService = {
  /**
   * Get messages for a conversation with pagination
   * @param conversationId - The conversation ID
   * @param page - Page number (default: 1)
   * @param limit - Number of messages per page (default: 20)
   * @returns Paginated messages
   */
  getMessages: async (
    conversationId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    messages: MessageBackend[];
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const response = await API.get(
        `/conversations/${conversationId}/messages`,
        {
          params: { page, limit },
        },
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching messages for conversation ${conversationId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Send a message (via REST API - alternative to Socket.IO)
   * @param conversationId - The conversation ID
   * @param content - Message content
   * @param type - Message type
   * @returns Created message
   */
  sendMessage: async (
    conversationId: string,
    content: string,
    type: "text" | "image" | "location" | "video" | "product" = "text",
  ): Promise<MessageBackend> => {
    try {
      const response = await API.post(
        `/conversations/${conversationId}/messages`,
        {
          content,
          type,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  /**
   * Delete a message (you'll need to implement this endpoint in backend)
   * @param conversationId - The conversation ID
   * @param messageId - The message ID
   */
  deleteMessage: async (
    conversationId: string,
    messageId: string,
  ): Promise<void> => {
    try {
      await API.delete(
        `/conversations/${conversationId}/messages/${messageId}`,
      );
    } catch (error) {
      console.error(`Error deleting message ${messageId}:`, error);
      throw error;
    }
  },

  /**
   * Mark messages as read (you'll need to implement this endpoint in backend)
   * @param conversationId - The conversation ID
   */
  markAsRead: async (conversationId: string): Promise<void> => {
    try {
      await API.put(`/conversations/${conversationId}/messages/read`);
    } catch (error) {
      console.error(`Error marking messages as read:`, error);
      throw error;
    }
  },
};

export default messageService;
