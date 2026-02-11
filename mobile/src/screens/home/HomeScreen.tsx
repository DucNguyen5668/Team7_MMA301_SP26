import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
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

      {/* BODY */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderCategories()}
        {renderTabs()}
        {renderProducts()}
      </ScrollView>
    </View>
  );
}
type Category = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const categories: Category[] = [
  { id: "1", name: "Bất động sản", icon: "home-outline" },
  { id: "2", name: "Xe cộ", icon: "car-outline" },
  { id: "3", name: "Thú cưng", icon: "paw-outline" },
  { id: "4", name: "Đồ gia dụng", icon: "bed-outline" },
  { id: "5", name: "Việc làm", icon: "briefcase-outline" },
  { id: "6", name: "Điện tử", icon: "phone-portrait-outline" },
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
    <Text style={styles.tab}>Video</Text>
  </View>
);
const products = [
  {
    id: "1",
    title: "RAM Kingston Fury Beast 8GB DDR4",
    price: "500.000 đ",
    image: "https://via.placeholder.com/200",
  },
  {
    id: "2",
    title: "iPhone 14 Plus 256GB",
    price: "9.500.000 đ",
    image: "https://via.placeholder.com/200",
  },
];

const renderProducts = () => (
  <FlatList
    data={products}
    numColumns={2}
    keyExtractor={(item) => item.id}
    scrollEnabled={false}
    columnWrapperStyle={{ justifyContent: "space-between" }}
    contentContainerStyle={{ padding: 10 }}
    renderItem={({ item }) => (
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
        <Text style={styles.price}>{item.price}</Text>
      </View>
    )}
  />
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
