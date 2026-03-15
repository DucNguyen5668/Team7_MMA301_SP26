import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { productService } from "../services/productService";
import { SafeAreaView } from "react-native-safe-area-context";

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
  if (minutes < 60) return minutes === 1 ? "1 phút trước" : `${minutes} phút trước`;
  if (hours < 24) return hours === 1 ? "1 giờ trước" : `${hours} giờ trước`;
  if (days < 7) return days === 1 ? "1 ngày trước" : `${days} ngày trước`;
  if (weeks < 4) return weeks === 1 ? "1 tuần trước" : `${weeks} tuần trước`;
  if (months < 12) return months === 1 ? "1 tháng trước" : `${months} tháng trước`;
  return years === 1 ? "1 năm trước" : `${years} năm trước`;
};

export default function ProductDetailScreen({ route }: any) {
  const { productId } = route.params;
  const navigation = useNavigation<any>();

  const [product, setProduct] = useState<any>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch {
      console.log("Lỗi tải chi tiết sản phẩm");
    }
  };

  const handleDelete = () => {
    Alert.alert("Xoá sản phẩm", "Bạn có chắc muốn xoá tin này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await productService.deleteProduct(productId);
            navigation.goBack();
          } catch {
            Alert.alert("Lỗi", "Không thể xoá sản phẩm.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
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
                <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.dotsRow}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
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
        <View style={styles.content}>
          {/* Title & condition */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.title}</Text>
            <View style={[styles.condBadge, isNew ? styles.condNew : styles.condUsed]}>
              <Text style={styles.condText}>{isNew ? "Mới" : "Đã dùng"}</Text>
            </View>
          </View>

          {/* Price */}
          <Text style={styles.price}>{Number(product.price).toLocaleString("vi-VN")} ₫</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#aaa" />
              <Text style={styles.metaText}>{product.views ?? 0} lượt xem</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#aaa" />
              <Text style={styles.metaText}>{product.createdAt ? timeAgo(product.createdAt) : "—"}</Text>
            </View>
            {product.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color="#aaa" />
                <Text style={styles.metaText}>{product.location}</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.description}>{product.description || "Không có mô tả."}</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* OWNER ACTIONS */}
      <LinearGradient colors={["rgba(255,255,255,0)", "#fff"]} style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("EditProduct", { productId })}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color="#1565C0" />
          <Text style={styles.editBtnText}>Chỉnh sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.85}
        >
          {deleting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.deleteBtnText}>Xoá tin</Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width, height: 300 },
  imageFallback: { justifyContent: "center", alignItems: "center", backgroundColor: "#F0F0F0" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: -20, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#FFA500", width: 16 },
  content: { backgroundColor: "#fff", borderRadius: 20, padding: 18, margin: 12, marginTop: 8 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  title: { flex: 1, fontSize: 18, fontWeight: "700", color: "#222" },
  condBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 2 },
  condNew: { backgroundColor: "#E8F5E9" },
  condUsed: { backgroundColor: "#FFF3E0" },
  condText: { fontSize: 12, fontWeight: "700", color: "#555" },
  price: { fontSize: 24, fontWeight: "800", color: "#F4A100", marginBottom: 12 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: "#999" },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 8 },
  description: { fontSize: 14, color: "#555", lineHeight: 22 },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, gap: 12,
  },
  editBtn: {
    flex: 1, height: 50, borderRadius: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#E3F0FF", borderWidth: 1, borderColor: "#90CAF9",
  },
  editBtnText: { color: "#1565C0", fontWeight: "700", fontSize: 15 },
  deleteBtn: {
    flex: 1, height: 50, borderRadius: 12,
    backgroundColor: "#EF5350",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    elevation: 2,
  },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
