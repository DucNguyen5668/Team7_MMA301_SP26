import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API } from "../../services/api";
import { AuthContext } from "../../context/authContext";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native"; // ← thêm import này

export default function HomeScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useContext(AuthContext);
  const navigation: any = useNavigation();

  // Wrap fetchProducts bằng useCallback để tránh tạo hàm mới mỗi render
  const fetchProducts = useCallback(async () => {
    if (!user?.id) return; // tránh gọi nếu chưa login

    try {
      const res = await API.get(`/products?excludeOwner=${user.id}`);
      console.log("Sản phẩm mới nhất:", res.data.length, "sản phẩm");
      setProducts(res.data);
    } catch (error) {
      console.log("Lỗi fetch sản phẩm:", error);
    }
  }, [user?.id]); // dependency: chỉ refetch nếu user.id thay đổi

  // Load lần đầu khi component mount (nếu cần)
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [fetchProducts]);

  // Hàm xử lý pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  // Load lại mỗi khi màn hình được focus (click tab Home)
  useFocusEffect(
    useCallback(() => {
      console.log("HomeScreen focused → fetch lại data");
      fetchProducts();
    }, [fetchProducts]),
  );

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("ProductDetail", { productId: item._id })
      }
    >
      <Image source={{ uri: item.image }} style={styles.image} />

      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>

      <Text style={styles.price}>{Number(item.price).toLocaleString()} đ</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={products}
      numColumns={2}
      keyExtractor={(item) => item._id}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 10 }}
      ListHeaderComponent={
        <>
          {/* HEADER */}
          <LinearGradient colors={["#FFD500", "#FFC400"]} style={styles.header}>
            <View style={styles.searchRow}>
              <Ionicons name="menu" size={24} color="black" />

              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#999" />
                <TextInput placeholder="Tìm sản phẩm..." style={{ flex: 1 }} />
              </View>

              <Ionicons name="notifications-outline" size={24} color="black" />
            </View>
          </LinearGradient>

          {renderCategories()}
          {renderTabs()}
        </>
      }
      // Thêm pull-to-refresh ở đây
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#FFD500", "#FFC400"]} // màu vàng của header cho đẹp
          tintColor="#FFD500"
          title="Đang làm mới..." // text hiển thị khi kéo (Android)
          titleColor="#333"
        />
      }
    />
  );
}

type Category = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const categories: Category[] = [
  { id: "1", name: "Việc làm", icon: "briefcase-outline" },
  { id: "2", name: "Điện tử", icon: "phone-portrait-outline" },
  { id: "3", name: "Sản phẩm khác", icon: "cube-outline" },
];

const renderCategories = () => (
  <View style={styles.categoryContainer}>
    {categories.map((item) => (
      <View key={item.id} style={styles.categoryItem}>
        <View style={styles.categoryIcon}>
          <Ionicons name={item.icon} size={26} color="#333" />
        </View>
        <Text style={styles.categoryText}>{item.name}</Text>
      </View>
    ))}
  </View>
);

const renderTabs = () => (
  <View style={styles.tabs}>
    <Text style={styles.activeTab}>Dành cho bạn</Text>
    <Text style={styles.tab}>Gần bạn</Text>
    <Text style={styles.tab}>Mới nhất</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 15,
  },

  categoryItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 20,
  },

  categoryIcon: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    elevation: 3,
  },

  categoryText: {
    marginTop: 5,
    textAlign: "center",
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  activeTab: {
    fontWeight: "bold",
    marginRight: 20,
  },

  tab: {
    color: "#999",
    marginRight: 20,
  },

  card: {
    backgroundColor: "#fff",
    width: "48%",
    marginBottom: 15,
    borderRadius: 10,
    padding: 10,
  },

  image: {
    width: "100%",
    height: 120,
    borderRadius: 10,
  },

  title: {
    marginTop: 5,
  },

  price: {
    color: "red",
    fontWeight: "bold",
    marginTop: 5,
  },
});
