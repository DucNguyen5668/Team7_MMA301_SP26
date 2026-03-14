import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API } from "../services/api";

// Cấu hình cách hiển thị notification khi app đang foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

interface UsePushNotificationOptions {
  /** Callback khi user tap vào notification (để navigate) */
  onNotificationTapped?: (data: Record<string, any>) => void;
}

export function usePushNotification({
  onNotificationTapped,
}: UsePushNotificationOptions = {}) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerAndSaveToken();

    // Lắng nghe notification khi app đang foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Có thể log hoặc update badge ở đây nếu cần
        console.log("Notification received:", notification);
      });

    // Lắng nghe khi user tap notification (foreground hoặc background)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<
          string,
          any
        >;
        onNotificationTapped?.(data);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}

async function registerAndSaveToken() {
  console.log("Registering push token...");

  // Xin quyền notification
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Không được cấp quyền push notification.");
    return;
  }

  // Cần kênh riêng trên Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FDD835",
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "d55ef5a5-76d1-4cab-8315-76b85a621f17",
    });
    const token = tokenData.data;
    console.log("Expo Push Token:", token);

    // Gửi token lên server
    const res = await API.post("/notifications/push-token", { token });
    console.log("Push token response:", res);
  } catch (err) {
    console.error("Lỗi lấy/lưu push token:", err);
  }
}

export async function unregisterPushToken() {
  try {
    await API.delete("/notifications/push-token");
  } catch (err) {
    console.error("Lỗi xóa push token:", err);
  }
}
