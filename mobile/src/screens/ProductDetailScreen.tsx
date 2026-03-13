import React, { useState, useEffect, useContext } from "react";

import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { API } from "../services/api";
import { AuthContext } from "../context/authContext";

export default function ProductDetailScreen({ route }: any) {
  const { productId } = route.params;

  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const { user } = useContext(AuthContext);

  const fetchProduct = async () => {
    const res = await API.get(`/products/${productId}?userId=${user.id}`);

    setProduct(res.data);
  };

  if (!product) return null;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{product.title}</Text>

        <Text style={styles.price}>
          {Number(product.price).toLocaleString()} đ
        </Text>

        <Text style={styles.status}>
          {product.condition === "new" ? "Mới" : "Đã sử dụng"}
        </Text>

        <Text style={styles.views}>{product.views} lượt xem</Text>

        <Text style={styles.description}>{product.description}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  image: {
    width: "100%",
    height: 250,
  },

  content: {
    padding: 15,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  price: {
    color: "red",
    fontSize: 18,
    marginTop: 5,
  },

  status: {
    marginTop: 5,
  },

  views: {
    marginTop: 5,
    color: "#777",
  },

  description: {
    marginTop: 15,
    lineHeight: 22,
  },
});
