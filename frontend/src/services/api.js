import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (password) => api.post("/auth/register", { password }),
  login: (username, password) => api.post("/auth/login", { username, password }),
  me: (token) => api.get(`/auth/me?token=${token}`),
};

export default api;
