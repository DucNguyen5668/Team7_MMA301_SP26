import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { API } from "../services/api";
import { AuthContext } from "../context/authContext";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";

export default function ManageScreen() {
  const { user } = useContext(AuthContext);
  const navigation: any = useNavigation();

  const [products, setProducts] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMyProducts();
    }, []),
  );

  useEffect(() => {
    console.log("USER:", user);
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      const res = await API.get(`/products/owner/${user.id}`);
      console.log("PRODUCTS:", res.data);
      setProducts(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteProduct = async (id: string) => {
    Alert.alert("Xóa tin", "Bạn có chắc muốn xóa?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        onPress: async () => {
          try {
            await API.delete(`/products/${id}`);
            fetchMyProducts();
          } catch (error) {
            console.log(error);
          }
        },
      },
    ]);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await API.put(`/products/${id}/status`, {
        status,
      });

      fetchMyProducts();
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("ProductDetail", {
          productId: item._id,
        })
      }
    >
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} />

        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>

          <Text style={styles.price}>
            {Number(item.price).toLocaleString()} đ
          </Text>

          <Text style={styles.views}>👁 {item.views} lượt xem</Text>

          <Text style={styles.status}>
            {item.status === "selling" ? "Đang bán" : "Đã bán"}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("EditProduct", { productId: item._id })
              }
            >
              <Ionicons name="create-outline" size={22} color="blue" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteProduct(item._id)}>
              <Ionicons name="trash-outline" size={22} color="red" />
            </TouchableOpacity>

            {item.status === "selling" && (
              <TouchableOpacity onPress={() => updateStatus(item._id, "sold")}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={22}
                  color="green"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <Text style={styles.header}>Tin đăng của tôi</Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "bold",
    paddingTop: 60,
    paddingLeft: 10,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 12,
    borderRadius: 10,
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "500",
  },

  price: {
    color: "red",
    fontWeight: "bold",
    marginTop: 3,
  },

  views: {
    marginTop: 2,
    color: "#777",
  },

  status: {
    marginTop: 2,
    color: "#333",
  },

  actions: {
    flexDirection: "row",
    marginTop: 8,
    gap: 15,
  },
});
