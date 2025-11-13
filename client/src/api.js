// src/api.js
import axios from "axios";

const baseURL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:5000";

const api = axios.create({
  baseURL,
  timeout: 20000,
});

export default api;


