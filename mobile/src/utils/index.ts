import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import * as VideoThumbnails from "expo-video-thumbnails";

export async function generateVideoThumbnail(uri: string) {
  try {
    const { uri: thumbnail } = await VideoThumbnails.getThumbnailAsync(uri, {
      time: 1000,
    });
    return thumbnail;
  } catch (e) {
    console.warn(e);
    return null;
  }
}

export const requestPermission = async (
  type: "camera" | "mediaLibrary",
): Promise<boolean> => {
  if (type === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cho phép ứng dụng truy cập camera trong cài đặt.",
        [{ text: "OK" }],
      );
      return false;
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cho phép ứng dụng truy cập thư viện ảnh trong cài đặt.",
        [{ text: "OK" }],
      );
      return false;
    }
  }
  return true;
};

export function formatChatTimestamp(date: string | Date): string {
  if (!date) return "";
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  if (diffDays < 7) return `${diffDays} ngày`;
  return messageDate.toLocaleDateString("vi-VN");
}

export function formatMessageTimestamp(date: string | Date): string {
  const messageDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;

  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return messageDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function formatReviewTimestamp(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
  return `${Math.floor(diffDays / 365)} năm trước`;
}
