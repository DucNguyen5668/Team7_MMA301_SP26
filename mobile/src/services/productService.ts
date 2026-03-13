import { API } from "./api";

export interface SearchParams {
  q?: string;
  category?: string;
  sortBy?: "price_asc" | "price_desc" | "newest";
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}

export const productService = {
  search: async (params: SearchParams) => {
    const res = await API.get("/products/search", { params });
    return res.data;
  },

  getMyProducts: async () => {
    const res = await API.get("/products/mine");
    return res.data;
  },

  createProduct: async (data: {
    title: string;
    description?: string;
    price: number;
    category?: string;
    images?: string[];
    location?: string;
  }) => {
    const res = await API.post("/products", data);
    return res.data;
  },
};
