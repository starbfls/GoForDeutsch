import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      if (localStorage.getItem("token")) {
        try {
          const { data } = await authApi.me();
          if (active) setUser({ token: localStorage.getItem("token"), username: data.username });
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 404) {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
          }
        }
      }
      if (active) setLoading(false);
    };
    restore();
    return () => { active = false; };
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

// This hook intentionally shares the context module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
