import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function PostScreen() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  const handlePost = () => {
    if (!title || !price) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    Alert.alert("Thành công", "Tin đã được đăng");
    setTitle("");
    setPrice("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng tin</Text>

      <TextInput
        placeholder="Tiêu đề"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Giá"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handlePost}>
        <Text style={styles.buttonText}>Đăng tin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#FFD400",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { fontWeight: "bold" },
});
