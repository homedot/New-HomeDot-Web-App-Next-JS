"use client";

import { useSocketEvent } from "./useSocketEvent";

export interface SocketNotification {
  message: string;
}

/** Subscribes to the live "notification" event pushed over the shared
 * chat/notification socket (mirrors homedot-mobile-app's SocketServices.js +
 * its per-screen `socket.on("notification", ...)` usage in
 * NotificatinTabViewNavigator.js / ProfessionalNotificationTabViewNavigator.js)
 * — call it with whatever the caller wants to happen the moment the backend
 * pushes a new enquiry/response (refetch a list, show a toast, ...) instead
 * of waiting on a manual refresh.
 *
 * `userId` is the id `setUserID` identifies this connection with — the
 * backend room/target it uses to route pushes to *this* account, so it must
 * be sourced the same way mobile does per screen: the plain user id
 * (`userDetails._id` there, `profile._id` here) on the user side, but
 * `professionalDetails[0].professionalInfo[0].userId` (here,
 * `home.professionalInfo[0].userId`) on the professional side — passing the
 * wrong one connects fine (the auth token is still valid) but the server
 * never associates the socket with this account's notifications, so nothing
 * ever arrives. No-ops (and cleans up) while it's undefined — signed out, or
 * the owning store hasn't loaded yet — and reconnects once it is.
 *
 * See useSocketEvent (the shared machinery this wraps) for why this always
 * tears the connection down on unmount, unlike mobile's version. */
export function useNotificationSocket(
  userId: string | undefined,
  onNotification: (notification: SocketNotification) => void,
) {
  useSocketEvent<SocketNotification>(userId, "notification", onNotification);
}
