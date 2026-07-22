"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/authStorage";
import ProfessionalDashboardService, {
  type ProfessionalEnquiryRecord,
  type InitiateProjectPayload,
} from "@/services/ProfessionalDashboardService";

export type EnquiryKind = "job" | "direct";

/** Shared Job/Direct enquiry data + mutations — extracted from
 * ProfessionalDashboardScreen so both it (3-item preview) and
 * ProfessionalEnquiriesScreen (full paginated list) read/act on the same
 * enquiries without duplicating the fetch/pin/respond/decline/initiate logic.
 * Checks its own auth token on mount (same convention the Dashboard screen
 * already used for this slice) rather than taking an `enabled` prop, so
 * either screen can drop it in standalone.
 *
 * `onProjectInitiated` is an optional extra callback fired (alongside the
 * usual `refresh()`) after a successful Initiate Project submission — lets
 * ProfessionalDashboardScreen also refresh its separate Projects tab so the
 * new project shows up without a full reload. */
export function useProfessionalEnquiries(onProjectInitiated?: () => void) {
  const [enquiries, setEnquiries] = useState<Record<EnquiryKind, ProfessionalEnquiryRecord[]>>({ job: [], direct: [] });
  const [enquiryCounts, setEnquiryCounts] = useState<Record<EnquiryKind, number>>({ job: 0, direct: 0 });
  const [enquiryPages, setEnquiryPages] = useState<Record<EnquiryKind, number>>({ job: 1, direct: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [decliningKind, setDecliningKind] = useState<EnquiryKind>("job");
  const [declining, setDeclining] = useState(false);
  const [initiatingId, setInitiatingId] = useState<string | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const res = await ProfessionalDashboardService.getEnquiries(1);
    setLoading(false);
    const groups = res.data?.data?.[0];
    if (!res.success || !res.data?.status || !groups) return;
    setEnquiries({
      job: groups.jobEnquiries?.[0]?.data ?? [],
      direct: groups.directEnquires?.[0]?.data ?? [],
    });
    setEnquiryCounts({
      job: groups.jobEnquiries?.[0]?.totalCount?.total_rows ?? 0,
      direct: groups.directEnquires?.[0]?.totalCount?.total_rows ?? 0,
    });
    setEnquiryPages({ job: 1, direct: 1 });
  };

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setLoading(false);
      return;
    }
    refresh();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadMore = async (kind: EnquiryKind) => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = enquiryPages[kind] + 1;
    const res = await ProfessionalDashboardService.getEnquiries(nextPage);
    setLoadingMore(false);
    const groups = res.data?.data?.[0];
    const next = kind === "job" ? groups?.jobEnquiries?.[0]?.data : groups?.directEnquires?.[0]?.data;
    if (res.success && res.data?.status && next && next.length > 0) {
      setEnquiries((prev) => ({ ...prev, [kind]: [...prev[kind], ...next] }));
      setEnquiryPages((p) => ({ ...p, [kind]: nextPage }));
    }
  };

  const pin = async (id: string) => {
    const res = await ProfessionalDashboardService.pinEnquiry(id);
    if (res.success && res.data?.status !== false) {
      refresh();
      setToast(res.data?.message || "Updated pinned enquiries.");
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const submitRespond = async (text: string) => {
    if (!respondingId) return;
    const res = await ProfessionalDashboardService.respondToEnquiry(respondingId, text);
    setRespondingId(null);
    if (res.success && res.data?.status !== false) {
      refresh();
      setToast(res.data?.message || "Response sent.");
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const openDecline = (id: string, kind: EnquiryKind) => {
    setDecliningId(id);
    setDecliningKind(kind);
  };

  const confirmDecline = async () => {
    if (!decliningId) return;
    setDeclining(true);
    const res =
      decliningKind === "job"
        ? await ProfessionalDashboardService.ignoreJobEnquiry(decliningId)
        : await ProfessionalDashboardService.rejectDirectEnquiry(decliningId);
    setDeclining(false);
    setDecliningId(null);
    if (res.success && res.data?.status !== false) {
      refresh();
      setToast(res.data?.message || (decliningKind === "job" ? "Enquiry ignored." : "Enquiry rejected."));
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const submitInitiateProject = async (payload: InitiateProjectPayload) => {
    if (!initiatingId) return;
    setInitiating(true);
    const res = await ProfessionalDashboardService.initiateProject(initiatingId, payload);
    setInitiating(false);
    if (res.success && res.data?.status !== false) {
      setInitiatingId(null);
      refresh();
      onProjectInitiated?.();
      setToast(res.data?.message || "Project created.");
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  return {
    enquiries,
    enquiryCounts,
    enquiryPages,
    loading,
    loadingMore,
    refresh,
    loadMore,
    pin,
    respondingId,
    setRespondingId,
    submitRespond,
    decliningId,
    decliningKind,
    declining,
    openDecline,
    closeDecline: () => setDecliningId(null),
    confirmDecline,
    initiatingId,
    setInitiatingId,
    initiating,
    submitInitiateProject,
    toast,
  };
}
