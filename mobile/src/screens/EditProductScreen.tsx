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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import { API } from "../services/api";

export default function EditProductScreen({ route, navigation }: any) {
  const { productId } = route.params;

  const [image, setImage] = useState<any>(null);
  const [oldImage, setOldImage] = useState("");

  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("used");

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${productId}`);

      const p = res.data;

      setTitle(p.title);
      setDescription(p.description);
      setPrice(String(p.price));
      setCategory(p.categoryId);
      setCondition(p.condition);
      setLocation(p.location || "");
      setOldImage(p.image);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCategories = async () => {
    const res = await API.get("/categories");
    setCategories(res.data);
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

  const uploadImage = async (uri: string) => {
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const fileType = filename.endsWith("png") ? "image/png" : "image/jpeg";

    const formData = new FormData();

    formData.append("file", {
      uri,
      name: filename,
      type: fileType,
    } as any);

    formData.append("upload_preset", "mobile_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dfhu72t1o/image/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    const result = await res.json();

    return result.secure_url;
  };

  const handleUpdate = async () => {
    if (!title || !price || !description) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      let imageUrl = oldImage;

      if (image) {
        imageUrl = await uploadImage(image);
      }

      await API.put(`/products/${productId}`, {
        title,
        description,
        price,
        categoryId: category,
        condition,
        location,
        image: imageUrl,
      });

      Alert.alert("Thành công", "Cập nhật sản phẩm thành công");

      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert("Lỗi", "Không thể cập nhật");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Tiêu đề *</Text>

      <TextInput
        style={styles.inputBox}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Danh mục *</Text>

      <Dropdown
        style={styles.dropdown}
        data={categories}
        labelField="name"
        valueField="_id"
        value={category}
        onChange={(item) => setCategory(item._id)}
      />

      <Text style={styles.label}>Hình ảnh *</Text>

      <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
        {image || oldImage ? (
          <Image
            source={{ uri: image || oldImage }}
            style={styles.imagePreview}
          />
        ) : (
          <>
            <Ionicons name="images-outline" size={40} color="#F4A100" />
            <Text>Chọn ảnh</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Mô tả *</Text>

      <TextInput
        style={styles.textArea}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Giá *</Text>

      <TextInput
        style={styles.inputBox}
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.label}>Tình trạng</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            condition === "used" && styles.optionActive,
          ]}
          onPress={() => setCondition("used")}
        >
          <Text>Đã sử dụng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            condition === "new" && styles.optionActive,
          ]}
          onPress={() => setCondition("new")}
        >
          <Text>Mới</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.postButton} onPress={handleUpdate}>
        <Text style={styles.postText}>Cập nhật sản phẩm</Text>
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
