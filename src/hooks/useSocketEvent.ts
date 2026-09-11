"use client";

import { useEffect, useRef } from "react";
import { getAuthToken } from "@/utils/authStorage";
import SocketService from "@/services/SocketService";

/** Shared machinery behind useNotificationSocket ("notification") and
 * useProfessionalVerificationSocket ("professionalVerification") — every
 * distinct event homedot-mobile-app listens for on this same socket
 * connection, each with its own thin wrapper for its own payload type and
 * doc comment. See useNotificationSocket's comment for the two things that
 * matter most: `userId` must be sourced per-role the same way mobile does
 * (wrong one connects fine but the server never routes pushes to it), and —
 * unlike mobile, which opens a socket per screen and never disconnects it —
 * this always tears its hold on the connection down on unmount, since a web
 * page unmounts far more often than mobile's screen focus/blur cycle.
 * SocketService's ref-counting is what lets more than one of these (e.g. a
 * notification subscriber and a verification subscriber) share one
 * connection at once without one's unmount killing it for the other. */
export function useSocketEvent<T>(
  userId: string | undefined,
  event: string,
  onEvent: (payload: T) => void,
) {
  // Keeps the effect from re-subscribing every time the caller passes a new
  // inline callback (the common case) — only an actual identity change
  // (token/userId/event) should tear down and reopen the connection.
  // Updated in its own effect (not during render) per the rules-of-hooks
  // ref-mutation rule.
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !userId) return;

    const socket = SocketService.connect(token, userId);
    const handler = (payload: T) => onEventRef.current(payload);
    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
      SocketService.disconnect();
    };
  }, [userId, event]);
}
