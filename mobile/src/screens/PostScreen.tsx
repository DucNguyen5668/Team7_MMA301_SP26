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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import { API } from "../services/api";
import { AuthContext } from "../context/authContext";

export default function PostProductScreen() {
  const [image, setImage] = useState<any>(null);
  const [description, setDescription] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState(null);
  const { user } = useContext(AuthContext);

  // NEW FIELDS
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [sellerType, setSellerType] = useState("personal");
  const [condition, setCondition] = useState("used");

  useEffect(() => {
    fetchCategories();
  }, []);

  const uploadImage = async (uri: string) => {
    try {
      // Lấy tên file và loại từ uri (tốt hơn hard-code)
      const filename = uri.substring(uri.lastIndexOf("/") + 1);
      const fileType = filename.endsWith("png") ? "image/png" : "image/jpeg";

      const formData = new FormData();

      formData.append("file", {
        uri: uri,
        name: filename || "photo.jpg",
        type: fileType,
      } as any);

      formData.append("upload_preset", "mobile_upload");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dfhu72t1o/image/upload",
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data", // một số trường hợp cần thêm header này
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Cloudinary error response:", errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Cloudinary success:", result);

      return result.secure_url;
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Lỗi upload ảnh", "Không thể tải ảnh lên. Vui lòng thử lại.");
      throw error;
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!title || !category || !image || !description || !price) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (!user) {
      Alert.alert("Bạn chưa đăng nhập");
      return;
    }

    const imageUrl = await uploadImage(image);
    console.log("IMAGE URL:", imageUrl);

    try {
      await API.post("/products", {
        title,
        description,
        price,
        condition,
        ownerId: user.id,
        categoryId: category,
        image: imageUrl,
      });

      Alert.alert("Thành công", "Đăng tin thành công");
    } catch (error) {
      console.log(error);
      Alert.alert("Lỗi", "Không thể đăng tin");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* TITLE */}
      <Text style={styles.label}>
        Tiêu đề tin đăng <Text style={styles.required}>*</Text>
      </Text>

      <TextInput
        style={styles.inputBox}
        placeholder="Nhập tiêu đề"
        value={title}
        onChangeText={setTitle}
      />

      {/* CATEGORY */}
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
        onChange={(item) => {
          setCategory(item._id);
        }}
      />

      {/* IMAGE */}
      <Text style={styles.label}>
        Hình ảnh/Video <Text style={styles.required}>*</Text>
      </Text>

      <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <>
            <Ionicons name="images-outline" size={40} color="#F4A100" />
            <Text style={styles.addText}>Thêm ảnh/video</Text>
          </>
        )}
      </TouchableOpacity>

      {/* DESCRIPTION */}
      <Text style={styles.label}>
        Mô tả tin đăng <Text style={styles.required}>*</Text>
      </Text>

      <View style={styles.textArea}>
        <TextInput
          multiline
          numberOfLines={6}
          placeholder="Mô tả tin đăng"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />
        <TouchableOpacity style={styles.aiButton}>
          <Ionicons name="sparkles" size={16} color="#000" />
          <Text style={styles.aiText}> AI viết giúp</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.counter}>{description.length}/1500 ký tự</Text>

      {/* PRICE */}
      <Text style={styles.label}>
        Giá bán <Text style={styles.required}>*</Text>
      </Text>

      <TextInput
        style={styles.inputBox}
        placeholder="Nhập giá"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      {/* LOCATION */}
      <Text style={styles.label}>
        Địa chỉ <Text style={styles.required}>*</Text>
      </Text>

      <TextInput
        style={styles.inputBox}
        placeholder="Nhập địa chi"
        value={location}
        onChangeText={setLocation}
      />

      {/* CONDITION */}
      <Text style={styles.label}>Tình trạng *</Text>

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
              condition === "used" ? styles.optionTextActive : styles.optionText
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
              condition === "new" ? styles.optionTextActive : styles.optionText
            }
          >
            Mới
          </Text>
        </TouchableOpacity>
      </View>

      {/* POST BUTTON */}
      <TouchableOpacity style={styles.postButton} onPress={handlePost}>
        <Text style={styles.postText}>Đăng tin</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 15,
  },
  aiButton: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#eee",
    padding: 6,
    borderRadius: 15,
    marginTop: 10,
  },

  aiText: {
    fontSize: 13,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
  },

  required: {
    color: "red",
  },

  inputBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  dropdown: {
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    marginBottom: 15,
  },

  optionButton: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
  },

  optionActive: {
    backgroundColor: "#FFD400",
  },

  optionText: {
    color: "#555",
  },

  optionTextActive: {
    fontWeight: "600",
  },

  imageBox: {
    height: 140,
    backgroundColor: "#FFF3D6",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  addText: {
    marginTop: 5,
    color: "#F4A100",
    fontWeight: "600",
  },

  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },

  textArea: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
  },

  input: {
    height: 120,
    textAlignVertical: "top",
  },

  counter: {
    textAlign: "right",
    color: "#999",
    marginTop: 5,
  },

  postButton: {
    backgroundColor: "#FFD400",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 30,
  },

  postText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
