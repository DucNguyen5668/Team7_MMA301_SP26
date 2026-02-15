import { API } from "./api";

interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  rating?: number;
  totalRatings?: number;
  memberSince?: string;
  responseRate?: string;
  responseTime?: string;
}

export interface MessageBackend {
  _id: string;
  conversation: string;
  sender: string | User;
  content: string;
  type: "text" | "image" | "location" | "video" | "product";
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string | number;
  sender: "me" | "opponent";
  type: "text" | "image" | "location" | "video" | "product";
  content: string | { lat: number; lng: number; address: string };
  timestamp: string;
  createdAt?: Date;
}

export interface ConversationBackend {
  _id: string;
  participants: User[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: MessageBackend;
  unreadCount?: number;
  productImage?: string;
  productTitle?: string;
  productPrice?: string;
}

export interface Conversation {
  id: number | string;
  opponentName: string;
  opponentAvatar: string;
  productImage: string;
  productTitle: string;
  productPrice: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  lastMessageTime: Date;
  rating?: number;
  totalRatings?: number;
  memberSince?: string;
  responseRate?: string;
  responseTime?: string;
}

export interface CreateConversationRequest {
  userId: string;
}
export interface CreateConversationResponse {
  _id: string;
  participants: User[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: MessageBackend;
}

export const conversationService = {
  getConversations: async (): Promise<ConversationBackend[]> => {
    try {
      const response = await API.get("/conversations");
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },

  getConversationById: async (
    conversationId: string,
  ): Promise<ConversationBackend> => {
    try {
      const response = await API.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching conversation ${conversationId}:`, error);
      throw error;
    }
  },

  createOrGetConversation: async (
    userId: string,
  ): Promise<CreateConversationResponse> => {
    try {
      const response = await API.post("/conversations", { userId });
      return response.data;
    } catch (error) {
      console.error("Error creating/getting conversation:", error);
      throw error;
    }
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    try {
      await API.put(`/conversations/${conversationId}/read`);
    } catch (error) {
      console.error(
        `Error marking conversation ${conversationId} as read:`,
        error,
      );
      throw error;
    }
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    try {
      await API.delete(`/conversations/${conversationId}`);
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      throw error;
    }
  },
};

export default conversationService;
