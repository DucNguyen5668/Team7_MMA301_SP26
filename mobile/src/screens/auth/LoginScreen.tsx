import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/authContext";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#FFD500", "#FFC200"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.innerContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Chào mừng trở lại!</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                placeholder="Nhập email"
                style={styles.input}
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#FFD500", "#FFC200"]}
                style={styles.signInGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#333" size="small" />
                ) : (
                  <Text style={styles.signInText}>
                    Đăng Nhập{" "}
                    <Ionicons name="arrow-forward" size={16} color="#333" />
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.signupText}>
              Chưa có tài khoản?{" "}
              <Text
                style={styles.signupLink}
                onPress={() => navigation.navigate("Register")}
              >
                Đăng ký
              </Text>
            </Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
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
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    textAlign: "center",
    color: "#777",
    marginBottom: 28,
    fontSize: 15,
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  forgot: {
    color: "#FFD500",
    textAlign: "right",
    marginBottom: 20,
    fontWeight: "600",
  },
  signInButton: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e6c000",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  signInText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 17,
  },
  signupText: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
  },
  signupLink: {
    color: "#FFD500",
    fontWeight: "bold",
  },
});
