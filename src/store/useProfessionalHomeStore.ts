import { create } from "zustand";
import ProfessionalDashboardService, { type ProfessionalHomeRecord } from "@/services/ProfessionalDashboardService";
import { getAuthToken } from "@/utils/authStorage";

interface ProfessionalHomeState {
  home: ProfessionalHomeRecord | null;
  loaded: boolean;
  loading: boolean;
  // Always re-fetches (unlike useProfileStore's fetch-once-per-session) —
  // enquiry counts/totalProjects/rating genuinely change between visits, so
  // every professional screen calls this on mount. Guards only against a
  // second call piling on top of one already in flight.
  refresh: () => Promise<void>;
  // Lets a save action (edit profile, upload photo, manage skills) patch the
  // shared record directly when the API echoes it back, so every mounted
  // screen reading from this store — dashboard greeting, sidebar, profile
  // page — updates immediately without a page refresh or a round-trip fetch.
  setHome: (home: ProfessionalHomeRecord) => void;
  clear: () => void;
}

export const useProfessionalHomeStore = create<ProfessionalHomeState>((set, get) => ({
  home: null,
  loaded: false,
  loading: false,

  refresh: async () => {
    if (get().loading || !getAuthToken()) return;
    set({ loading: true });
    const res = await ProfessionalDashboardService.getHome();
    if (res.success && res.data?.status && res.data.data?.[0]) {
      set({ home: res.data.data[0], loaded: true, loading: false });
    } else {
      set({ loading: false, loaded: true });
    }
  },

  setHome: (home) => set({ home, loaded: true }),

  clear: () => set({ home: null, loaded: false, loading: false }),
}));
