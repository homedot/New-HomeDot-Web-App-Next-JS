"use client";

import { useEffect, useState } from "react";
import { useNotificationSocket } from "./useNotificationSocket";
import NotificationService, { type NotificationRecord } from "@/services/NotificationService";

let nextLocalId = 1;

/** The "Alerts" feed from homedot-mobile-app's NotificatinTabViewNavigator.js
 * (role "user") / ProfessionalNotificationTabViewNavigator.js (role
 * "professional") — seeded once from the account's notification-list API,
 * then grown by prepending a local entry every time the shared socket
 * pushes a "notification" event, exactly like mobile's
 * `setNotifications(prev => [{ message, isNewNotification: true, _id }, ...prev])`.
 *
 * `userId` must be sourced the same way useNotificationSocket needs it —
 * see that hook's comment on why the user and professional sides read it
 * from different places. No-ops (empty list) while it's undefined. */
export function useNotificationsFeed(
  userId: string | undefined,
  role: "user" | "professional",
) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- userId reflects an external store (auth/profile), not derivable render state; see LoginModal's identical pattern
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchList =
      role === "professional"
        ? NotificationService.getProfessionalNotifications
        : NotificationService.getUserNotifications;
    fetchList().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success && res.data?.status && res.data.data) {
        setNotifications(res.data.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, role]);

  useNotificationSocket(userId, (n) => {
    setNotifications((prev) => [
      {
        _id: `local-${nextLocalId++}`,
        message: n.message,
        isNewNotification: true,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  });

  return { notifications, loading };
}
