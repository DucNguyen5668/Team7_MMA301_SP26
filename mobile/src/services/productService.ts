import { API } from "./api";

export interface SearchParams {
  q?: string;
  category?: string;
  sortBy?: "price_asc" | "price_desc" | "newest";
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductPayload {
  title: string;
  description?: string;
  price: number;
  category?: string;
  images?: string[];
  location?: string;
  condition?: "new" | "used";
  status?: "active" | "sold" | "hidden";
}

export const productService = {
  search: async (params: SearchParams) => {
    const res = await API.get("/products/search", { params });
    return res.data; // { products, total, page, totalPages }
  },

  getMyProducts: async () => {
    const res = await API.get("/products/mine");
    return res.data; // Product[]
  },

  getProductById: async (id: string) => {
    const res = await API.get(`/products/${id}`);
    return res.data;
  },

  createProduct: async (data: ProductPayload) => {
    const res = await API.post("/products", data);
    return res.data;
  },

  updateProduct: async (id: string, data: Partial<ProductPayload>) => {
    const res = await API.put(`/products/${id}`, data);
    return res.data;
  },

  deleteProduct: async (id: string) => {
    const res = await API.delete(`/products/${id}`);
    return res.data;
  },
};
