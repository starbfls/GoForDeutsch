import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  let learner = localStorage.getItem("gfd-learner");
  if (!learner) {
    learner = crypto.randomUUID();
    localStorage.setItem("gfd-learner", learner);
  }
  config.headers["X-Learner-ID"] = learner;
  return config;
});

export const authApi = {
  register: (password) => api.post("/auth/register", { password }),
  login: (username, password) => api.post("/auth/login", { username, password }),
  me: () => api.get("/auth/me"),
};

export const learningApi = {
  bootstrap: () => api.get("/learning/bootstrap"),
  start: (mission_id) => api.post("/learning/start", { mission_id }),
  turn: (data) => api.post("/learning/turn", data),
};

export default api;
