import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export const requestPermission = async (
  type: "camera" | "mediaLibrary",
): Promise<boolean> => {
  if (type === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cho phép ứng dụng truy cập camera trong cài đặt.",
        [{ text: "OK" }],
      );
      return false;
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cho phép ứng dụng truy cập thư viện ảnh trong cài đặt.",
        [{ text: "OK" }],
      );
      return false;
    }
  }
  return true;
};
