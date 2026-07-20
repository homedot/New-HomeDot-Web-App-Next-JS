"use client";

import { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import EnquiryService, { type EnquiryProfessionalResponse, type EnquiryResponseDetail } from "@/services/EnquiryService";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Web counterpart of homedot-mobile-app's response + decline-reason modals
 * (NotificationEnquiresCards.js) — merged into one component with an
 * internal step, same pattern ContactUpdateModal uses for its enter/otp
 * steps. */
export default function EnquiryResponseModal({
  enquiryId,
  enquiryDate,
  professionalResponse,
  onClose,
  onActionComplete,
}: {
  enquiryId: string;
  enquiryDate: string;
  professionalResponse: EnquiryProfessionalResponse[];
  onClose: () => void;
  onActionComplete: (message: string) => void;
}) {
  const [step, setStep] = useState<"view" | "decline">("view");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<EnquiryResponseDetail | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const professionalId = professionalResponse[0]?.professional;

  useEffect(() => {
    let cancelled = false;
    EnquiryService.getResponseDetail(enquiryId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success && res.data?.status && res.data.data?.[0]) {
        setDetail(res.data.data[0]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enquiryId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const accept = async () => {
    if (!professionalId) return;
    setSubmitting(true);
    const res = await EnquiryService.acceptResponse(enquiryId, professionalId);
    setSubmitting(false);
    if (res.success && res.data?.status !== false) {
      onActionComplete(res.data?.message || "Project accepted!");
    }
  };

  const submitDecline = async () => {
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    if (!professionalId) return;
    setSubmitting(true);
    const res = await EnquiryService.rejectResponse(enquiryId, professionalId, reason.trim());
    setSubmitting(false);
    if (res.success) {
      onActionComplete(res.data?.message || "Response declined.");
    }
  };

  return (
    <div className="eq-modal-overlay" onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} className="eq-modal-card" style={cardStyle}>
        {step === "view" ? (
          <>
            <div style={{ background: `linear-gradient(150deg, ${colors.primaryDeep}, ${colors.primary})`, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="mail" size={19} color="#fff" />
                </span>
                <div>
                  <p style={{ color: "#fff", fontSize: fontSize.md - 1, fontWeight: 700, margin: 0 }}>Professional response</p>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: fontSize.xs, margin: 0, marginTop: 1 }}>Your enquiry has a reply</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" style={{ color: "rgba(255,255,255,0.8)", flexShrink: 0 }}>
                <Icon name="close" size={18} color="rgba(255,255,255,0.8)" />
              </button>
            </div>

            <div style={{ padding: "18px 20px 4px" }}>
              {loading ? (
                <p style={{ color: colors.muted, fontSize: fontSize.sm, textAlign: "center", padding: "24px 0" }}>Loading response…</p>
              ) : !detail ? (
                <p style={{ color: colors.muted, fontSize: fontSize.sm, textAlign: "center", padding: "24px 0" }}>Couldn&apos;t load this response.</p>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 22, background: colors.primarySoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: fontSize.md, fontWeight: 700, color: colors.primary }}>
                        {detail.professional?.charAt(0).toUpperCase() || "P"}
                      </span>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: fontSize.base, fontWeight: 700, color: colors.ink, margin: 0 }}>{detail.professional}</p>
                      <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0, marginTop: 2 }}>Professional service provider</p>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#DCFCE7", borderRadius: radius.full, padding: "4px 8px", flexShrink: 0 }}>
                      <Icon name="check" size={11} color="#059669" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>Responded</span>
                    </span>
                  </div>

                  <div style={{ height: 1, background: colors.line, marginBottom: 16 }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                    <DetailRow icon="briefcase" label="Category" value={detail.professionalInfo?.professionalCategoryName || "—"} />
                    <DetailRow icon="location" label="Location" value={detail.location || "—"} />
                    <DetailRow icon="calendar" label="Date" value={formatDate(enquiryDate)} />
                  </div>

                  {!!detail.responseText && (
                    <div style={{ background: colors.primary + "08", borderLeft: `3px solid ${colors.primary}`, borderRadius: radius.md, padding: 14, marginBottom: 4 }}>
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.primary, textTransform: "uppercase", letterSpacing: 0.6, margin: 0, marginBottom: 6 }}>
                        Message from professional
                      </p>
                      <p style={{ fontSize: fontSize.sm, color: colors.ink2, lineHeight: 1.6, margin: 0 }}>{detail.responseText}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ padding: "16px 20px 20px" }}>
              {professionalResponse[0]?.userReject ? (
                <Notice icon="close" color="#F87171" bg="#FFF5F5" border="#FCA5A5" text="You declined this response" />
              ) : detail?.userAccepted ? (
                <Notice icon="check" color="#059669" bg="#F0FDF4" border="#86EFAC" text="You accepted this project" />
              ) : (
                !loading &&
                detail && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => setStep("decline")} style={declineBtnStyle}>
                      <Icon name="close" size={15} color="#64748b" /> Decline
                    </button>
                    <button onClick={accept} disabled={submitting} style={acceptBtnStyle}>
                      <Icon name="check" size={15} color="#fff" /> {submitting ? "Accepting…" : "Accept project"}
                    </button>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 20px", borderBottom: `1px solid ${colors.line}` }}>
              <div style={{ paddingRight: 12 }}>
                <p style={{ fontSize: fontSize.md - 1, fontWeight: 700, color: colors.ink, margin: 0 }}>Decline response</p>
                <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0, marginTop: 2 }}>Share your reason so the professional can improve</p>
              </div>
              <button onClick={() => setStep("view")} aria-label="Back" style={{ color: colors.muted, flexShrink: 0 }}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div style={{ padding: "18px 20px 20px" }}>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setReasonError(false);
                }}
                placeholder="Tell us why you're declining this response…"
                rows={4}
                autoFocus
                style={{
                  width: "100%",
                  border: `1.5px solid ${reasonError ? "#F87171" : colors.line}`,
                  background: reasonError ? "#FFF5F5" : colors.bg,
                  borderRadius: radius.md,
                  padding: "12px 14px",
                  fontSize: fontSize.sm,
                  color: colors.ink,
                  resize: "vertical",
                  outline: "none",
                }}
              />
              {reasonError && (
                <p style={{ display: "flex", alignItems: "center", gap: 5, color: "#F87171", fontSize: fontSize.xs, marginTop: 6 }}>
                  Please enter your reason before submitting
                </p>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button onClick={() => setStep("view")} style={declineBtnStyle}>
                  Cancel
                </button>
                <button
                  onClick={submitDecline}
                  disabled={submitting}
                  style={{ ...acceptBtnStyle, background: "#DC2626" }}
                >
                  <Icon name="close" size={15} color="#fff" /> {submitting ? "Submitting…" : "Submit decline"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: "briefcase" | "location" | "calendar"; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: colors.bg, borderRadius: radius.md, padding: 12 }}>
      <Icon name={icon} size={15} color={colors.primary} />
      <span style={{ fontSize: fontSize.xs, color: colors.muted, fontWeight: 500, width: 62, flexShrink: 0, marginTop: 1 }}>{label}</span>
      <span style={{ flex: 1, fontSize: fontSize.sm - 0.5, fontWeight: 600, color: colors.ink }}>{value}</span>
    </div>
  );
}

function Notice({ icon, color, bg, border, text }: { icon: "check" | "close"; color: string; bg: string; border: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: bg, border: `1px solid ${border}`, borderRadius: radius.md, padding: 12 }}>
      <Icon name={icon} size={16} color={color} />
      <span style={{ fontSize: fontSize.sm, fontWeight: 600, color }}>{text}</span>
    </div>
  );
}

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1000,
  background: colors.overlay,
  backdropFilter: "blur(7px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const cardStyle = {
  width: "min(440px, 100%)",
  background: colors.card,
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
  maxHeight: "88vh",
  overflowY: "auto" as const,
};

const declineBtnStyle = {
  flex: 1,
  height: 48,
  borderRadius: radius.md,
  border: `1.5px solid ${colors.line}`,
  background: colors.bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: fontSize.sm,
  fontWeight: 600,
  color: colors.ink2,
};

const acceptBtnStyle = {
  flex: 2,
  height: 48,
  borderRadius: radius.md,
  background: colors.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: fontSize.sm,
  fontWeight: 700,
  color: "#fff",
};
