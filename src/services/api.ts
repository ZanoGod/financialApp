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
const HUMAN_CHECK_PATTERN = /<script>\s*document\.cookie\s*=\s*["'](humans_\d+=1)["'];\s*document\.location\.reload\(true\)\s*<\/script>/i;

const fetchApiResponse = async (url: string, init: RequestInit) => {
  let response = await fetch(url, init);
  let body = await response.text();
  const challenge = body.match(HUMAN_CHECK_PATTERN);

  // Shared hosts can return a small JavaScript cookie challenge instead of
  // JSON. Reproduce only that exact, non-executable cookie assignment, then
  // retry once so fetch requests behave like a normal browser page reload.
  if (challenge) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${challenge[1]}; Path=/; SameSite=Lax${secure}`;
    response = await fetch(url, init);
    body = await response.text();
  }

  return { response, body };
};

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

  const { response, body: responseBody } = await fetchApiResponse(buildUrl(endpoint), init);
  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(responseBody) as ApiResponse<T>;
  } catch {
    const isAccessCheck = /humans_\d+=1|access denied|security check/i.test(responseBody);
    throw new ApiError(
      isAccessCheck
        ? "The hosting security check blocked this request. Please retry; if it continues, ask your hosting provider to allow the finance API for VPN connections."
        : "The server returned an unexpected response. Please try again.",
      response.status,
    );
  }

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

  const { body } = await fetchApiResponse(buildUrl("monthly/close.php"), {
    method: "POST",
    headers,
    body: JSON.stringify({ year, month, notes }),
  });
  return JSON.parse(body);
};

export const getMonthlyArchives = async (): Promise<{ status: string; data: MonthlySummaryData[] }> => {
  const { body } = await fetchApiResponse(buildUrl("monthly/index.php"), {});
  return JSON.parse(body);
};
