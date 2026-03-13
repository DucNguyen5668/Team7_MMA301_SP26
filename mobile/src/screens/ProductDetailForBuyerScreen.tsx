import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { API } from "../services/api";

export default function ProductDetailForBuyerScreen({ route }: any) {
  const { productId } = route.params;

  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    const res = await API.get(`/products/${productId}`);
    setProduct(res.data);
  };

  if (!product) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        {/* IMAGE */}
        <Image source={{ uri: product.image }} style={styles.image} />

        {/* CONTENT */}
        <View style={styles.container}>
          <Text style={styles.title}>{product.title}</Text>

          <Text style={styles.price}>
            {Number(product.price).toLocaleString()} đ
          </Text>

          <Text style={styles.views}>👁 {product.views} lượt xem</Text>

          {/* DESCRIPTION */}
          <Text style={styles.section}>Mô tả</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* SELLER */}
          <View style={styles.sellerBox}>
            <Ionicons name="person-circle" size={50} color="gray" />

            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontWeight: "bold" }}>Người bán</Text>

              <Text>{product.ownerId?.fullName}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatBtn}>
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
          <Text style={{ color: "#fff" }}>Chat với người bán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 280,
  },

  container: {
    padding: 15,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  price: {
    color: "red",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },

  views: {
    marginTop: 5,
    color: "#777",
  },

  section: {
    marginTop: 20,
    fontWeight: "bold",
    fontSize: 16,
  },

  description: {
    marginTop: 8,
    lineHeight: 22,
  },

  sellerBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
  },

  bottomBar: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  callBtn: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginRight: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },

  chatBtn: {
    flex: 2,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFC107",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
});
