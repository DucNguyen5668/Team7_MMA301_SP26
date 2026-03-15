import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SearchScreen from "../screens/SearchScreen";
import ProductDetailForBuyerScreen from "../screens/ProductDetailForBuyerScreen";

const Stack = createNativeStackNavigator();

export default function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailForBuyerScreen}
        options={{ title: "Chi tiết sản phẩm" }}
      />
    </Stack.Navigator>
  );
}
