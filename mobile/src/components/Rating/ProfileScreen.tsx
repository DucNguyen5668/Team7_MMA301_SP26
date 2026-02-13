import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "./StarRating";

interface Review {
  id: number;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  timestamp: string;
  productTitle: string;
}

interface ProfileScreenProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    totalRatings: number;
    memberSince: string;
    responseRate: string;
    responseTime: string;
  };
  onBack: () => void;
  onOpenRatingModal: () => void;
}

const mockRatings: Review[] = [
  {
    id: 1,
    reviewerName: "Hoàng Thị E",
    reviewerAvatar: "https://i.pravatar.cc/150?img=20",
    rating: 5,
    comment:
      "Người bán rất nhiệt tình và chu đáo. Sản phẩm đúng như mô tả. Rất hài lòng!",
    timestamp: "2 ngày trước",
    productTitle: "iPhone 14 Pro Max",
  },
  {
    id: 2,
    reviewerName: "Đỗ Văn F",
    reviewerAvatar: "https://i.pravatar.cc/150?img=52",
    rating: 5,
    comment: "Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ lâu dài.",
    timestamp: "1 tuần trước",
    productTitle: "Laptop Dell XPS 13",
  },
  {
    id: 3,
    reviewerName: "Vũ Thị G",
    reviewerAvatar: "https://i.pravatar.cc/150?img=38",
    rating: 4,
    comment: "Sản phẩm tốt, giá hợp lý. Nhưng hơi lâu phản hồi.",
    timestamp: "2 tuần trước",
    productTitle: "Máy ảnh Canon EOS R6",
  },
  {
    id: 4,
    reviewerName: "Bùi Minh H",
    reviewerAvatar: "https://i.pravatar.cc/150?img=61",
    rating: 5,
    comment: "Shop uy tín, giao dịch nhanh gọn. Highly recommended!",
    timestamp: "3 tuần trước",
    productTitle: "Apple Watch Series 8",
  },
  {
    id: 5,
    reviewerName: "Ngô Thị I",
    reviewerAvatar: "https://i.pravatar.cc/150?img=47",
    rating: 5,
    comment: "Rất hài lòng về chất lượng sản phẩm và thái độ phục vụ.",
    timestamp: "1 tháng trước",
    productTitle: "Samsung Galaxy S23 Ultra",
  },
  {
    id: 6,
    reviewerName: "Đinh Văn K",
    reviewerAvatar: "https://i.pravatar.cc/150?img=68",
    rating: 4,
    comment: "Tốt, nhưng có thể cải thiện thời gian phản hồi.",
    timestamp: "1 tháng trước",
    productTitle: "iPad Air 2023",
  },
];

const ratingDistribution = [
  { stars: 5, count: 89, percentage: 70 },
  { stars: 4, count: 28, percentage: 22 },
  { stars: 3, count: 7, percentage: 6 },
  { stars: 2, count: 2, percentage: 1.5 },
  { stars: 1, count: 1, percentage: 0.5 },
];

export default function ProfileScreen({
  user,
  onBack,
  onOpenRatingModal,
}: ProfileScreenProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ người dùng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.ratingContainer}>
            <StarRating rating={user.rating} size={20} showNumber={true} />
          </View>
          <Text style={styles.totalRatings}>{user.totalRatings} đánh giá</Text>
          <Text style={styles.memberSince}>Tham gia {user.memberSince}</Text>

          <TouchableOpacity
            style={styles.rateButton}
            onPress={onOpenRatingModal}
          >
            <Text style={styles.rateButtonText}>⭐ Đánh giá người bán</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.responseRate}</Text>
            <Text style={styles.statLabel}>Tỷ lệ phản hồi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.responseTime}</Text>
            <Text style={styles.statLabel}>Thời gian phản hồi</Text>
          </View>
        </View>

        {/* Rating Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân bố đánh giá</Text>
          {ratingDistribution.map((item) => (
            <View key={item.stars} style={styles.distributionRow}>
              <View style={styles.distributionLabel}>
                <Text style={styles.distributionStars}>{item.stars}</Text>
                <Ionicons name="star" size={14} color="#FDD835" />
              </View>
              <View style={styles.distributionBarContainer}>
                <View
                  style={[
                    styles.distributionBar,
                    { width: `${item.percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.distributionCount}>{item.count}</Text>
            </View>
          ))}
        </View>

        {/* Reviews List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá gần đây</Text>
          {mockRatings.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Image
                  source={{ uri: review.reviewerAvatar }}
                  style={styles.reviewerAvatar}
                />
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerTop}>
                    <View>
                      <Text style={styles.reviewerName}>
                        {review.reviewerName}
                      </Text>
                      <StarRating rating={review.rating} size={14} />
                    </View>
                    <Text style={styles.reviewTimestamp}>
                      {review.timestamp}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <View style={styles.reviewProduct}>
                    <Text style={styles.reviewProductText}>
                      Sản phẩm: {review.productTitle}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  profileSection: {
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 8,
    borderBottomColor: "#f5f5f5",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#FDD835",
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  ratingContainer: {
    marginBottom: 4,
  },
  totalRatings: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  memberSince: {
    fontSize: 13,
    color: "#999",
    marginBottom: 20,
  },
  rateButton: {
    backgroundColor: "#FDD835",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  rateButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  statsSection: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 8,
    borderBottomColor: "#f5f5f5",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF9E6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 16,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  distributionLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
    gap: 4,
  },
  distributionStars: {
    fontSize: 14,
    color: "#666",
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  distributionBar: {
    height: "100%",
    backgroundColor: "#FDD835",
  },
  distributionCount: {
    fontSize: 13,
    color: "#999",
    width: 40,
    textAlign: "right",
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
    gap: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  reviewTimestamp: {
    fontSize: 12,
    color: "#999",
  },
  reviewComment: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewProduct: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  reviewProductText: {
    fontSize: 13,
    color: "#999",
  },
});