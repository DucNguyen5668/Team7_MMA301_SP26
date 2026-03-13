import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API } from "../services/api";
import { AuthContext } from "../context/authContext";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen({ route }: any) {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const { user } = useContext(AuthContext);

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
    try {
      let url = `/products/${productId}`;
      if (user?.id) {
        url += `?userId=${user.id}`; // chỉ append nếu user tồn tại và có id thật
      }
      const res = await API.get(url);
      setProduct(res.data);
    } catch (error) {
      console.log("Lỗi tải chi tiết sản phẩm:", error);
    }
  };

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  const isNew = product.condition === "new";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Ảnh sản phẩm */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={styles.imageOverlay}
          />
        </View>

        {/* Nội dung chính */}
        <View style={styles.content}>
          {/* Tiêu đề */}
          <Text style={styles.title}>{product.title}</Text>

          {/* Giá + tình trạng */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {Number(product.price).toLocaleString("vi-VN")} ₫
            </Text>

            <View
              style={[
                styles.conditionBadge,
                isNew ? styles.newBadge : styles.usedBadge,
              ]}
            >
              <Text style={styles.conditionText}>
                {isNew ? "Mới" : "Đã sử dụng"}
              </Text>
            </View>
          </View>

          {/* Thông tin phụ */}
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

          {/* Mô tả */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Có thể thêm section khác: thông tin người bán, địa điểm, ... */}
        </View>

        {/* Khoảng trống để tránh bị che bởi nút bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Ảnh
  imageContainer: {
    position: "relative",
    width: "100%",
    height: width * 0.9, // vuông đẹp hơn
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },

  // Nội dung
  content: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 32,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: "800",
    color: "#E53935",
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  newBadge: {
    backgroundColor: "#4CAF50",
  },
  usedBadge: {
    backgroundColor: "#FF9800",
  },
  conditionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  metaRow: {
    flexDirection: "row",
    marginBottom: 24,
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

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    paddingBottom: 24, // cho notch
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 8,
  },
  contactText: {
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  buyButton: {
    flex: 2,
    backgroundColor: "#FF5252",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  buyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
