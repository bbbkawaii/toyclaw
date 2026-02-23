import axios from "axios";

const fallbackBaseUrl = "http://localhost:3000/api/v1";
const fallbackTimeoutMs = 120000;

function resolveTimeoutMs(): number {
  const raw = import.meta.env.VITE_API_TIMEOUT_MS;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallbackTimeoutMs;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl,
  timeout: resolveTimeoutMs(),
});
