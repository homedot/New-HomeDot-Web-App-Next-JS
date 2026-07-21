"use client";

import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";

/** Generic confirm dialog — same visual pattern as EnquiriesScreen's
 * DeleteConfirmModal, generalized with a title/message/label so it also
 * covers the dashboard's Ignore (Job) and Reject (Direct) enquiry actions. */
export default function ConfirmModal({
  icon,
  title,
  message,
  confirmLabel,
  loading,
  onClose,
  onConfirm,
}: {
  icon: IconName;
  title: string;
  message: string;
  confirmLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="eq-modal-overlay" onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} className="eq-modal-card" style={cardStyle}>
        <div style={{ height: 4, background: "linear-gradient(90deg, #DC2626, #B91C1C)" }} />
        <div style={{ padding: "34px 28px 30px" }}>
          <span
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #EF4444, #B91C1C)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
            }}
          >
            <Icon name={icon} size={30} />
          </span>
          <h2 style={{ fontSize: fontSize.lg, fontWeight: 700, marginBottom: 10 }}>{title}</h2>
          <p style={{ color: colors.muted, fontSize: fontSize.sm, lineHeight: 1.55, marginBottom: spacing.lg }}>{message}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{ height: 50, borderRadius: radius.md, background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: fontSize.sm }}
            >
              {loading ? "Working…" : confirmLabel}
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
  width: "min(400px, 100%)",
  background: colors.card,
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
  textAlign: "center" as const,
};
