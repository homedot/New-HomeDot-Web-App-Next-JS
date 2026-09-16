"use server";

import { BASE_URL } from "@/constants/ApiConstants";

// The one place an actual HTTP request to the backend is issued, and the
// only place BASE_URL is ever turned into a real URL. Every browser-side
// call into ApiService.apiCall ends up here — and because this file is a
// Server Action, calling it from client code never runs `fetch` in the
// browser itself, and the backend host is never even sent to the browser as
// part of the call (the client only ever passes a relative `endpoint`):
// Next.js transparently turns the call into a same-origin request to this
// app's own server, which resolves the endpoint against BASE_URL and
// performs the real fetch to the backend, then RPCs the result back. Called
// from server-side code (e.g. a page's own data fetching), it's just a
// normal in-process function call — no extra hop. Either way, the backend
// host, its request shape and any bearer token never appear as a distinct
// entry — or anywhere at all — in the browser's Network tab.
export interface ServerFetchResult {
  status: number;
  ok: boolean;
  statusText: string;
  data: unknown;
}

export type ServerFetchParams = Record<
  string,
  string | number | boolean | undefined
>;

function buildUrl(endpoint: string, params?: ServerFetchParams): string {
  if (!BASE_URL && !endpoint.startsWith("http")) {
    throw new Error("NEXT_PUBLIC_API_STAGING_BASE_URL is not set");
  }
  const url = new URL(
    endpoint.startsWith("http")
      ? endpoint
      : `${BASE_URL!.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`,
  );
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
}

export async function serverFetch(
  endpoint: string,
  params: ServerFetchParams | undefined,
  method: string,
  headers: Record<string, string>,
  body: string | FormData | undefined,
): Promise<ServerFetchResult> {
  const res = await fetch(buildUrl(endpoint, params), { method, headers, body });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, statusText: res.statusText, data };
}
