import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image,
  Keyboard,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API } from "../../services/api";

export interface UserResult {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

interface SearchUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: UserResult) => void; // chỉ trả user, không tạo conv
}

export default function SearchUserModal({
  visible,
  onClose,
  onSelectUser,
}: SearchUserModalProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setQuery("");
      setUsers([]);
      setError(null);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => inputRef.current?.focus());
    } else {
      slideAnim.setValue(50);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const searchUsers = useCallback(async (text: string) => {
    if (!text.trim()) {
      setUsers([]);
      return;
    }
    try {
      setSearching(true);
      setError(null);
      const { data } = await API.get("/conversations/search", {
        params: { q: text.trim() },
      });
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tìm kiếm");
      setUsers([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(query), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  const handleSelectUser = (user: UserResult) => {
    Keyboard.dismiss();
    onClose();
    onSelectUser(user);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const renderUser = ({ item }: { item: UserResult }) => {
    const avatarUrl =
      item.avatar || `https://cdn-icons-png.flaticon.com/128/847/847969.png`;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleSelectUser(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.fullName}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      <Animated.View
        style={[
          styles.sheet,
          { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handleBar} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tìm người dùng</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <Ionicons
            name="search"
            size={18}
            color="#aaa"
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Nhập tên hoặc email..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={15} color="#FF5722" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {searching ? (
                <ActivityIndicator size="large" color="#FDD835" />
              ) : query.trim() ? (
                <>
                  <Ionicons name="person-outline" size={52} color="#ddd" />
                  <Text style={styles.emptyText}>
                    Không tìm thấy người dùng
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="search-outline" size={52} color="#ddd" />
                  <Text style={styles.emptyText}>
                    Nhập tên hoặc email để tìm kiếm
                  </Text>
                </>
              )}
            </View>
          }
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#222" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
  },
  errorText: { fontSize: 13, color: "#FF5722", flex: 1 },
  list: { flex: 1 },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 14,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  avatar: { width: 48, height: 48 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  userEmail: { fontSize: 13, color: "#888", marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: "#bbb", textAlign: "center" },
});
