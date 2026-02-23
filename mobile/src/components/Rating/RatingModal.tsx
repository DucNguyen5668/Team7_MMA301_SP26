import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "./StarRating";
import { API } from "../../services/api";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  user: {
    id: string; 
    name: string;
    avatar: string;
  };
  conversationId: string;
}

const ratingLabels = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];

export default function RatingModal({
  visible,
  onClose,
  onSubmitSuccess,
  user,
  conversationId,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;

    try {
      setSubmitting(true);
      await API.post("/ratings", {
        ratedUserId: user.id,
        conversationId,
        rating,
        review: review.trim(),
      });

      // Reset state
      setRating(0);
      setReview("");
      onClose();
      onSubmitSuccess?.();

      Alert.alert("Thành công", "Đánh giá của bạn đã được gửi!");
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Không thể gửi đánh giá. Thử lại sau.";
      Alert.alert("Lỗi", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return; // prevent closing while submitting
    setRating(0);
    setReview("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Đánh giá người bán</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                disabled={submitting}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
              <View style={styles.userDetails}>
                <Text style={styles.fullName}>{user.name}</Text>
              </View>
            </View>

            {/* Star Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                Bạn đánh giá thế nào về người bán?
              </Text>
              <View style={styles.starsContainer}>
                <StarRating
                  rating={rating}
                  size={40}
                  interactive={true}
                  onRate={setRating}
                />
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>{ratingLabels[rating]}</Text>
              )}
            </View>

            {/* Review Input */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>
                Nhận xét của bạn (không bắt buộc)
              </Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Chia sẻ trải nghiệm của bạn với người bán này..."
                placeholderTextColor="#999"
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (rating === 0 || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#222" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    rating === 0 && styles.submitButtonTextDisabled,
                  ]}
                >
                  Gửi đánh giá
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  closeButton: {
    padding: 4,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
    marginBottom: 12,
  },
  starsContainer: {
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FDD835",
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    color: "#222",
  },
  submitButton: {
    backgroundColor: "#FDD835",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  submitButtonTextDisabled: {
    color: "#999",
  },
});