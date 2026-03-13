import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../context/authContext";
import { userService } from "../services/userService";
import { productService } from "../services/productService";

const GENDER_OPTIONS = ["Nam", "Nữ", "Khác"];

export default function ProfileScreen() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Edit Profile Modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
    gender: user?.gender || "",
    bio: user?.bio || "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Change Password Modal
  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ old: "", new: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Date Wheel Picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const parsedDob = editForm.dob ? editForm.dob.split("/") : [];
  const [pickerDay, setPickerDay] = useState(parsedDob[0] ? parseInt(parsedDob[0]) : 1);
  const [pickerMonth, setPickerMonth] = useState(parsedDob[1] ? parseInt(parsedDob[1]) : 1);
  const [pickerYear, setPickerYear] = useState(parsedDob[2] ? parseInt(parsedDob[2]) : 2000);

  useEffect(() => {
    loadMyProducts();
    // Sync edit form with latest user data
    if (user) {
      setEditForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        dob: user.dob || "",
        gender: user.gender || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const loadMyProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await productService.getMyProducts();
      setMyProducts(Array.isArray(data) ? data : []);
    } catch {
      setMyProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Validation helpers
  const validatePhone = (phone: string) => {
    if (!phone) return true; // optional
    return /^[0-9]{10}$/.test(phone.trim());
  };

  const validateDob = (dob: string) => {
    if (!dob) return true; // optional
    // Expect DD/MM/YYYY
    const parts = dob.split("/");
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year || year < 1900) return false;
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return false;
    // Not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const validatePassword = (pw: string) => {
    // Min 8 chars, has uppercase, lowercase, number, special char
    if (pw.length < 8) return { ok: false, msg: "Mật khẩu phải có ít nhất 8 ký tự" };
    if (!/[A-Z]/.test(pw)) return { ok: false, msg: "Mật khẩu phải có ít nhất 1 chữ hoa" };
    if (!/[a-z]/.test(pw)) return { ok: false, msg: "Mật khẩu phải có ít nhất 1 chữ thường" };
    if (!/[0-9]/.test(pw)) return { ok: false, msg: "Mật khẩu phải có ít nhất 1 chữ số" };
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw))
      return { ok: false, msg: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$...)" };
    return { ok: true, msg: "" };
  };

  // Upload Avatar
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền truy cập", "Vui lòng cho phép truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarLoading(true);
      try {
        const asset = result.assets[0];
        if (!asset.base64) {
          Alert.alert("❌ Lỗi", "Không đọc được ảnh. Vui lòng chọn ảnh khác.");
          return;
        }
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        const updatedUser = await userService.uploadAvatar(base64Uri);
        updateUser(updatedUser);
        Alert.alert("✅ Thành công", "Ảnh đại diện đã được cập nhật");
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "Không thể cập nhật ảnh";
        Alert.alert("❌ Lỗi", msg);
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  // Save Profile
  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) {
      Alert.alert("Lỗi", "Họ tên không được để trống");
      return;
    }
    if (editForm.phone && !validatePhone(editForm.phone)) {
      Alert.alert("Lỗi", "Số điện thoại phải có đúng 10 chữ số (VD: 0901234567)");
      return;
    }
    if (editForm.dob && !validateDob(editForm.dob)) {
      Alert.alert("Lỗi", "Ngày sinh không hợp lệ hoặc không được là ngày hiện tại/tương lai\n(Định dạng: DD/MM/YYYY)");
      return;
    }
    setEditLoading(true);
    try {
      const updatedUser = await userService.updateProfile(editForm);
      updateUser(updatedUser);
      setShowEdit(false);
      Alert.alert("✅ Thành công", "Thông tin đã được cập nhật");
    } catch (err: any) {
      Alert.alert("❌ Lỗi", err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setEditLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!pwForm.old || !pwForm.new || !pwForm.confirm) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (pwForm.new !== pwForm.confirm) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp");
      return;
    }
    const pwCheck = validatePassword(pwForm.new);
    if (!pwCheck.ok) {
      Alert.alert("Mật khẩu không hợp lệ", pwCheck.msg);
      return;
    }
    setPwLoading(true);
    try {
      await userService.changePassword(pwForm.old, pwForm.new);
      setShowPassword(false);
      setPwForm({ old: "", new: "", confirm: "" });
      Alert.alert("✅ Thành công", "Mật khẩu đã được thay đổi");
    } catch (err: any) {
      Alert.alert("❌ Lỗi", err?.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} tr`;
    return `${price.toLocaleString("vi-VN")} đ`;
  };

  const avatar = user?.avatar || null;
  const initials = (user?.fullName || "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HERO SECTION */}
      <LinearGradient colors={["#ff5900ff", "#ffaa00ff", "#fee647ff"]} style={styles.hero}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.8}>
          {avatarLoading ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.heroName}>{user?.fullName || "Người dùng"}</Text>
        <Text style={styles.heroEmail}>{user?.email || ""}</Text>

        {/* Quick stat row */}
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{myProducts.length}</Text>
            <Text style={styles.statLabel}>Tin đăng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {myProducts.filter((p) => p.status === "sold").length}
            </Text>
            <Text style={styles.statLabel}>Đã bán</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {myProducts.filter((p) => p.status === "active").length}
            </Text>
            <Text style={styles.statLabel}>Đang bán</Text>
          </View>
        </View>
      </LinearGradient>

      {/* PROFILE INFO CARD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setShowEdit(true)}
          >
            <Ionicons name="create-outline" size={16} color="#6C3DE0" />
            <Text style={styles.editBtnText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>

        <InfoRow icon="mail-outline" label="Email" value={user?.email} />
        <InfoRow icon="call-outline" label="Điện thoại" value={user?.phone || "Chưa cập nhật"} />
        <InfoRow icon="calendar-outline" label="Ngày sinh" value={user?.dob || "Chưa cập nhật"} />
        <InfoRow icon="person-outline" label="Giới tính" value={user?.gender || "Chưa cập nhật"} />
        {user?.bio ? (
          <InfoRow icon="chatbubble-outline" label="Giới thiệu" value={user.bio} />
        ) : null}
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPassword(true)}>
          <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#1976D2" />
          </View>
          <Text style={styles.actionText}>Đổi mật khẩu</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
            { text: "Hủy", style: "cancel" },
            { text: "Đăng xuất", style: "destructive", onPress: logout },
          ])}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#FFEBEE" }]}>
            <Ionicons name="log-out-outline" size={20} color="#E53935" />
          </View>
          <Text style={[styles.actionText, { color: "#E53935" }]}>Đăng xuất</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* MY PRODUCTS */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📦 Tin đã đăng</Text>
          <TouchableOpacity onPress={loadMyProducts}>
            <Ionicons name="refresh-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {loadingProducts ? (
          <ActivityIndicator color="#6C3DE0" style={{ marginVertical: 20 }} />
        ) : myProducts.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Ionicons name="cube-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Bạn chưa đăng tin nào</Text>
          </View>
        ) : (
          <FlatList
            data={myProducts}
            keyExtractor={(item) => item._id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productCard} activeOpacity={0.85}>
                <View style={styles.productImgBox}>
                  {item.images?.length > 0 ? (
                    <Image source={{ uri: item.images[0] }} style={styles.productImg} />
                  ) : (
                    <View style={[styles.productImg, styles.productImgFallback]}>
                      <Ionicons name="image-outline" size={28} color="#ccc" />
                    </View>
                  )}
                  <View style={[styles.statusBadge, item.status === "active" ? styles.statusActive : styles.statusSold]}>
                    <Text style={styles.statusText}>{item.status === "active" ? "Đang bán" : "Đã bán"}</Text>
                  </View>
                </View>
                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* ============ EDIT PROFILE MODAL ============ */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEdit(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalContainer}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>✏️ Chỉnh sửa hồ sơ</Text>

              <Text style={styles.inputLabel}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                value={editForm.fullName}
                onChangeText={(v) => setEditForm({ ...editForm, fullName: v })}
                placeholder="Nhập họ tên..."
              />

              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={[
                  styles.input,
                  editForm.phone && !validatePhone(editForm.phone) && styles.inputError,
                ]}
                value={editForm.phone}
                onChangeText={(v) => setEditForm({ ...editForm, phone: v.replace(/[^0-9]/g, "") })}
                placeholder="0901234567"
                keyboardType="phone-pad"
                maxLength={10}
              />
              {editForm.phone && !validatePhone(editForm.phone) && (
                <Text style={styles.hintError}>⚠️ Phải đúng 10 chữ số (hiện tại: {editForm.phone.length})</Text>
              )}

              <Text style={styles.inputLabel}>Ngày sinh</Text>
              <TouchableOpacity
                style={styles.dobSelector}
                onPress={() => {
                  // Init picker to current dob values
                  const parts = editForm.dob ? editForm.dob.split("/") : [];
                  setPickerDay(parts[0] ? parseInt(parts[0]) : 1);
                  setPickerMonth(parts[1] ? parseInt(parts[1]) : 1);
                  setPickerYear(parts[2] ? parseInt(parts[2]) : 2000);
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={18} color="#6C3DE0" />
                <Text style={editForm.dob ? styles.dobText : styles.dobPlaceholder}>
                  {editForm.dob || "Chọn ngày sinh"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#aaa" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Giới tính</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, editForm.gender === g && styles.genderBtnActive]}
                    onPress={() => setEditForm({ ...editForm, gender: g })}
                  >
                    <Text style={[styles.genderBtnText, editForm.gender === g && styles.genderBtnTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Giới thiệu</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                value={editForm.bio}
                onChangeText={(v) => setEditForm({ ...editForm, bio: v })}
                placeholder="Vài dòng giới thiệu về bạn..."
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.saveBtn, editLoading && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ CHANGE PASSWORD MODAL ============ */}
      <Modal visible={showPassword} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPassword(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalContainer}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>🔒 Đổi mật khẩu</Text>

            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={pwForm.old}
                onChangeText={(v) => setPwForm({ ...pwForm, old: v })}
                secureTextEntry={!showOld}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowOld(!showOld)}>
                <Ionicons name={showOld ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, marginBottom: 0 },
                  pwForm.new.length > 0 && !validatePassword(pwForm.new).ok && styles.inputError,
                ]}
                value={pwForm.new}
                onChangeText={(v) => setPwForm({ ...pwForm, new: v })}
                secureTextEntry={!showNew}
                placeholder="Ít nhất 8 ký tự Aa1!..."
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            {pwForm.new.length > 0 && !validatePassword(pwForm.new).ok ? (
              <Text style={styles.hintError}>⚠️ {validatePassword(pwForm.new).msg}</Text>
            ) : pwForm.new.length > 0 ? (
              <Text style={[styles.hintInfo, { color: "#2E7D32" }]}>✅ Mật khẩu hợp lệ</Text>
            ) : (
              <Text style={styles.hintInfo}>Cần: 8+ ký tự, chữ hoa, thường, số, ký tự đặc biệt</Text>
            )}

            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={pwForm.confirm}
                onChangeText={(v) => setPwForm({ ...pwForm, confirm: v })}
                secureTextEntry={!showConfirm}
                placeholder="Nhập lại mật khẩu mới"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, pwLoading && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={pwLoading}
            >
              {pwLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Xác nhận đổi mật khẩu</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPassword(false)}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ DATE WHEEL PICKER MODAL ============ */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)} />
        <View style={styles.datePickerSheet}>
          <View style={styles.modalHandle} />
          {/* Header */}
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.datePickerCancel}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.datePickerTitle}>📅 Ngày sinh</Text>
            <TouchableOpacity
              onPress={() => {
                // Validate before confirm
                const day = String(pickerDay).padStart(2, "0");
                const month = String(pickerMonth).padStart(2, "0");
                const year = String(pickerYear);
                const dobStr = `${day}/${month}/${year}`;
                setEditForm({ ...editForm, dob: dobStr });
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.datePickerDone}>Xong</Text>
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={styles.datePickerPreview}>
            <Text style={styles.datePickerPreviewText}>
              {String(pickerDay).padStart(2, "0")} / {String(pickerMonth).padStart(2, "0")} / {pickerYear}
            </Text>
          </View>

          {/* Wheel columns */}
          <View style={styles.datePickerWheels}>
            {/* Highlight bar */}
            <View style={styles.wheelHighlight} pointerEvents="none" />

            {/* DAY column */}
            <WheelColumn
              items={Array.from(
                { length: new Date(pickerYear, pickerMonth, 0).getDate() },
                (_, i) => String(i + 1).padStart(2, "0")
              )}
              selected={Math.min(pickerDay, new Date(pickerYear, pickerMonth, 0).getDate()) - 1}
              onSelect={(i) => setPickerDay(i + 1)}
              label="Ngày"
            />

            {/* MONTH column */}
            <WheelColumn
              items={[
                "01 - T.1", "02 - T.2", "03 - T.3", "04 - T.4",
                "05 - T.5", "06 - T.6", "07 - T.7", "08 - T.8",
                "09 - T.9", "10 - T.10", "11 - T.11", "12 - T.12",
              ]}
              selected={pickerMonth - 1}
              onSelect={(i) => {
                const newMonth = i + 1;
                setPickerMonth(newMonth);
                const maxDays = new Date(pickerYear, newMonth, 0).getDate();
                if (pickerDay > maxDays) setPickerDay(maxDays);
              }}
              label="Tháng"
            />

            {/* YEAR column */}
            <WheelColumn
              items={Array.from(
                { length: new Date().getFullYear() - 1900 },
                (_, i) => String(1901 + i)
              ).reverse()}
              selected={(() => {
                const years = Array.from(
                  { length: new Date().getFullYear() - 1900 },
                  (_, i) => new Date().getFullYear() - 1 - i
                );
                const idx = years.indexOf(pickerYear);
                return idx >= 0 ? idx : 0;
              })()}
              onSelect={(i) => {
                const newYear = new Date().getFullYear() - 1 - i;
                setPickerYear(newYear);
                const maxDays = new Date(newYear, pickerMonth, 0).getDate();
                if (pickerDay > maxDays) setPickerDay(maxDays);
              }}
              label="Năm"
            />
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Reusable info row
function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#6C3DE0" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ============ WHEEL COLUMN COMPONENT ============
const ITEM_H = 46;
const VISIBLE_ITEMS = 5;
const WHEEL_H = ITEM_H * VISIBLE_ITEMS;

function WheelColumn({
  items,
  selected,
  onSelect,
  label,
}: {
  items: string[];
  selected: number;
  onSelect: (index: number) => void;
  label: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const currentIdx = useRef(selected);

  useEffect(() => {
    // Scroll to selected on mount
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selected * ITEM_H,
        animated: false,
      });
      currentIdx.current = selected;
    }, 80);
    return () => clearTimeout(timeout);
  }, []);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const idx = Math.round(offsetY / ITEM_H);
    const clampedIdx = Math.max(0, Math.min(idx, items.length - 1));
    if (clampedIdx !== currentIdx.current) {
      currentIdx.current = clampedIdx;
      onSelect(clampedIdx);
    }
    // Snap to exact position
    scrollRef.current?.scrollTo({ y: clampedIdx * ITEM_H, animated: true });
  };

  return (
    <View style={styles.wheelCol}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <View style={{ height: WHEEL_H, overflow: "hidden" }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          contentContainerStyle={{
            paddingTop: ITEM_H * 2,
            paddingBottom: ITEM_H * 2,
          }}
          scrollEventThrottle={16}
        >
          {items.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.wheelItem}
              onPress={() => {
                currentIdx.current = idx;
                onSelect(idx);
                scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.wheelItemText,
                  idx === currentIdx.current && styles.wheelItemTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Top fade */}
        <View style={styles.wheelFadeTop} pointerEvents="none" />
        {/* Bottom fade */}
        <View style={styles.wheelFadeBottom} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  // Hero
  hero: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 30,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3, borderColor: "#fff",
    justifyContent: "center", alignItems: "center",
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: "#fff" },
  avatarEditBadge: {
    position: "absolute", bottom: 2, right: 2,
    backgroundColor: "#6C3DE0", borderRadius: 12,
    padding: 5, borderWidth: 2, borderColor: "#fff",
  },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  heroEmail: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 20 },
  statRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20 },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  // Cards
  card: {
    backgroundColor: "#fff", borderRadius: 20,
    margin: 16, marginTop: -16,
    padding: 20,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 5,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#222" },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F3EEFF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  editBtnText: { fontSize: 13, fontWeight: "700", color: "#6C3DE0" },

  // Info rows
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F3EEFF", justifyContent: "center", alignItems: "center", marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#aaa", fontWeight: "600", marginBottom: 2 },
  infoValue: { fontSize: 14, color: "#333", fontWeight: "600" },

  // Actions
  actionsCard: {
    backgroundColor: "#fff", borderRadius: 20,
    marginHorizontal: 16, marginBottom: 16,
    padding: 6,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#333" },
  actionDivider: { height: 1, backgroundColor: "#F5F5F5", marginHorizontal: 14 },

  // Products section
  productsSection: { marginHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#222" },
  emptyProducts: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 14, color: "#bbb" },

  productCard: {
    width: "48%", backgroundColor: "#fff", borderRadius: 14, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, overflow: "hidden",
  },
  productImgBox: { position: "relative" },
  productImg: { width: "100%", height: 100 },
  productImgFallback: { justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  statusBadge: { position: "absolute", top: 6, right: 6, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  statusActive: { backgroundColor: "rgba(46,125,50,0.9)" },
  statusSold: { backgroundColor: "rgba(198,40,40,0.9)" },
  statusText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  productTitle: { fontSize: 12, fontWeight: "600", color: "#222", padding: 8, paddingBottom: 2, lineHeight: 17 },
  productPrice: { fontSize: 13, fontWeight: "800", color: "#E53935", paddingHorizontal: 8, paddingBottom: 10 },

  // Modal
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: "90%",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#222", marginBottom: 20 },

  inputLabel: { fontSize: 12, fontWeight: "700", color: "#888", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#F7F7F7", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#333", marginBottom: 4,
    borderWidth: 1.5, borderColor: "#EBEBEB",
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  eyeBtn: { padding: 12, backgroundColor: "#F7F7F7", borderRadius: 12, borderWidth: 1.5, borderColor: "#EBEBEB" },

  genderRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#ddd", alignItems: "center" },
  genderBtnActive: { borderColor: "#6C3DE0", backgroundColor: "#F3EEFF" },
  genderBtnText: { fontSize: 14, fontWeight: "600", color: "#888" },
  genderBtnTextActive: { color: "#6C3DE0" },

  saveBtn: {
    backgroundColor: "#6C3DE0", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 20,
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  cancelBtn: { paddingVertical: 14, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#888", fontSize: 15, fontWeight: "600" },

  inputError: { borderColor: "#E53935", backgroundColor: "#FFF5F5" },
  hintError: { fontSize: 11, color: "#E53935", marginTop: 2, marginBottom: 4, marginLeft: 4 },
  hintInfo: { fontSize: 11, color: "#888", marginTop: 3, marginLeft: 4 },

  // DOB Selector Button
  dobSelector: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F7F7F7", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: "#EBEBEB",
    marginBottom: 4,
  },
  dobText: { flex: 1, fontSize: 14, color: "#333", fontWeight: "600" },
  dobPlaceholder: { flex: 1, fontSize: 14, color: "#aaa" },

  // Date Picker Sheet
  datePickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 30, paddingHorizontal: 16,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  datePickerHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 12, marginBottom: 4,
  },
  datePickerCancel: { fontSize: 16, color: "#999", fontWeight: "600" },
  datePickerTitle: { fontSize: 16, fontWeight: "800", color: "#222" },
  datePickerDone: { fontSize: 16, color: "#6C3DE0", fontWeight: "800" },
  datePickerPreview: {
    alignItems: "center", paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: "#F3EEFF", borderRadius: 12,
  },
  datePickerPreviewText: { fontSize: 22, fontWeight: "800", color: "#6C3DE0", letterSpacing: 2 },

  // Wheels
  datePickerWheels: {
    flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start",
    position: "relative",
  },
  wheelHighlight: {
    position: "absolute",
    top: "50%",
    left: 8, right: 8,
    height: 46,
    marginTop: -23,
    backgroundColor: "rgba(108,61,224,0.08)",
    borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(108,61,224,0.2)",
    zIndex: 1,
  },
  wheelCol: { flex: 1, alignItems: "center" },
  wheelLabel: { fontSize: 11, fontWeight: "700", color: "#6C3DE0", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  wheelItem: { height: 46, justifyContent: "center", alignItems: "center", width: "100%" },
  wheelItemText: { fontSize: 15, color: "#bbb", fontWeight: "500", textAlign: "center" },
  wheelItemTextSelected: { fontSize: 19, color: "#222", fontWeight: "800" },
  wheelFadeTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 80,
    zIndex: 2,
    backgroundColor: "transparent",
    // Simulated gradient via borders
    borderBottomWidth: 0,
  },
  wheelFadeBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
    zIndex: 2,
    backgroundColor: "transparent",
  },
});
