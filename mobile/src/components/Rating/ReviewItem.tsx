import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "./StarRating";
import { Review } from "../../types/reviews";
import { formatReviewTimestamp } from "../../utils";

interface ReviewItemProps {
  review: Review;
}

export default function ReviewItem({ review }: ReviewItemProps) {
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Image
          source={{
            uri: review.ratingUser?.avatar || `https://i.pravatar.cc/150?img=1`,
          }}
          style={styles.reviewerAvatar}
        />
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerTop}>
            <View>
              <Text style={styles.reviewerName}>
                {review.ratingUser?.fullName || "Người dùng"}
              </Text>
              <StarRating rating={review.rating} size={14} />
            </View>
            <Text style={styles.reviewTimestamp}>
              {formatReviewTimestamp(review.createdAt)}
            </Text>
          </View>
          {review.review ? (
            <Text style={styles.reviewComment}>{review.review}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 3,
  },
  reviewTimestamp: {
    fontSize: 12,
    color: "#999",
  },
  reviewComment: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginTop: 4,
  },
});
