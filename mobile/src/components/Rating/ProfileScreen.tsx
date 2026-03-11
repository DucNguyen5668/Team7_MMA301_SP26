import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "./StarRating";
import RatingModal from "./RatingModal";
import RatingDistribution from "./RatingDistribution";
import ReviewItem from "./ReviewItem";
import { API } from "../../services/api";
import { ProfileData } from "../../types/reviews";

interface ProfileScreenProps {
  opponentId: string;
  opponentName: string;
  opponentAvatar: string;
  conversationId: string;
  onBack: () => void;
}

export default function ProfileScreen({
  opponentId,
  opponentName,
  opponentAvatar,
  conversationId,
  onBack,
}: ProfileScreenProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchProfile = async (page = 1, append = false) => {
    try {
      setError(null);
      const res = await API.get(
        `/ratings/profile/${opponentId}?page=${page}&limit=10`,
      );
      const data: ProfileData = res.data;
      if (append && profileData) {
        setProfileData({
          ...data,
          ratings: [...profileData.ratings, ...data.ratings],
        });
      } else {
        setProfileData(data);
      }
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải hồ sơ người dùng");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProfile(1);
  }, [opponentId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile(1);
  }, [opponentId]);

  const handleLoadMore = () => {
    if (
      !loadingMore &&
      profileData &&
      currentPage < profileData.pagination.totalPages
    ) {
      setLoadingMore(true);
      fetchProfile(currentPage + 1, true);
    }
  };

  const getRatingDistributionArray = () => {
    if (!profileData) return [];
    const dist = profileData.stats.ratingDistribution;
    const total = profileData.stats.totalRatings;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = dist[stars] || 0;
      return {
        stars,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  };

  const PageHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#222" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Hồ sơ người dùng</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FDD835" />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      </View>
    );
  }

  if (error && !profileData) {
    return (
      <View style={styles.container}>
        <PageHeader />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF5722" />
          <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchProfile(1)}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayAvatar = profileData?.user.avatar || opponentAvatar;
  const displayName = profileData?.user.fullName || opponentName;

  return (
    <View style={styles.container}>
      <PageHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FDD835"]}
            tintColor="#FDD835"
          />
        }
        onScrollEndDrag={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 80
          ) {
            handleLoadMore();
          }
        }}
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          <Text style={styles.fullName}>{displayName}</Text>
          <View style={styles.ratingContainer}>
            <StarRating
              rating={profileData?.stats.averageRating || 0}
              size={20}
              showNumber
            />
          </View>
          <Text style={styles.totalRatings}>
            {profileData?.stats.totalRatings || 0} đánh giá
          </Text>
          {profileData?.user.memberSince && (
            <Text style={styles.memberSince}>
              Tham gia {profileData.user.memberSince}
            </Text>
          )}
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => setShowRatingModal(true)}
          >
            <Text style={styles.rateButtonText}>⭐ Đánh giá người bán</Text>
          </TouchableOpacity>
        </View>

        {/* Rating Distribution */}
        {profileData && profileData.stats.totalRatings > 0 && (
          <RatingDistribution distribution={getRatingDistributionArray()} />
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá gần đây</Text>
          {profileData?.ratings.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="star-outline" size={48} color="#ddd" />
              <Text style={styles.emptyReviewsText}>Chưa có đánh giá nào</Text>
            </View>
          ) : (
            profileData?.ratings.map((review) => (
              <ReviewItem key={review._id} review={review} />
            ))
          )}
          {loadingMore && (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#FDD835" />
            </View>
          )}
          {profileData &&
            currentPage >= profileData.pagination.totalPages &&
            profileData.ratings.length > 0 && (
              <Text style={styles.allLoadedText}>
                Đã hiển thị tất cả đánh giá
              </Text>
            )}
        </View>
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmitSuccess={() => {
          setShowRatingModal(false);
          fetchProfile(1);
        }}
        user={{ id: opponentId, name: displayName, avatar: displayAvatar }}
        conversationId={conversationId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#666" },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorTitle: { fontSize: 18, fontWeight: "600", color: "#222", marginTop: 16 },
  errorText: { fontSize: 14, color: "#666", marginTop: 8, textAlign: "center" },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#FDD835",
    borderRadius: 12,
  },
  retryButtonText: { fontSize: 15, fontWeight: "600", color: "#222" },
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#222" },
  profileSection: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FDD835",
    marginBottom: 12,
  },
  fullName: { fontSize: 20, fontWeight: "700", color: "#222", marginBottom: 8 },
  ratingContainer: { marginBottom: 4 },
  totalRatings: { fontSize: 13, color: "#888", marginBottom: 4 },
  memberSince: { fontSize: 13, color: "#888", marginBottom: 16 },
  rateButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#FFF",
    borderColor: "#FDD835",
    borderWidth: 2,
    borderRadius: 24,
  },
  rateButtonText: { fontSize: 14, fontWeight: "600", color: "#222" },
  section: { backgroundColor: "#fff", padding: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 16,
  },
  emptyReviews: { alignItems: "center", paddingVertical: 32 },
  emptyReviewsText: { fontSize: 15, color: "#aaa", marginTop: 12 },
  loadMoreContainer: { paddingVertical: 16, alignItems: "center" },
  allLoadedText: {
    textAlign: "center",
    fontSize: 13,
    color: "#bbb",
    paddingVertical: 16,
  },
});
