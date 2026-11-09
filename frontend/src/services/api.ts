import axios from "axios";

const apiUrl = new URL(import.meta.env.PROD ? window.location.origin : (import.meta.env.VITE_API_URL ?? "http://localhost:3000"));
// No celular, localhost aponta para o próprio aparelho. Só adapta URLs locais em dev.
if (import.meta.env.DEV && ["localhost", "127.0.0.1"].includes(apiUrl.hostname)) {
  apiUrl.hostname = window.location.hostname;
}

const api = axios.create({
  baseURL: apiUrl.toString().replace(/\/$/, ""),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
