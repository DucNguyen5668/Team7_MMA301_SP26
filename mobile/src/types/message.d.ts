export interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  rating?: number;
  totalRatings?: number;
  memberSince?: string;
}

export type MessageType = "text" | "image" | "location" | "video" | "product";

export type LocationContent = { lat: number; lng: number; address: string };

export interface MessageBackend {
  _id: string;
  conversation: string;
  sender: string | User;
  content: string;
  type: MessageType;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationBackend {
  _id: string;
  participants: User[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: MessageBackend;
  unreadCount?: number;
  productImage?: string;
  productPrice?: string;
}

export interface Message {
  id: string | number;
  sender: "me" | "opponent";
  type: MessageType;
  content: string | LocationContent;
  timestamp: string;
  createdAt?: Date;
  isRead?: boolean;
}

export interface Conversation {
  id: string | number;
  opponentId: string;
  opponentName: string;
  opponentAvatar: string;
  productImage?: string;
  productPrice?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  lastMessageTime: Date;
  rating?: number;
  totalRatings?: number;
  memberSince?: string;
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
