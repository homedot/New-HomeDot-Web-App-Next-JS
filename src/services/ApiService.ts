import { BASE_URL } from "@/constants/ApiConstants";

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

// Single place every API call in the app goes through. Screens/components
// must never call `fetch` directly — always go through this function (or
// the get/post/put/patch/del helpers below) so status codes and errors are
// handled the same way everywhere.
export async function apiCall<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", headers = {}, body, params } = options;

  try {
    const response = await fetch(buildUrl(endpoint, params), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const statusCode = response.status;
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
