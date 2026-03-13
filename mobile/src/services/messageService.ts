import { MessageBackend } from "../types/message";
import { API } from "./api";

export const messageService = {
  getMessages: async (
    conversationId: string,
    page: number = 1,
    limit: number = 20,
    before?: string,
  ) => {
    const { data } = await API.get(`/messages/${conversationId}/messages`, {
      params: { limit, page, before },
    });
    return data;
  },

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

  markAsRead: async (conversationId: string): Promise<void> => {
    try {
      await API.put(`/conversations/${conversationId}/messages/read`);
    } catch (error) {
      console.error(`Error marking messages as read:`, error);
      throw error;
    }
  },

  getVideo: async (messageId: string) => {
    try {
      const { data } = await API.get(`/messages/${messageId}/video`);
      return data;
    } catch (error) {
      console.error(`Error getting video:`, error);
      throw error;
    }
  },
};

export default messageService;
