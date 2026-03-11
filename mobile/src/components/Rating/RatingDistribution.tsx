import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RatingDistributionItem } from "../../types/reviews";

interface RatingDistributionProps {
  distribution: RatingDistributionItem[];
}

export default function RatingDistribution({
  distribution,
}: RatingDistributionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Phân bố đánh giá</Text>
      {distribution.map((item) => (
        <View key={item.stars} style={styles.distributionRow}>
          <View style={styles.distributionLabel}>
            <Text style={styles.distributionStars}>{item.stars}</Text>
            <Ionicons name="star" size={14} color="#FDD835" />
          </View>
          <View style={styles.distributionBarContainer}>
            <View
              style={[styles.distributionBar, { width: `${item.percentage}%` }]}
            />
          </View>
          <Text style={styles.distributionCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 16,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  distributionLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 32,
    gap: 2,
  },
  distributionStars: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  distributionBar: {
    height: "100%",
    backgroundColor: "#FDD835",
    borderRadius: 4,
  },
  distributionCount: {
    width: 28,
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
});
