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
import { useNavigation } from "@react-navigation/native";

export default function ProductDetailForBuyerScreen({ route }: any) {
  const { productId } = route.params;
  const navigation = useNavigation<any>();

  const [product, setProduct] = useState<any>(null);

  // Hàm tính thời gian đã trôi qua (relative time)
  const timeAgo = (timestamp: string | Date | number): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
      return seconds <= 1 ? "vừa xong" : `${seconds} giây trước`;
    }
    if (minutes < 60) {
      return minutes === 1 ? "1 phút trước" : `${minutes} phút trước`;
    }
    if (hours < 24) {
      return hours === 1 ? "1 giờ trước" : `${hours} giờ trước`;
    }
    if (days < 7) {
      return days === 1 ? "1 ngày trước" : `${days} ngày trước`;
    }
    if (weeks < 4) {
      return weeks === 1 ? "1 tuần trước" : `${weeks} tuần trước`;
    }
    if (months < 12) {
      return months === 1 ? "1 tháng trước" : `${months} tháng trước`;
    }
    return years === 1 ? "1 năm trước" : `${years} năm trước`;
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    const res = await API.get(`/products/${productId}`);
    setProduct(res.data);
  };

  const handleChatWithSeller = () => {
    if (!product?.ownerId) return;

    const sellerAsUser = {
      _id: product.ownerId._id,
      fullName: product.ownerId.fullName,
      avatar: product.ownerId.avatar ?? null,
    };

    // Jump sang tab Chat, truyền tempUser
    navigation.navigate("Chat", {
      tempUser: sellerAsUser,
      _t: Date.now(), // ✅ force re-trigger
    });
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

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{product.views || 0} lượt xem</Text>
            </View>

            {/* Thời gian đăng */}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                {product.createdAt
                  ? timeAgo(product.createdAt)
                  : "Không xác định"}
              </Text>
            </View>
          </View>

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
        <TouchableOpacity style={styles.chatBtn} onPress={handleChatWithSeller}>
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
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 24,
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
