import ApiService, { type ApiResponse } from "./ApiService";
import { API_ENDPOINTS } from "@/constants/ApiConstants";

// Mirrors the shape homedot-mobile-app's NotificatinTabViewNavigator.js /
// ProfessionalNotificationTabViewNavigator.js render off each list item.
// `isNewNotification` only ever comes from the client side there (set true
// on the entry a live socket push adds, absent on ones loaded from the API)
// — kept optional for the same reason here.
export interface NotificationRecord {
  _id: string;
  message: string;
  createdAt?: string;
  type?: string;
  isNewNotification?: boolean;
}

export interface NotificationListBody {
  status: boolean;
  message: string;
  data: NotificationRecord[];
}

// Requires a stored auth token, both methods. Mirrors homedot-mobile-app's
// NotificationServices.js (professionalNotification / userlNotification) —
// same two flat, unpaginated GET calls, one per role.
const NotificationService = {
  getUserNotifications: (): Promise<ApiResponse<NotificationListBody>> =>
    ApiService.get<NotificationListBody>(API_ENDPOINTS.USER.NOTIFICATION_LIST),

  getProfessionalNotifications: (): Promise<ApiResponse<NotificationListBody>> =>
    ApiService.get<NotificationListBody>(API_ENDPOINTS.PROFESSIONAL.NOTIFICATION_LIST),
};

export default NotificationService;
