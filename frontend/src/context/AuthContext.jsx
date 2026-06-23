import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (token && username) {
      setUser({ token, username });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await authApi.login(username, password);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("username", data.username);
    setUser({ token: data.access_token, username: data.username });
    return data;
  };

  const register = async (password) => {
    const { data } = await authApi.register(password);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("username", data.username);
    setUser({ token: data.access_token, username: data.username });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
