import axios from "axios";

const fallbackBaseUrl = "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl,
  timeout: 45000,
});

