"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import type { NotificationRecord } from "@/services/NotificationService";
import SocketService from "@/services/SocketService";

/** Bell icon + dropdown panel for the "Alerts" feed from
 * useNotificationsFeed — the web counterpart of homedot-mobile-app's
 * NotificatinTabViewNavigator.js / ProfessionalNotificationTabViewNavigator.js
 * "Alerts" tab. Purely a display for whatever that hook already fetched/grew
 * (no mark-as-read call — mobile doesn't have one either, `isNewNotification`
 * is a client-only flag that just marks entries added since this page
 * loaded). */
export default function NotificationBell({
  notifications,
  loading,
  debugUserId,
}: {
  notifications: NotificationRecord[];
  loading?: boolean;
  // Dev-only diagnostic: the id useNotificationSocket connected with (or
  // undefined if it never had one to connect with) — surfaced in the panel
  // footer so "is this actually working" doesn't require opening DevTools.
  // See SocketService's [socket] console logs for the rest of the picture.
  debugUserId?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [debugStatus, setDebugStatus] = useState(() => SocketService.getDebugStatus());

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // getDebugStatus() is a plain, non-reactive snapshot, so this polls it
  // while the panel is open rather than subscribing to it.
  useEffect(() => {
    if (!open || process.env.NODE_ENV === "production") return;
    const id = setInterval(() => setDebugStatus(SocketService.getDebugStatus()), 1000);
    return () => clearInterval(id);
  }, [open]);

  const unreadCount = notifications.filter((n) => n.isNewNotification).length;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={{
          position: "relative",
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: `1px solid ${colors.line}`,
          background: colors.card,
          color: colors.ink2,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="bell" size={17} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 6,
              right: 7,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#E5484D",
              border: `1.5px solid ${colors.card}`,
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 340,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: 420,
            overflowY: "auto",
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.md,
            boxShadow: shadow.md,
            zIndex: 200,
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              padding: "14px 16px",
              borderBottom: `1px solid ${colors.line}`,
              fontWeight: 700,
              fontSize: fontSize.sm,
              color: colors.ink,
              background: colors.card,
            }}
          >
            Notifications
          </div>

          {loading ? (
            <p style={{ padding: "24px 16px", textAlign: "center", color: colors.muted, fontSize: fontSize.sm }}>
              Loading…
            </p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: "24px 16px", textAlign: "center", color: colors.muted, fontSize: fontSize.sm }}>
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "12px 16px",
                  borderBottom: `1px solid ${colors.line}`,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    marginTop: 6,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: n.isNewNotification ? "#E5484D" : "transparent",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: fontSize.sm, color: colors.ink, lineHeight: 1.45 }}>
                    {n.message}
                  </p>
                  {n.createdAt && (
                    <span style={{ fontSize: fontSize.xs, color: colors.muted }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {process.env.NODE_ENV !== "production" && (
            <div
              style={{
                padding: "8px 16px",
                fontSize: 10.5,
                fontFamily: "monospace",
                color: colors.muted,
                background: colors.bg,
                borderTop: `1px solid ${colors.line}`,
              }}
            >
              dev: uid={debugUserId ?? "none"} · socket=
              {debugStatus.connected ? `connected (${debugStatus.socketId})` : "disconnected"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
