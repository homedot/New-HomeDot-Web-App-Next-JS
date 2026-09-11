import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constants/ApiConstants";

let socket: Socket | null = null;
// The token is baked into the connection at construction time (query
// param, below) — if a different one comes in (new login, switched
// account) the existing socket would keep authenticating as whoever it was
// built for, so a token change tears down and rebuilds it instead.
let connectedToken: string | null = null;
// How many live useNotificationSocket() subscribers currently want this
// connection open — e.g. a global notification bell in the nav plus a
// screen-specific list both listening at once. disconnect() only actually
// tears the socket down once the last one lets go, so one unmounting
// doesn't yank the connection out from under the other.
let refCount = 0;

function getSocket(token: string): Socket {
  if (socket && connectedToken === token) return socket;

  socket?.disconnect();
  if (!SOCKET_URL) {
    throw new Error("NEXT_PUBLIC_API_STAGING_BASE_URL is not set");
  }
  // socket.io-client reads any path segment in this URL as a *namespace* to
  // join, not an HTTP path prefix — pointing it at something like
  // ".../api/v1" fails the handshake with "Invalid namespace" instead of a
  // clear config error, which is exactly the bug this guard catches.
  // ApiConstants.ts's SOCKET_URL comment has the full story.
  const origin = new URL(SOCKET_URL);
  if (origin.pathname !== "/" && origin.pathname !== "") {
    throw new Error(
      `SOCKET_URL must be a bare origin with no path — got "${SOCKET_URL}" (path "${origin.pathname}"). See ApiConstants.ts's SOCKET_URL comment.`,
    );
  }
  // Mirrors homedot-mobile-app's SocketServices.js (io(SERVER_URL, {
  // autoConnect: false, query: { token } })) — auth travels as a query
  // param the socket server reads on handshake, same as mobile.
  socket = io(SOCKET_URL, {
    autoConnect: false,
    query: { token },
  });
  connectedToken = token;
  refCount = 0;

  // Same debug logger as SocketServices.js's `socket.onAny(...)` — dev-only
  // here since, unlike mobile, this runs in a browser console real users
  // can open. Use it to tell apart "never connected" (no "connect" log,
  // check connect_error) from "connected but the server never pushed a
  // notification" (connect logs, nothing else ever does).
  if (process.env.NODE_ENV !== "production") {
    const s = socket;
    s.on("connect", () => console.log("[socket] connected", s.id));
    s.on("connect_error", (err) =>
      console.log("[socket] connect_error", err.message),
    );
    s.on("disconnect", (reason) =>
      console.log("[socket] disconnected:", reason),
    );
    s.onAny((event, ...args) => console.log("[socket] event:", event, args));
  }

  return socket;
}

/** Singleton wrapper around the shared notification/chat socket.io
 * connection. Unlike mobile's SocketServices.js — which is a bare `io(...)`
 * call reused as a module-level singleton for the whole app's lifetime —
 * this exposes connect/disconnect explicitly (ref-counted, see `refCount`
 * above), because a web page's components mount and unmount on every route
 * change — and, now that both a global notifications bell and a
 * screen-specific list can each want the connection at once, more than one
 * at a time — so something has to own opening/closing it to match. */
const SocketService = {
  /** Connects (reusing an already-open connection for the same token) and
   * identifies this session to the server, mirroring mobile's
   * `socket.emit("setUserID", userId)` right after connecting. Each call
   * must be paired with exactly one later `disconnect()` call. */
  connect(token: string, userId: string): Socket {
    const s = getSocket(token);
    refCount++;
    if (!s.connected) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[socket] connecting, setUserID:", userId);
      }
      s.connect();
      s.emit("setUserID", userId);
    }
    return s;
  },

  /** Releases one `connect()` call's hold on the connection — only actually
   * disconnects once every subscriber has done the same. */
  disconnect(): void {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) socket?.disconnect();
  },

  /** Snapshot for on-screen debugging (see NotificationBell's dev-only
   * footer) — not reactive, so callers poll it rather than subscribing. */
  getDebugStatus(): { connected: boolean; socketId?: string } {
    return { connected: socket?.connected ?? false, socketId: socket?.id };
  },
};

export default SocketService;
