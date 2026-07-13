import { BASE_URL, API_ENDPOINTS } from "@/constants/ApiConstants";
import { getAuthToken, getRefreshToken } from "@/utils/authStorage";
import { useAuthStore } from "@/store/useAuthStore";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data: T | null;
  message: string;
}

export interface ApiRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(
  endpoint: string,
  params?: ApiRequestOptions["params"],
): string {
  const url = new URL(
    endpoint.startsWith("http")
      ? endpoint
      : `${BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`,
  );
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
}

interface RefreshTokenBody {
  status: boolean;
  message: string;
  data: { token: string }[];
}

// Dedupes concurrent 401s so a burst of requests triggers exactly one
// refresh call instead of one per request.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;
      try {
        const response = await fetch(buildUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return null;
        const responseBody = (await response.json()) as RefreshTokenBody;
        const newToken = responseBody.status ? responseBody.data?.[0]?.token : null;
        if (!newToken) return null;
        // Refresh only returns a new access token — the refresh token itself
        // is unchanged, so it's carried over as-is.
        useAuthStore.getState().setTokens({ token: newToken, refreshToken });
        return newToken;
      } catch {
        return null;
      }
    })();
  }
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// Single place every API call in the app goes through. Screens/components
// must never call `fetch` directly — always go through this function (or
// the get/post/put/patch/del helpers below) so status codes and errors are
// handled the same way everywhere.
export async function apiCall<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", headers = {}, body, params } = options;
  const token = getAuthToken();
  // FormData (file uploads) must be sent as-is with no Content-Type — the
  // browser sets the multipart boundary itself. Everything else is JSON.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const url = buildUrl(endpoint, params);

  const doFetch = (authToken: string | null) =>
    fetch(url, {
      method,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

  try {
    let response = await doFetch(token);

    // Access token expired — refresh once and retry the original request
    // before giving up. Only applies to requests that were actually
    // authenticated to begin with; guest calls 401 for other reasons.
    if (response.status === 401 && token && !endpoint.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        response = await doFetch(newToken);
      } else {
        useAuthStore.getState().clearTokens();
      }
    }

    const statusCode = response.status;
    console.log(`API [${method}] ${endpoint} -> status code ${statusCode}`);
    let data: T | null = null;
    try {
      data = (await response.json()) as T;
    } catch {
      data = null;
    }

    return {
      success: response.ok,
      statusCode,
      data,
      message: response.ok
        ? "Success"
        : response.statusText || "Request failed",
    };
  } catch (error) {
    console.log(`API [${method}] ${endpoint} -> status code 0 (network error)`);
    return {
      success: false,
      statusCode: 0,
      data: null,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

export const ApiService = {
  get: <T = unknown>(
    endpoint: string,
    params?: ApiRequestOptions["params"],
    headers?: Record<string, string>,
  ) => apiCall<T>(endpoint, { method: "GET", params, headers }),

  post: <T = unknown>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ) => apiCall<T>(endpoint, { method: "POST", body, headers }),

  put: <T = unknown>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ) => apiCall<T>(endpoint, { method: "PUT", body, headers }),

  patch: <T = unknown>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ) => apiCall<T>(endpoint, { method: "PATCH", body, headers }),

  delete: <T = unknown>(endpoint: string, headers?: Record<string, string>) =>
    apiCall<T>(endpoint, { method: "DELETE", headers }),
};

export default ApiService;
