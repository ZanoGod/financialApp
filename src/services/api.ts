export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  public readonly status: number;

  public readonly data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestBody = Record<string, unknown> | FormData | undefined;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TOKEN_KEY = "finance_app_token";
const TOKEN_EXPIRES_AT_KEY = "finance_app_token_expires_at";

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
};

export const getAuthToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY) ?? "0");

  if (!token || !expiresAt || Date.now() >= expiresAt * 1000) {
    clearAuthToken();
    return null;
  }

  return token;
};

export const setAuthToken = (token: string, expiresAt: number) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAt));
};

const buildUrl = (endpoint: string) => {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");

  return `${baseUrl}/${path}`;
};

const request = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: RequestBody,
): Promise<ApiResponse<T>> => {
  const headers = new Headers();
  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(endpoint), init);
  const payload = (await response.json().catch(() => ({
    success: false,
    message: "Invalid server response.",
    data: {},
  }))) as ApiResponse<T>;

  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new CustomEvent("auth:expired"));
  }

  if (!response.ok || !payload.success) {
    throw new ApiError(payload.message || "Request failed.", response.status, payload.data);
  }

  return payload;
};

export const api = {
  get: <T>(endpoint: string) => request<T>("GET", endpoint),
  post: <T>(endpoint: string, body?: RequestBody) => request<T>("POST", endpoint, body),
  put: <T>(endpoint: string, body?: RequestBody) => request<T>("PUT", endpoint, body),
  delete: <T>(endpoint: string) => request<T>("DELETE", endpoint),
};
