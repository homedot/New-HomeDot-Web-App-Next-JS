import { create } from "zustand";
import ProfileService, { type UserProfileRecord } from "@/services/ProfileService";
import {
  getAuthToken,
  getHasProfessionalRole,
  setHasProfessionalRole,
} from "@/utils/authStorage";

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
      if ((res.data.data.userType?.length ?? 0) >= 2) setHasProfessionalRole();
      set({ profile: res.data.data, loaded: true, loading: false });
    } else {
      set({ loading: false, loaded: true });
    }
  },

  setProfile: (profile) => {
    if ((profile.userType?.length ?? 0) >= 2) setHasProfessionalRole();
    set({ profile, loaded: true });
  },

  clear: () => set({ profile: null, loaded: false, loading: false }),
}));

// See getHasProfessionalRole's comment in authStorage — the latest fetch's
// userType array alone isn't a reliable signal once role switches are
// involved, so this combines it with the persisted flag. Takes any record
// with a userType field (UserProfileRecord here, ProfessionalHomeRecord in
// useProfessionalHomeStore) so both the user- and professional-side "has
// the other role" CTAs can share one source of truth.
export function deriveHasProfessionalRole(
  record?: { userType?: string[] } | null,
): boolean {
  return (record?.userType?.length ?? 0) >= 2 || getHasProfessionalRole();
}
