import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../services/api";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data);
      } catch (error) {
        await AsyncStorage.removeItem("token");
      }
    }

    setLoading(false);
  };

  // LOGIN
  const login = async (email: string, password: string) => {
    const res = await API.post("/auth/login", {
      email,
      password,
    });

    await AsyncStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  // REGISTER
  const register = async (fullName: string, email: string, password: string) => {
    const res = await API.post("/auth/register", { fullName, email, password });
    await AsyncStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (newData: any) => {
    setUser((prev: any) => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        updateUser  
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

