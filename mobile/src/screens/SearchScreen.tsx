import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Modal,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { getSuggestions, getAISearchInsight, analyzeImageForSearch } from "../services/geminiService";
import { productService } from "../services/productService";

const CATEGORIES = [
  "Tất cả",
  "Bất động sản",
  "Xe cộ",
  "Thú cưng",
  "Đồ gia dụng",
  "Việc làm",
  "Điện tử",
  "Khác",
];

type SortMode = "newest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { label: string; value: SortMode; icon: string }[] = [
  { label: "Mới nhất", value: "newest", icon: "time-outline" },
  { label: "Giá thấp→cao", value: "price_asc", icon: "trending-up-outline" },
  { label: "Giá cao→thấp", value: "price_desc", icon: "trending-down-outline" },
];

const DEMO_PRODUCTS = [
  { _id: "1", title: "iPhone 14 Pro Max 256GB", price: 18500000, category: "Điện tử", images: [], location: "Hà Nội", seller: { fullName: "Minh Tuấn" } },
  { _id: "2", title: "Honda SH 350i 2022", price: 95000000, category: "Xe cộ", images: [], location: "TP.HCM", seller: { fullName: "Anh Dũng" } },
  { _id: "3", title: "Macbook Air M2 2023", price: 24000000, category: "Điện tử", images: [], location: "Đà Nẵng", seller: { fullName: "Lan Hương" } },
  { _id: "4", title: "Căn hộ 2PN Vinhomes", price: 3200000000, category: "Bất động sản", images: [], location: "Hà Nội", seller: { fullName: "Nam Phong" } },
  { _id: "5", title: "Golden Retriever thuần chủng", price: 8000000, category: "Thú cưng", images: [], location: "TP.HCM", seller: { fullName: "Tú Anh" } },
  { _id: "6", title: "Tủ lạnh LG Inverter 380L", price: 6500000, category: "Đồ gia dụng", images: [], location: "Hải Phòng", seller: { fullName: "Hưng Thịnh" } },
];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [category, setCategory] = useState("Tất cả");
  const [products, setProducts] = useState<any[]>(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const formatPrice = (price: number) => {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} tr`;
    return `${price.toLocaleString("vi-VN")} đ`;
  };

  // Debounce AI suggestion
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setAiInsight("");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      const [sug, insight] = await Promise.all([
        getSuggestions(query),
        getAISearchInsight(query),
      ]);
      setSuggestions(sug);
      setAiInsight(insight);
      setSuggestLoading(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const doSearch = useCallback(async (q: string, sort: SortMode, cat: string) => {
    setLoading(true);
    try {
      const result = await productService.search({
        q,
        sortBy: sort,
        category: cat !== "Tất cả" ? cat : undefined,
      });
      setProducts(result.products?.length > 0 ? result.products : DEMO_PRODUCTS);
    } catch {
      setProducts(DEMO_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-search when filter changes
  useEffect(() => {
    doSearch(query, sortBy, category);
  }, [sortBy, category]);

  const handleSuggestionPress = (s: string) => {
    setQuery(s);
    setSuggestions([]);
    doSearch(s, sortBy, category);
  };

  const handleSearch = () => {
    doSearch(query, sortBy, category);
    setSuggestions([]);
  };

  const handleImageSearch = () => {
    Alert.alert(
      "Tìm kiếm bằng hình ảnh",
      "Chọn nguồn ảnh",
      [
        {
          text: "Chụp ảnh",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              alert("Cần quyền truy cập Camera!");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.4,
              base64: true,
            });
            processImageResult(result);
          },
        },
        {
          text: "Thư viện ảnh",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              alert("Cần quyền truy cập thư viện ảnh!");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.4,
              base64: true,
            });
            processImageResult(result);
          },
        },
        { text: "Hủy", style: "cancel" },
      ]
    );
  };

  const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImageSearchLoading(true);
      try {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const aiResult = await analyzeImageForSearch(base64Uri);

        if (aiResult.keyword) {
          const { keyword, category: aiCategory } = aiResult;

          // Auto-apply category from AI
          const mappedCategory = aiCategory && aiCategory !== "Tất cả" ? aiCategory : category;

          setQuery(keyword);
          setCategory(mappedCategory);
          setSuggestions([]);
          doSearch(keyword, sortBy, mappedCategory);

          // Show AI detected info
          Alert.alert(
            "🤖 AI đã nhận diện",
            `Sản phẩm: ${keyword}\nDanh mục: ${mappedCategory}\n\nĐang tìm sản phẩm tương tự...`,
            [{ text: "OK" }]
          );
        } else {
          Alert.alert("Không thể nhận diện", "Ảnh quá mờ hoặc không có sản phẩm rõ ràng. Vui lòng thử ảnh khác.");
        }
      } catch (error: any) {
        console.warn("Lỗi API Gemini Image:", error);
        Alert.alert("Lỗi kết nối AI", "Không thể phân tích ảnh: " + (error.message || "Không có phản hồi"));
      } finally {
        setImageSearchLoading(false);
      }
    }

  };

  const renderProductCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardImageBox}>
        {item.images?.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImageFallback]}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={11} color="#999" />
          <Text style={styles.cardLocation}>{item.location || "Không rõ"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const displayProducts = products.filter((p) => {
    if (category !== "Tất cả" && p.category !== category) return false;
    if (query.trim()) {
      return (
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(query.toLowerCase())
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    return 0;
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={["#FFD500", "#FFA500"]} style={styles.header}>
        <Text style={styles.headerTitle}>🧭 Khám phá</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm sản phẩm..."
              placeholderTextColor="#aaa"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); }} style={{ marginRight: 8 }}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleImageSearch}>
              <Ionicons name="camera" size={20} color="#FF5722" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Tìm</Text>
          </TouchableOpacity>
        </View>

        {/* AI Image Loading */}
        {imageSearchLoading && (
          <View style={styles.suggestRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.suggestLoading}> AI đang phân tích ảnh quét...</Text>
          </View>
        )}

        {/* AI Suggestions */}
        {suggestLoading && (
          <View style={styles.suggestRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.suggestLoading}> AI đang gợi ý...</Text>
          </View>
        )}
        {suggestions.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestScroll}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestChip}
                  onPress={() => handleSuggestionPress(s)}
                >
                  <Ionicons name="sparkles" size={12} color="#FFC400" />
                  <Text style={styles.suggestText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* AI Insight */}
        {aiInsight.length > 0 && (
          <View style={styles.insightBox}>
            <Ionicons name="bulb-outline" size={14} color="#FFC400" />
            <Text style={styles.insightText}>{aiInsight}</Text>
          </View>
        )}
      </LinearGradient>

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        {/* Sort buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.filterChip, sortBy === opt.value && styles.filterChipActive]}
              onPress={() => setSortBy(opt.value)}
            >
              <Ionicons
                name={opt.icon as any}
                size={13}
                color={sortBy === opt.value ? "#fff" : "#555"}
              />
              <Text style={[styles.filterChipText, sortBy === opt.value && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Category filter button */}
          <TouchableOpacity
            style={[styles.filterChip, category !== "Tất cả" && styles.filterChipActive]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Ionicons name="funnel-outline" size={13} color={category !== "Tất cả" ? "#fff" : "#555"} />
            <Text style={[styles.filterChipText, category !== "Tất cả" && styles.filterChipTextActive]}>
              {category === "Tất cả" ? "Loại" : category}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* RESULTS */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      ) : (
        <FlatList
          data={displayProducts}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderProductCard}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {displayProducts.length} kết quả{query ? ` cho "${query}"` : ""}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
              <Text style={styles.emptySubText}>Thử từ khóa khác hoặc dùng gợi ý AI</Text>
            </View>
          }
        />
      )}

      {/* CATEGORY MODAL */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Chọn danh mục</Text>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catOption, category === cat && styles.catOptionActive]}
              onPress={() => { setCategory(cat); setShowCategoryModal(false); }}
            >
              <Text style={[styles.catOptionText, category === cat && styles.catOptionTextActive]}>
                {cat}
              </Text>
              {category === cat && <Ionicons name="checkmark" size={18} color="#FFA500" />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },

  // Header
  header: { paddingTop: Platform.OS === "ios" ? 50 : 40, paddingBottom: 14, paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#222", marginBottom: 10 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 25,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  searchBtn: {
    backgroundColor: "#333", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  searchBtnText: { color: "#FFD500", fontWeight: "700", fontSize: 13 },

  // AI Suggestions
  suggestRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  suggestLoading: { color: "#fff", fontSize: 12 },
  suggestScroll: { marginTop: 10 },
  suggestChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
  },
  suggestText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  insightBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 8,
  },
  insightText: { color: "#fff", fontSize: 12, flex: 1, lineHeight: 18 },

  // Filter Bar
  filterBar: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1.5, borderColor: "#ddd", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
    backgroundColor: "#fff",
  },
  filterChipActive: { backgroundColor: "#FFA500", borderColor: "#FFA500" },
  filterChipText: { fontSize: 12, color: "#555", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },

  // Results
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#999", fontSize: 14 },
  listContent: { padding: 12, paddingBottom: 80 },
  row: { justifyContent: "space-between" },
  resultCount: { fontSize: 13, color: "#888", marginBottom: 10, fontWeight: "500" },

  // Product Card
  card: {
    width: "48%", backgroundColor: "#fff", borderRadius: 14,
    marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.07,
    shadowRadius: 6, elevation: 3, overflow: "hidden",
  },
  cardImageBox: { position: "relative" },
  cardImage: { width: "100%", height: 110 },
  cardImageFallback: { justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  categoryBadge: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "rgba(255,165,0,0.9)", borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  categoryBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 12, fontWeight: "600", color: "#222", lineHeight: 17, marginBottom: 5 },
  cardPrice: { fontSize: 14, fontWeight: "800", color: "#E53935" },
  cardMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 2 },
  cardLocation: { fontSize: 10, color: "#999" },

  // Empty
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#bbb" },
  emptySubText: { fontSize: 13, color: "#ccc" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#222", marginBottom: 14 },
  catOption: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  catOptionActive: { backgroundColor: "#FFF8E7", borderRadius: 10, paddingHorizontal: 10 },
  catOptionText: { fontSize: 15, color: "#444" },
  catOptionTextActive: { color: "#FFA500", fontWeight: "700" },
});
