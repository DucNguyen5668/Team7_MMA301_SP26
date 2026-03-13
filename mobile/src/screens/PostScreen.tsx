import React, { useState, useEffect, useContext } from "react";
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
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import { API } from "../services/api";
import { AuthContext } from "../context/authContext";
import { generateDescription } from "../services/geminiService";

export default function PostProductScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("used");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data || []);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      Alert.alert("Lỗi", "Không thể tải danh mục");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Cần quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // Fix deprecated: dùng array string
      allowsEditing: false,
      quality: 0.8, // Giảm chất lượng để upload/base64 nhanh hơn
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDescription(""); // Reset mô tả khi chọn ảnh mới
    }
  };

  const uploadImage = async (uri: string) => {
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const fileType = filename.endsWith("png") ? "image/png" : "image/jpeg";

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: filename || "photo.jpg",
      type: fileType,
    } as any);
    formData.append("upload_preset", "mobile_upload");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dfhu72t1o/image/upload",
      {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Cloudinary error:", errorText);
      throw new Error("Upload ảnh thất bại");
    }

    const result = await response.json();
    return result.secure_url;
  };

  const handleGenerateDescription = async () => {
    if (!image) {
      Alert.alert("Lỗi", "Vui lòng chọn ảnh trước khi dùng AI");
      return;
    }

    setIsGenerating(true);
    try {
      const aiDesc = await generateDescription(image);
      setDescription(aiDesc);
    } catch (err: any) {
      Alert.alert("Lỗi AI", err.message || "Không thể tạo mô tả");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (
      !title.trim() ||
      !category ||
      !image ||
      !description.trim() ||
      !price.trim() ||
      !location.trim()
    ) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Lỗi", "Giá phải là số lớn hơn 0");
      return;
    }

    if (!user) {
      Alert.alert("Lỗi", "Bạn chưa đăng nhập");
      return;
    }

    setIsLoading(true);
    try {
      const imageUrl = await uploadImage(image);
      await API.post("/products", {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        condition,
        ownerId: user.id,
        categoryId: category,
        image: imageUrl,
        location: location.trim(),
      });

      Alert.alert("Thành công", "Đăng tin thành công!");
      // Optional: reset form hoặc navigate về home
    } catch (error: any) {
      console.error("Lỗi đăng tin:", error);
      Alert.alert("Lỗi", "Không thể đăng tin. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Tiêu đề */}
        <Text style={styles.label}>
          Tiêu đề <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Ví dụ: iPhone 13 Pro Max 256GB"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Danh mục */}
        <Text style={styles.label}>
          Danh mục <Text style={styles.required}>*</Text>
        </Text>
        <Dropdown
          style={styles.dropdown}
          data={categories}
          labelField="name"
          valueField="_id"
          placeholder="Chọn danh mục"
          value={category}
          onChange={(item) => setCategory(item._id)}
          maxHeight={300}
        />

        {/* Ảnh */}
        <Text style={styles.label}>
          Hình ảnh <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="images-outline" size={40} color="#F4A100" />
              <Text style={styles.addText}>Thêm ảnh (tối đa 1 ảnh)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Mô tả + AI */}
        <Text style={styles.label}>
          Mô tả <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.textArea}>
          <TextInput
            multiline
            numberOfLines={8}
            placeholder="Mô tả chi tiết sản phẩm..."
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            maxLength={1500}
            editable={!isGenerating}
          />
          <TouchableOpacity
            style={[styles.aiButton, isGenerating && styles.aiButtonDisabled]}
            onPress={handleGenerateDescription}
            disabled={isGenerating || !image}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#F4A100" />
                <Text style={styles.aiText}>AI viết giúp</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <Text
          style={[
            styles.counter,
            description.length > 1400 && { color: "red" },
          ]}
        >
          {description.length}/1500 ký tự
        </Text>

        {/* Giá */}
        <Text style={styles.label}>
          Giá bán <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Ví dụ: 15000000"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        {/* Địa chỉ */}
        <Text style={styles.label}>
          Địa chỉ <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
          value={location}
          onChangeText={setLocation}
        />

        {/* Tình trạng */}
        <Text style={styles.label}>
          Tình trạng <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              condition === "used" && styles.optionActive,
            ]}
            onPress={() => setCondition("used")}
          >
            <Text
              style={
                condition === "used"
                  ? styles.optionTextActive
                  : styles.optionText
              }
            >
              Đã sử dụng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              condition === "new" && styles.optionActive,
            ]}
            onPress={() => setCondition("new")}
          >
            <Text
              style={
                condition === "new"
                  ? styles.optionTextActive
                  : styles.optionText
              }
            >
              Mới
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nút đăng */}
        <TouchableOpacity
          style={[styles.postButton, isLoading && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.postText}>Đăng tin</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F5F5" },
  container: { flex: 1, padding: 16, backgroundColor: "#F5F5F5" },

  label: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  required: { color: "#FF3B30" },

  inputBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },

  dropdown: {
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 14,
  },

  imageBox: {
    height: 180,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    borderWidth: 2,
    borderColor: "#F4A100",
    borderStyle: "dashed",
  },
  placeholder: { alignItems: "center" },
  addText: { marginTop: 8, color: "#F4A100", fontWeight: "600", fontSize: 15 },

  imagePreview: { width: "100%", height: "100%", borderRadius: 12 },

  textArea: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: 160,
  },
  input: { fontSize: 16, textAlignVertical: "top", minHeight: 120 },

  aiButton: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#FFF3D6",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 12,
    alignItems: "center",
  },
  aiButtonDisabled: { opacity: 0.6 },
  aiText: { fontSize: 14, color: "#F4A100", marginLeft: 6, fontWeight: "600" },

  counter: { textAlign: "right", color: "#888", marginTop: 4, fontSize: 13 },

  row: { flexDirection: "row", marginVertical: 12 },
  optionButton: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginRight: 12,
  },
  optionActive: { backgroundColor: "#FFD400" },
  optionText: { color: "#555", fontSize: 15 },
  optionTextActive: { color: "#000", fontWeight: "700", fontSize: 15 },

  postButton: {
    backgroundColor: "#FFD400",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  postButtonDisabled: { opacity: 0.7 },
  postText: { fontWeight: "bold", fontSize: 18, color: "#000" },
});
