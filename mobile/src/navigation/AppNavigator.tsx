import React, { useContext } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/authContext";
import LoginScreen from "../screens/auth/LoginScreen";
import BottomTabs from "./BottomTabNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePushNotification } from "../hooks/usePushNotification";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useContext(AuthContext);
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Main" component={BottomTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}
