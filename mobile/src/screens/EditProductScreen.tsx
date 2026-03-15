import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { productService } from "../services/productService";

const CATEGORIES = ["Xe cộ", "Đồ gia dụng", "Điện tử", "Khác"];

export default function EditProductScreen({ route, navigation }: any) {
  const { productId } = route.params;

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Khác");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState<"new" | "used">("used");
  const [images, setImages] = useState<string[]>([]); // current images (urls or base64)

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const p = await productService.getProductById(productId);
      setTitle(p.title ?? "");
      setDescription(p.description ?? "");
      setPrice(String(p.price ?? ""));
      setCategory(p.category ?? "Khác");
      setCondition(p.condition ?? "used");
      setLocation(p.location ?? "");
      setImages(p.images ?? []);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải thông tin sản phẩm.");
    } finally {
      setFetchLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets) {
      const newImgs = result.assets
        .filter((a) => a.base64)
        .map((a) => `data:image/jpeg;base64,${a.base64}`);
      setImages([...images, ...newImgs].slice(0, 5));
    }
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleUpdate = async () => {
    if (!title.trim() || !price) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Tiêu đề và Giá.");
      return;
    }
    if (images.length === 0) {
      Alert.alert("Thiếu ảnh", "Vui lòng có ít nhất 1 ảnh.");
      return;
    }

    setLoading(true);
    try {
      await productService.updateProduct(productId, {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        condition,
        location: location.trim(),
        images,
      });
      Alert.alert("Thành công", "Cập nhật sản phẩm thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể cập nhật sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F7" }}>
      <LinearGradient colors={["#FFD500", "#FFA500"]} style={styles.header}>
        <Text style={styles.headerTitle}>✏️ Chỉnh sửa tin</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* IMAGES */}
        <Text style={styles.label}>Hình ảnh ({images.length}/5) *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imageBox}>
              <Image source={{ uri: img }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                <Ionicons name="close-circle" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={28} color="#999" />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* TITLE */}
        <Text style={styles.label}>Tiêu đề *</Text>
        <TextInput
          style={styles.input}
          placeholder="Tên sản phẩm..."
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* CATEGORY & PRICE */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Danh mục *</Text>
            <TouchableOpacity style={styles.pickerBox} onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.pickerText, { color: "#333" }]}>{category}</Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Giá (VNĐ) *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 500000"
              keyboardType="numeric"
              value={price}
              onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
            />
          </View>
        </View>

        {/* CONDITION */}
        <Text style={styles.label}>Tình trạng *</Text>
        <View style={[styles.row, { marginBottom: 16 }]}>
          <TouchableOpacity
            style={[styles.condBtn, condition === "used" && styles.condBtnActive]}
            onPress={() => setCondition("used")}
          >
            <Text style={[styles.condBtnText, condition === "used" && styles.condBtnTextActive]}>Đã sử dụng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.condBtn, condition === "new" && styles.condBtnActive]}
            onPress={() => setCondition("new")}
          >
            <Text style={[styles.condBtnText, condition === "new" && styles.condBtnTextActive]}>Mới</Text>
          </TouchableOpacity>
        </View>

        {/* DESCRIPTION */}
        <Text style={styles.label}>Mô tả sản phẩm</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Mô tả chi tiết tình trạng, phụ kiện..."
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* LOCATION */}
        <Text style={styles.label}>Địa điểm giao dịch</Text>
        <TextInput
          style={styles.input}
          placeholder="Quận/Huyện, Thành phố..."
          value={location}
          onChangeText={setLocation}
        />

        {/* SUBMIT */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#222" />
          ) : (
            <Text style={styles.submitBtnText}>LƯU THAY ĐỔI</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* CATEGORY MODAL */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Chọn danh mục</Text>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catOption, category === cat && styles.catOptionActive]}
              onPress={() => { setCategory(cat); setShowCategoryModal(false); }}
            >
              <Text style={[styles.catOptionText, category === cat && styles.catOptionTextActive]}>{cat}</Text>
              {category === cat && <Ionicons name="checkmark" size={18} color="#FFA500" />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#222" },
  scrollContent: { padding: 16, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: "700", color: "#444", marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#EBEBEB",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#222", marginBottom: 16,
  },
  textArea: { height: 120 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  pickerBox: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#EBEBEB",
    borderRadius: 12, paddingHorizontal: 14, height: 48,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16,
  },
  pickerText: { fontSize: 14, color: "#333" },
  condBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, marginRight: 10,
    backgroundColor: "#F0F0F0", alignItems: "center",
  },
  condBtnActive: { backgroundColor: "#FFC400" },
  condBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  condBtnTextActive: { color: "#222" },
  imageScroll: { flexDirection: "row", marginBottom: 20 },
  imageBox: { position: "relative", marginRight: 12 },
  previewImage: { width: 90, height: 90, borderRadius: 12, borderWidth: 1, borderColor: "#ddd" },
  removeImageBtn: { position: "absolute", top: -8, right: -8, zIndex: 1, backgroundColor: "#fff", borderRadius: 12 },
  addImageBtn: {
    width: 90, height: 90, borderRadius: 12,
    borderWidth: 2, borderColor: "#EBEBEB", borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa",
  },
  addImageText: { fontSize: 11, color: "#999", marginTop: 4, fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#FFC400", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 10,
    shadowColor: "#FFC400", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  submitBtnText: { fontSize: 15, fontWeight: "800", color: "#222" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#222", marginBottom: 14 },
  catOption: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  catOptionActive: { backgroundColor: "#FFF8E7", borderRadius: 10, paddingHorizontal: 10 },
  catOptionText: { fontSize: 15, color: "#444" },
  catOptionTextActive: { color: "#FFA500", fontWeight: "700" },
});
