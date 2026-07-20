"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import EnquiryService, { type EnquiryRecord } from "@/services/EnquiryService";
import EnquiryCard from "./EnquiryCard";
import EnquiryEditModal from "./EnquiryEditModal";
import EnquiryResponseModal from "./EnquiryResponseModal";

/** Web counterpart of homedot-mobile-app's Enquiries tab
 * (NotificatinTabViewNavigator.js's "second" route + NotificationEnquiresCards.js).
 * Every mutating action (pin/delete/edit/accept/decline) re-fetches page 1
 * fresh afterward rather than patching local state — mirrors mobile's own
 * refreshEnquiries pattern, since pin state can reorder the list server-side. */
export default function EnquiriesPanel() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    EnquiryService.getEnquiries(1).then((res) => {
      if (cancelled) return;
      setLoading(false);
      const data = res.data?.data?.[0]?.enquires?.[0]?.data ?? [];
      if (res.success && res.data?.status) {
        setEnquiries(data);
        setHasMore(data.length >= 5);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = async (message?: string) => {
    const res = await EnquiryService.getEnquiries(1);
    const data = res.data?.data?.[0]?.enquires?.[0]?.data ?? [];
    if (res.success && res.data?.status) {
      setEnquiries(data);
      setPage(1);
      setHasMore(data.length >= 5);
    }
    if (message) setToast(message);
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await EnquiryService.getEnquiries(nextPage);
    setLoadingMore(false);
    const next = res.data?.data?.[0]?.enquires?.[0]?.data ?? [];
    if (res.success && res.data?.status && next.length > 0) {
      setEnquiries((prev) => {
        const existingIds = new Set(prev.map((e) => e._id));
        return [...prev, ...next.filter((e) => !existingIds.has(e._id))];
      });
      setPage(nextPage);
      setHasMore(next.length >= 5);
    } else {
      setHasMore(false);
    }
  };

  const pin = async (id: string) => {
    const res = await EnquiryService.pinEnquiry(id);
    if (res.success && res.data?.status !== false) {
      refresh(res.data?.message || "Updated pinned enquiries.");
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const res = await EnquiryService.deleteEnquiry(deletingId);
    setDeleting(false);
    setDeletingId(null);
    if (res.success && res.data?.status !== false) {
      refresh(res.data?.message || "Enquiry deleted.");
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const editingEnquiry = enquiries.find((e) => e._id === editingId) ?? null;
  const respondingEnquiry = enquiries.find((e) => e._id === respondingId) ?? null;

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.lg }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${colors.line}` }}>
              <div className="skeleton-shimmer" style={{ height: 78 }} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="skeleton-shimmer" style={{ height: 14, width: "90%", borderRadius: 6 }} />
                <div className="skeleton-shimmer" style={{ height: 14, width: "70%", borderRadius: 6 }} />
                <div className="skeleton-shimmer" style={{ height: 36, width: "100%", borderRadius: 8, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : enquiries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 16px" }}>
          <span
            className="animate-glow-pulse"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: colors.primarySoft,
              color: colors.primary,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 18px",
            }}
          >
            <Icon name="mail" size={30} />
          </span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xl, fontWeight: 600, marginBottom: 8 }}>No enquiries yet</h2>
          <p style={{ color: colors.muted, maxWidth: 360, marginInline: "auto" }}>
            Enquiries you send to professionals will show up here, with their responses.
          </p>
        </div>
      ) : (
        <>
          <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.lg }}>
            {enquiries.map((e) => (
              <EnquiryCard
                key={e._id}
                enquiry={e}
                onPin={() => pin(e._id)}
                onDelete={() => setDeletingId(e._id)}
                onEdit={() => setEditingId(e._id)}
                onOpenResponse={() => setRespondingId(e._id)}
                onViewProject={() => e.projectInfo?.[0]?.projectSlug && router.push(`/projects?project=${e.projectInfo[0].projectSlug}`)}
              />
            ))}
          </Reveal>

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: spacing.xl }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  fontWeight: 600,
                  fontSize: fontSize.sm,
                  color: colors.ink,
                  background: colors.card,
                  border: `1.5px solid ${colors.line}`,
                  borderRadius: radius.full,
                  padding: "12px 22px",
                }}
              >
                {loadingMore ? "Loading…" : "Show more enquiries"}
              </button>
            </div>
          )}
        </>
      )}

      {editingEnquiry && (
        <EnquiryEditModal
          enquiry={editingEnquiry}
          onClose={() => setEditingId(null)}
          onSaved={(message) => {
            setEditingId(null);
            refresh(message);
          }}
        />
      )}

      {respondingEnquiry && (
        <EnquiryResponseModal
          enquiryId={respondingEnquiry._id}
          enquiryDate={respondingEnquiry.enquiryDate}
          professionalResponse={respondingEnquiry.professionalResponse}
          onClose={() => setRespondingId(null)}
          onActionComplete={(message) => {
            setRespondingId(null);
            refresh(message);
          }}
        />
      )}

      {deletingId && (
        <DeleteConfirmModal loading={deleting} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} />
      )}

      {toast && (
        <div className="eq-toast" style={toastStyle}>
          {toast}
        </div>
      )}
    </div>
  );
}

function DeleteConfirmModal({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="eq-modal-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: colors.overlay, backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="eq-modal-card"
        style={{ width: "min(400px, 100%)", background: colors.card, borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)", textAlign: "center" }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg, #DC2626, #B91C1C)" }} />
        <div style={{ padding: "34px 28px 30px" }}>
          <span style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #EF4444, #B91C1C)", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <Icon name="trash" size={30} />
          </span>
          <h2 style={{ fontSize: fontSize.lg, fontWeight: 700, marginBottom: 10 }}>Delete enquiry?</h2>
          <p style={{ color: colors.muted, fontSize: fontSize.sm, lineHeight: 1.55, marginBottom: spacing.lg }}>
            This action cannot be undone. Are you sure you want to delete this enquiry?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{ height: 50, borderRadius: radius.md, background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: fontSize.sm }}
            >
              {loading ? "Deleting…" : "Yes, delete it"}
            </button>
            <button onClick={onClose} style={{ height: 50, borderRadius: radius.md, border: `1.5px solid ${colors.line}`, color: colors.ink2, fontWeight: 600, fontSize: fontSize.sm }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const toastStyle = {
  position: "fixed" as const,
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1100,
  background: colors.ink,
  color: colors.white,
  padding: "12px 20px",
  borderRadius: radius.full,
  fontSize: fontSize.sm,
  fontWeight: 600,
  boxShadow: "0 20px 40px -14px rgba(0,0,0,0.35)",
};
