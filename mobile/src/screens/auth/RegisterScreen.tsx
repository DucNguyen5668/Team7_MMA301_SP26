import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/authContext";
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen() {
  const { register } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation chặt chẽ hơn
    if (!fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu");
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      await register(fullName.trim(), email.trim(), password.trim());
      Alert.alert("Đăng ký thành công");
    } catch (error: any) {
      // Lấy message cụ thể từ backend nếu có
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#A020F0", "#6A0DAD"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.title}>Tạo Tài Khoản</Text>
              <Text style={styles.subtitle}>Đăng ký để bắt đầu mua bán</Text>

              {/* Full Name */}
              <Text style={styles.label}>Họ và tên</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#999" />
                <TextInput
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#999" />
                <TextInput
                  placeholder="Nhập email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" />
                <TextInput
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" />
                <TextInput
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#A020F0", "#6A0DAD"]}
                  style={styles.signUpGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.signUpText}>
                      Đăng Ký <Ionicons name="arrow-forward" size={16} />
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <TouchableOpacity>
                <Text style={styles.loginText}>
                  Đã có tài khoản?{" "}
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    textAlign: "center",
    color: "#777",
    marginBottom: 32,
    fontSize: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "600",
    color: "#444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  signUpButton: {
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  signUpText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  loginText: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
  },
  loginLink: {
    color: "#A020F0",
    fontWeight: "bold",
  },
});
