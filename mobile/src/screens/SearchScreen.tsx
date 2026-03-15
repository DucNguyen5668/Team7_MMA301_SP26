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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getSuggestions, getAISearchInsight, analyzeImageForSearch } from "../services/geminiService";
import { productService } from "../services/productService";

const CATEGORIES = ["Tất cả", "Xe cộ", "Đồ gia dụng", "Điện tử", "Khác"];

type SortMode = "newest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { label: string; value: SortMode; icon: string }[] = [
  { label: "Mới nhất", value: "newest", icon: "time-outline" },
  { label: "Giá thấp→cao", value: "price_asc", icon: "trending-up-outline" },
  { label: "Giá cao→thấp", value: "price_desc", icon: "trending-down-outline" },
];

const formatPrice = (price: number) => {
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} tr`;
  return `${price.toLocaleString("vi-VN")} đ`;
};

export default function SearchScreen() {
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [category, setCategory] = useState("Tất cả");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [total, setTotal] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const doSearch = useCallback(async (q: string, sort: SortMode, cat: string) => {
    setLoading(true);
    try {
      const result = await productService.search({
        q: q.trim() || undefined,
        sortBy: sort,
        category: cat !== "Tất cả" ? cat : undefined,
        limit: 40,
      });
      setProducts(result.products ?? []);
      setTotal(result.total ?? 0);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + filter change
  useEffect(() => {
    doSearch(query, sortBy, category);
  }, [sortBy, category]);

  useFocusEffect(
    useCallback(() => {
      doSearch(query, sortBy, category);
    }, [doSearch]),
  );

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
    Alert.alert("Tìm kiếm bằng hình ảnh", "Chọn nguồn ảnh", [
      {
        text: "Chụp ảnh",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") { alert("Cần quyền truy cập Camera!"); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", allowsEditing: true, quality: 0.4, base64: true });
          processImageResult(result);
        },
      },
      {
        text: "Thư viện ảnh",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") { alert("Cần quyền truy cập thư viện ảnh!"); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, quality: 0.4, base64: true });
          processImageResult(result);
        },
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImageSearchLoading(true);
      try {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const aiResult = await analyzeImageForSearch(base64Uri);
        if (aiResult.keyword) {
          const { keyword, category: aiCategory } = aiResult;
          const mappedCategory = aiCategory && aiCategory !== "Tất cả" ? aiCategory : category;
          setQuery(keyword);
          setCategory(mappedCategory);
          setSuggestions([]);
          doSearch(keyword, sortBy, mappedCategory);
          Alert.alert("🤖 AI đã nhận diện", `Sản phẩm: ${keyword}\nDanh mục: ${mappedCategory}\n\nĐang tìm sản phẩm tương tự...`, [{ text: "OK" }]);
        } else {
          Alert.alert("Không thể nhận diện", "Ảnh quá mờ hoặc không có sản phẩm rõ ràng.");
        }
      } catch (error: any) {
        Alert.alert("Lỗi kết nối AI", "Không thể phân tích ảnh: " + (error.message || ""));
      } finally {
        setImageSearchLoading(false);
      }
    }
  };

  const renderProductCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("ProductDetail", { productId: item._id })}
    >
      <View style={styles.cardImageBox}>
        {item.images?.[0] ? (
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
        {item.seller?.fullName ? (
          <View style={styles.cardMeta}>
            <Ionicons name="person-outline" size={11} color="#999" />
            <Text style={styles.cardLocation}>{item.seller.fullName}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={["#FFD500", "#FFA500"]} style={styles.header}>
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
              <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); doSearch("", sortBy, category); }} style={{ marginRight: 8 }}>
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

        {imageSearchLoading && (
          <View style={styles.suggestRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.suggestLoading}> AI đang phân tích ảnh...</Text>
          </View>
        )}
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
                <TouchableOpacity key={i} style={styles.suggestChip} onPress={() => handleSuggestionPress(s)}>
                  <Ionicons name="sparkles" size={12} color="#FFC400" />
                  <Text style={styles.suggestText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
        {aiInsight.length > 0 && (
          <View style={styles.insightBox}>
            <Ionicons name="bulb-outline" size={14} color="#FFC400" />
            <Text style={styles.insightText}>{aiInsight}</Text>
          </View>
        )}
      </LinearGradient>

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.filterChip, sortBy === opt.value && styles.filterChipActive]}
              onPress={() => setSortBy(opt.value)}
            >
              <Ionicons name={opt.icon as any} size={13} color={sortBy === opt.value ? "#fff" : "#555"} />
              <Text style={[styles.filterChipText, sortBy === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
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
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderProductCard}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {total} kết quả{query ? ` cho "${query}"` : ""}
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
              <Text style={[styles.catOptionText, category === cat && styles.catOptionTextActive]}>{cat}</Text>
              {category === cat && <Ionicons name="checkmark" size={18} color="#FFA500" />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {  padding: 16, paddingHorizontal: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 10, height: 42,
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: "#333" },
  searchBtn: { backgroundColor: "#fff", paddingHorizontal: 14, height: 42, borderRadius: 12, justifyContent: "center" },
  searchBtnText: { fontWeight: "700", color: "#FFA500", fontSize: 14 },
  suggestRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  suggestLoading: { color: "#fff", fontSize: 13 },
  suggestScroll: { marginTop: 8 },
  suggestChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5, marginRight: 8,
  },
  suggestText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  insightBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 8, padding: 8, marginTop: 8,
  },
  insightText: { color: "#fff", fontSize: 12, flex: 1 },
  filterBar: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F0F0F0", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
  },
  filterChipActive: { backgroundColor: "#FFA500" },
  filterChipText: { fontSize: 12, color: "#555", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#999", fontSize: 14 },
  listContent: { padding: 12, paddingBottom: 80 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  resultCount: { fontSize: 13, color: "#888", marginBottom: 8 },
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 4 },
  cardImageBox: { position: "relative" },
  cardImage: { width: "100%", height: 130 },
  cardImageFallback: { justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5" },
  categoryBadge: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  categoryBadgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cardInfo: { padding: 8 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#222", marginBottom: 4 },
  cardPrice: { fontSize: 14, fontWeight: "800", color: "#F4A100", marginBottom: 4 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardLocation: { fontSize: 11, color: "#999" },
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, color: "#999", fontWeight: "600" },
  emptySubText: { fontSize: 13, color: "#bbb" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12, color: "#222" },
  catOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  catOptionActive: { backgroundColor: "#FFF8ED" },
  catOptionText: { fontSize: 15, color: "#444" },
  catOptionTextActive: { color: "#FFA500", fontWeight: "700" },
});
