import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  showNumber?: boolean;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  size = 16,
  color = "#FDD835",
  showNumber = false,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handlePress = (star: number) => {
    if (interactive && onRate) {
      onRate(star);
    }
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive
          ? (hoverRating || rating) >= star
          : rating >= star;

        return (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            disabled={!interactive}
            activeOpacity={interactive ? 0.7 : 1}
          >
            <Ionicons
              name={filled ? "star" : "star-outline"}
              size={size}
              color={filled ? color : "#ddd"}
            />
          </TouchableOpacity>
        );
      })}
      {showNumber && (
        <Text style={[styles.ratingNumber, { fontSize: size - 2 }]}>
          {rating?.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingNumber: {
    fontWeight: "600",
    color: "#222",
    marginLeft: 4,
  },
});