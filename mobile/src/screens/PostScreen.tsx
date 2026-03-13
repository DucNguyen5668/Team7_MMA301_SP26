import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { generateDescriptionFromImage } from "../services/geminiService";
import { productService } from "../services/productService";
import { useNavigation } from "@react-navigation/native";

const CATEGORIES = [
  "Bất động sản",
  "Xe cộ",
  "Thú cưng",
  "Đồ gia dụng",
  "Việc làm",
  "Điện tử",
  "Khác",
];

export default function PostScreen() {
  const navigation = useNavigation();

  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Danh mục");
  const [description, setDescription] = useState("");
  const [locationStr, setLocationStr] = useState("");

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Chọn ảnh
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh để đăng tin.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets
        .filter((a) => a.base64)
        .map((a) => `data:image/jpeg;base64,${a.base64}`);
      setImages([...images, ...newImages].slice(0, 5)); // Max 5 hình
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // AI viết mô tả
  const handleAIGenerate = async () => {
    if (images.length === 0) {
      Alert.alert("Chưa có ảnh", "Vui lòng chọn ít nhất 1 ảnh để AI có thể nhìn thấy sản phẩm nhé!");
      return;
    }

    setAiLoading(true);
    try {
      const desc = await generateDescriptionFromImage(images[0], title);
      if (desc) {
        setDescription(desc);
      } else {
        Alert.alert("Lỗi AI", "AI không thể sinh văn bản lúc này. Vui lòng thử lại.");
      }
    } catch (error) {
      Alert.alert("Lỗi kết nối", "Có lỗi xảy ra khi gọi AI.");
    } finally {
      setAiLoading(false);
    }
  };

  // Lấy vị trí GPS
  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Thiếu quyền", "Vui lòng cấp quyền định vị GPS để tự động lấy địa chỉ.");
        return;
      }

      setLocationStr("Đang dò tìm vị trí...");
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });

      if (address) {
        const parts = [address.street, address.subregion, address.region, address.city]
          .filter(Boolean)
          .join(", ");
        setLocationStr(parts || "Không thể xác định địa chỉ cụ thể");
      } else {
        setLocationStr("Không thể giải mã tọa độ.");
      }
    } catch (error) {
      setLocationStr("");
      Alert.alert("Lỗi GPS", "Không thể lấy vị trí hiện tại.");
    }
  };

  // Nút đăng
  const handlePost = async () => {
    if (!title || !price || category === "Danh mục") {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập điền Tiêu đề, Giá và Danh mục cho sản phẩm.");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Thiếu ảnh", "Vui lòng tải lên ít nhất 1 ảnh.");
      return;
    }

    setLoading(true);
    try {
      await productService.createProduct({
        title,
        price: Number(price),
        category,
        description,
        location: locationStr,
        images,
      });
      
      Alert.alert("Thành công", "Đã đăng tin rao vặt thành công!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setTitle(""); setPrice(""); setCategory("Danh mục");
            setDescription(""); setLocationStr(""); setImages([]);
            navigation.navigate("Home" as never);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi đăng tin", error.response?.data?.message || "Có lỗi xảy ra, thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFD500", "#FFA500"]} style={styles.header}>
        <Text style={styles.headerTitle}>Đăng tin mới</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Photos */}
        <Text style={styles.label}>Hình ảnh ({images.length}/5) *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imageBox}>
              <Image source={{ uri: img }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={32} color="#999" />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Title */}
        <Text style={styles.label}>Tiêu đề *</Text>
        <TextInput
          style={styles.input}
          placeholder="Tên sản phẩm (VD: iPhone 14 Pro Max cũ)"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Category & Price */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Danh mục *</Text>
            <TouchableOpacity style={styles.pickerBox} onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.pickerText, category !== "Danh mục" && { color: "#333" }]}>
                {category}
              </Text>
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
              onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ""))}
            />
          </View>
        </View>

        {/* Description + AI Button */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Mô tả sản phẩm</Text>
          <TouchableOpacity onPress={handleAIGenerate} disabled={aiLoading} style={styles.aiBtn}>
            {aiLoading ? (
              <ActivityIndicator size="small" color="#6C3DE0" />
            ) : (
              <>
                <Ionicons name="sparkles" size={14} color="#6C3DE0" />
                <Text style={styles.aiBtnText}>AI Viết Dùm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Mô tả chi tiết tình trạng, xuất xứ, phụ kiện đi kèm..."
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* Location GPS */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Địa điểm giao dịch</Text>
          <TouchableOpacity onPress={handleGetLocation} style={styles.gpsBtn}>
            <Ionicons name="location-outline" size={14} color="#007AFF" />
            <Text style={styles.gpsBtnText}>Lấy vị trí</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Quận/Huyện, Thành phố..."
          value={locationStr}
          onChangeText={setLocationStr}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handlePost}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.submitBtnText}>ĐĂNG TIN</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Chọn danh mục</Text>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catOption, category === cat && styles.catOptionActive]}
              onPress={() => {
                setCategory(cat);
                setShowCategoryModal(false);
              }}
            >
              <Text style={[styles.catOptionText, category === cat && styles.catOptionTextActive]}>
                {cat}
              </Text>
              {category === cat && <Ionicons name="checkmark" size={18} color="#FFA500" />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  header: { 
    paddingTop: Platform.OS === "ios" ? 50 : 40, 
    paddingBottom: 16, 
    paddingHorizontal: 20,
    alignItems: "center"
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#222" },
  
  scrollContent: { padding: 16, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: "700", color: "#444", marginBottom: 6 },
  
  input: {
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#EBEBEB",
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#222",
    marginBottom: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  pickerBox: {
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#EBEBEB",
    borderRadius: 12,
    paddingHorizontal: 14, height: 45,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16,
  },
  pickerText: { fontSize: 14, color: "#999" },
  
  textArea: { height: 120 },

  // Images
  imageScroll: { flexDirection: "row", marginBottom: 20 },
  imageBox: { position: "relative", marginRight: 12 },
  previewImage: { width: 90, height: 90, borderRadius: 12, borderWidth: 1, borderColor: "#ddd" },
  removeImageBtn: { position: "absolute", top: -8, right: -8, zIndex: 1, backgroundColor: "#fff", borderRadius: 12 },
  addImageBtn: {
    width: 90, height: 90, borderRadius: 12,
    borderWidth: 2, borderColor: "#EBEBEB", borderStyle: "dashed",
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#fafafa",
  },
  addImageText: { fontSize: 11, color: "#999", marginTop: 4, fontWeight: "600" },

  // AI & GPS Buttons Row
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  aiBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F3EEFF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  aiBtnText: { color: "#6C3DE0", fontSize: 11, fontWeight: "700" },
  gpsBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#E3F2FD", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  gpsBtnText: { color: "#007AFF", fontSize: 11, fontWeight: "700" },

  // Submit
  submitBtn: {
    backgroundColor: "#FFC400",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#FFC400", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  submitBtnText: { fontSize: 15, fontWeight: "800", color: "#222" },

  // Modal
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
