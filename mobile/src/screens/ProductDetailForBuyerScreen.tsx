import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { API } from "../services/api";
import { AuthContext } from "../context/authContext";

const { width } = Dimensions.get("window");

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
  if (seconds < 60) return seconds <= 1 ? "vừa xong" : `${seconds} giây trước`;
  if (minutes < 60)
    return minutes === 1 ? "1 phút trước" : `${minutes} phút trước`;
  if (hours < 24) return hours === 1 ? "1 giờ trước" : `${hours} giờ trước`;
  if (days < 7) return days === 1 ? "1 ngày trước" : `${days} ngày trước`;
  if (weeks < 4) return weeks === 1 ? "1 tuần trước" : `${weeks} tuần trước`;
  if (months < 12)
    return months === 1 ? "1 tháng trước" : `${months} tháng trước`;
  return years === 1 ? "1 năm trước" : `${years} năm trước`;
};

export default function ProductDetailForBuyerScreen({ route }: any) {
  const { productId } = route.params;
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}`);
      setProduct(res.data);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    }
  };

  const handleChatWithSeller = async () => {
    if (!product?.seller) return;
    setChatLoading(true);
    const seller = {
      _id: product.seller._id,
      fullName: product.seller.fullName,
      avatar: product.seller.avatar ?? null,
    };
    try {
      const { data } = await API.get(`/conversations/check/${seller._id}`);
      if (data.exists) {
        const conv = {
          id: data.conversation._id,
          opponentId: seller._id,
          opponentName: seller.fullName,
          opponentAvatar: seller.avatar,
          lastMessage: "",
          lastMessageTime: new Date(data.conversation.updatedAt ?? Date.now()),
          timestamp: "",
          unread: 0,
        };
        navigation.navigate("Chat", { conversation: conv, _t: Date.now() });
      } else {
        navigation.navigate("Chat", { tempUser: seller, _t: Date.now() });
      }
    } catch (err) {
      console.error("Lỗi check conversation:", err);
    } finally {
      setChatLoading(false);
    }
  };

  if (!product) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  const images: string[] = product.images ?? [];
  const isNew = product.condition === "new";
  const isOwner =
    user?._id &&
    product.seller?._id &&
    user._id.toString() === product.seller._id.toString();

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* IMAGE CAROUSEL */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setImgIndex(idx);
              }}
            >
              {images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.dotsRow}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === imgIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="image-outline" size={60} color="#ccc" />
          </View>
        )}

        {/* CONTENT */}
        <View style={styles.container}>
          {/* Title & condition */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.title}</Text>
            <View
              style={[
                styles.condBadge,
                isNew ? styles.condNew : styles.condUsed,
              ]}
            >
              <Text style={styles.condText}>{isNew ? "Mới" : "Đã dùng"}</Text>
            </View>
          </View>

          {/* Price */}
          <Text style={styles.price}>
            {Number(product.price).toLocaleString("vi-VN")} ₫
          </Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={15} color="#888" />
              <Text style={styles.metaText}>
                {product.createdAt ? timeAgo(product.createdAt) : "—"}
              </Text>
            </View>
            {product.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={15} color="#888" />
                <Text style={styles.metaText}>{product.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={15} color="#888" />
              <Text style={styles.metaText}>{product.views ?? 0} lượt xem</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.description}>
              {product.description || "Không có mô tả."}
            </Text>
          </View>

          {/* Seller */}
          <View style={styles.sellerBox}>
            {product.seller?.avatar ? (
              <Image
                source={{ uri: product.seller.avatar }}
                style={styles.sellerAvatar}
              />
            ) : (
              <View style={styles.sellerAvatarFallback}>
                <Ionicons name="person" size={28} color="#aaa" />
              </View>
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.sellerLabel}>Người bán</Text>
              <Text style={styles.sellerName}>
                {product.seller?.fullName ?? "—"}
              </Text>
              {product.seller?.phone ? (
                <Text style={styles.sellerPhone}>{product.seller.phone}</Text>
              ) : null}
            </View>
          </View>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* BOTTOM BUTTON */}
      {!isOwner && (
        <LinearGradient
          colors={["rgba(255,255,255,0)", "#fff"]}
          style={styles.bottomGrad}
        >
          <TouchableOpacity
            style={[styles.chatBtn, chatLoading && { opacity: 0.7 }]}
            disabled={chatLoading}
            onPress={handleChatWithSeller}
            activeOpacity={0.85}
          >
            {chatLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                <Text style={styles.chatBtnText}>Chat với người bán</Text>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width, height: 300 },
  imageFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: -20,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#FFA500", width: 16 },
  container: {
    backgroundColor: "#fff",
    marginTop: 8,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  title: { flex: 1, fontSize: 18, fontWeight: "700", color: "#222" },
  condBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
  },
  condNew: { backgroundColor: "#E8F5E9" },
  condUsed: { backgroundColor: "#FFF3E0" },
  condText: { fontSize: 12, fontWeight: "700", color: "#555" },
  price: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F4A100",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: "#888" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  description: { fontSize: 14, color: "#555", lineHeight: 22 },
  sellerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  sellerAvatar: { width: 52, height: 52, borderRadius: 26 },
  sellerAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFEFEF",
    justifyContent: "center",
    alignItems: "center",
  },
  sellerLabel: { fontSize: 11, color: "#999", marginBottom: 2 },
  sellerName: { fontSize: 15, fontWeight: "700", color: "#222" },
  sellerPhone: { fontSize: 13, color: "#666", marginTop: 2 },
  bottomGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  chatBtn: {
    backgroundColor: "#FFA500",
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 3,
  },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
