import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { productService } from "../services/productService";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  active: {
    label: "Đang bán",
    color: "#1B7A3E",
    bg: "#EDFAF3",
    dot: "#2ECC71",
  },
  sold: { label: "Đã bán", color: "#5B21B6", bg: "#F0EBFF", dot: "#8B5CF6" },
  hidden: { label: "Ẩn", color: "#B45309", bg: "#FFFBEB", dot: "#F59E0B" },
};

export default function ManageScreen() {
  const navigation = useNavigation<any>();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchMyProducts();
    }, []),
  );

  const fetchMyProducts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await productService.getMyProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Xoá tin đăng",
      "Hành động này không thể hoàn tác. Bạn có chắc không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              await productService.deleteProduct(id);
              setProducts((prev) => prev.filter((p) => p._id !== id));
            } catch {
              Alert.alert("Lỗi", "Không thể xoá sản phẩm.");
            }
          },
        },
      ],
    );
  };

  const handleUpdateStatus = async (
    id: string,
    status: "active" | "sold" | "hidden",
  ) => {
    try {
      await productService.updateProduct(id, { status });
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status } : p)),
      );
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
    }
  };

  const renderItem = ({ item }: any) => {
    const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.active;
    const thumb = item.images?.[0];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("ProductDetail", { productId: item._id })
        }
      >
        {/* THUMBNAIL */}
        <View style={styles.thumbBox}>
          {thumb ? (
            <Image
              source={{ uri: thumb }}
              style={styles.thumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Ionicons name="image-outline" size={28} color="#ccc" />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>
              {st.label}
            </Text>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.info}>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          <Text style={styles.price}>
            {Number(item.price).toLocaleString("vi-VN")} ₫
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="eye-outline" size={13} color="#aaa" />
            <Text style={styles.metaText}>{item.views ?? 0} lượt xem</Text>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actions}>
            <ActionBtn
              icon="create-outline"
              label="Sửa"
              color="#1565C0"
              bg="#EFF6FF"
              onPress={() =>
                navigation.navigate("EditProduct", { productId: item._id })
              }
            />

            {item.status !== "sold" && (
              <ActionBtn
                icon="checkmark-done-outline"
                label="Đã bán"
                color="#2E7D32"
                bg="#EDFAF3"
                onPress={() => handleUpdateStatus(item._id, "sold")}
              />
            )}

            {item.status === "active" && (
              <ActionBtn
                icon="eye-off-outline"
                label="Ẩn"
                color="#E65100"
                bg="#FFF3E0"
                onPress={() => handleUpdateStatus(item._id, "hidden")}
              />
            )}

            {item.status === "hidden" && (
              <ActionBtn
                icon="eye-outline"
                label="Hiện"
                color="#2E7D32"
                bg="#EDFAF3"
                onPress={() => handleUpdateStatus(item._id, "active")}
              />
            )}

            <ActionBtn
              icon="trash-outline"
              label="Xoá"
              color="#C62828"
              bg="#FFEBEE"
              onPress={() => handleDelete(item._id)}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>Tin đăng của tôi</Text>
            <Text style={styles.headerSub}>Quản lý & cập nhật sản phẩm</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{products.length}</Text>
          </View>
        </View>

        {/* Stats row */}
        {products.length > 0 && (
          <View style={styles.statsRow}>
            {(["active", "sold", "hidden"] as const).map((key) => {
              const cfg = STATUS_CONFIG[key];
              const cnt = products.filter((p) => p.status === key).length;
              return (
                <View key={key} style={styles.statItem}>
                  <View
                    style={[styles.statDot, { backgroundColor: cfg.dot }]}
                  />
                  <Text style={styles.statLabel}>{cfg.label}</Text>
                  <Text style={styles.statCount}>{cnt}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FFA500" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMyProducts(true)}
              colors={["#FF7A00"]}
              tintColor="#FF7A00"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>Bạn chưa đăng tin nào</Text>
              <Text style={styles.emptySub}>Nhấn "Đăng tin" để bắt đầu</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

/* ─── Small reusable action button ─────────────────────────── */
function ActionBtn({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon as any} size={15} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  /* Header */
  header: {
    paddingTop: Platform.OS === "ios" ? 55 : StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#FF7A00",
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.78)",
    marginTop: 3,
  },
  countBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 6,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 5,
  },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statLabel: { flex: 1, fontSize: 11, color: "rgba(255,255,255,0.85)" },
  statCount: { fontSize: 12, fontWeight: "700", color: "#fff" },

  listContent: { padding: 16, paddingBottom: 30 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Card — original */
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  thumbBox: {
    width: 110,
    height: 160,
    position: "relative",
    overflow: "hidden",
  },

  thumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbFallback: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  info: { flex: 1, padding: 12 },
  title: { fontSize: 14, fontWeight: "600", color: "#222", marginBottom: 4 },
  price: { fontSize: 16, fontWeight: "800", color: "#F4A100", marginBottom: 4 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  metaText: { fontSize: 12, color: "#aaa" },

  /* Actions — pill style */
  actions: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  actionText: { fontSize: 12, fontWeight: "600" },

  /* Empty */
  emptyBox: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, color: "#999", fontWeight: "600" },
  emptySub: { fontSize: 13, color: "#bbb" },
});
