import { useNavigation } from "@react-navigation/native";
import { usePushNotification } from "../hooks/usePushNotification";

const NotificationNavigation = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const navigation: any = useNavigation();

  usePushNotification({
    onNotificationTapped: (data) => {
      // data = { conversationId: "...", type: "new_message" }
      if (data?.conversationId) {
        // Navigate đến conversation tương ứng
        // Tuỳ navigation setup của bạn:

        navigation.navigate("Chat", {
          conversationId: data.conversationId,
        });
      }
    },
  });

  return <>{children}</>;
};

export default NotificationNavigation;
