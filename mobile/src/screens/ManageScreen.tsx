import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

const dummyPosts = [
  { id: "1", title: "iPhone 12 128GB", price: "7.500.000 đ" },
  { id: "2", title: "Bàn học gỗ", price: "500.000 đ" },
];

export default function ManageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý tin</Text>

      <FlatList
        data={dummyPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.price}>{item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  postTitle: { fontSize: 16, fontWeight: "500" },
  price: { color: "red", marginTop: 4 },
});
