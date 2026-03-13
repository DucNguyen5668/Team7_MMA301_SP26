import { API } from "./api";

export const getCategories = () => {
  return API.get("/categories");
};
