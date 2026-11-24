import axios from "axios";

export const axiosInstance = axios.create({
  timeout: 10000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const raw = localStorage.getItem("token");
  if (raw) {
    const token = raw.replace(/^"|"$/g, "");
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    if (status === 401 && !url.includes("login")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const apiConnector = (method, url, bodyData, headers, params) =>
  axiosInstance({
    method,
    url,
    data: bodyData ?? null,
    headers: headers ?? undefined,
    params: params ?? null,
  });
