import { create } from "zustand";
import ProfileService, { type UserProfileRecord } from "@/services/ProfileService";
import { getAuthToken } from "@/utils/authStorage";

interface ProfileState {
  profile: UserProfileRecord | null;
  loaded: boolean;
  loading: boolean;
  // Fetches once per signed-in session — SiteNav (for the header avatar) and
  // ProfileScreen both call this on mount, so this guard against re-entrant
  // calls keeps that down to a single request instead of a duplicate per page.
  fetch: () => Promise<void>;
  setProfile: (profile: UserProfileRecord) => void;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loaded: false,
  loading: false,

  fetch: async () => {
    if (get().loaded || get().loading || !getAuthToken()) return;
    set({ loading: true });
    const res = await ProfileService.getProfileDetails();
    if (res.success && res.data?.status && res.data.data) {
      set({ profile: res.data.data, loaded: true, loading: false });
    } else {
      set({ loading: false, loaded: true });
    }
  },

  setProfile: (profile) => set({ profile, loaded: true }),

  clear: () => set({ profile: null, loaded: false, loading: false }),
}));
