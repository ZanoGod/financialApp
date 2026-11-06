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
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  } catch {
    // Storage may be unavailable in embedded browsers; auth can still use memory.
  }
};

export const getAuthToken = () => {
  let token: string | null;
  let expiresAt: number;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY) ?? "0");
  } catch {
    return null;
  }

  if (!token || !expiresAt || Date.now() >= expiresAt * 1000) {
    clearAuthToken();
    return null;
  }

  return token;
};

export const setAuthToken = (token: string, expiresAt: number) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAt));
  } catch {
    // Keep login flow from crashing in embedded browsers with blocked storage.
  }
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

export interface MonthlySummaryData {
  id: number;
  year: number;
  month: number;
  total_income: string;
  total_expense: string;
  net_savings: string;
  account_snapshot: Array<{
    id: number;
    name: string;
    type: string;
    balance: string;
    color: string;
    bg: string;
  }>;
  category_breakdown: Array<{
    category_name: string;
    type: 'income' | 'expense';
    total_amount: string;
  }>;
  notes: string | null;
  closed_at: string;
}

export const closeMonthArchive = async (year: number, month: number, notes?: string) => {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(buildUrl("monthly/close.php"), {
    method: "POST",
    headers,
    body: JSON.stringify({ year, month, notes }),
  });
  return response.json();
};

export const getMonthlyArchives = async (): Promise<{ status: string; data: MonthlySummaryData[] }> => {
  const response = await fetch(buildUrl("monthly/index.php"));
  return response.json();
};
