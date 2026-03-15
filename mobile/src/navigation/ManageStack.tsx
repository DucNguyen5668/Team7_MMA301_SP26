import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ManageScreen from "../screens/ManageScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import EditProductScreen from "../screens/EditProductScreen";

const Stack = createNativeStackNavigator();

export default function ManageStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManageScreen"
        component={ManageScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: "Chi tiết sản phẩm" }}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{ title: "Chỉnh sửa sản phẩm" }}
      />
    </Stack.Navigator>
  );
}
