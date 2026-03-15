import { API } from "./api";

export const userService = {
  getMe: async () => {
    const res = await API.get("/users/me");
    return res.data;
  },

  updateProfile: async (data: {
    fullName?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    bio?: string;
  }) => {
    const res = await API.put("/users/me", data);
    return res.data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const res = await API.put("/users/password", { oldPassword, newPassword });
    return res.data;
  },

  uploadAvatar: async (avatar: string) => {
    const res = await API.put("/users/avatar", { avatar });
    return res.data;
  },
};
