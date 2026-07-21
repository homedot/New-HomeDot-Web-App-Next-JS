"use client";

import { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";

/** Web counterpart of the response text box homedot-mobile-app's
 * JobEnquiryScreen/DirectEnquiryScreen open inline on an enquiry card's
 * "Accept" tap — surfaced as its own modal here, this app's established
 * pattern for a single-field mutating action (see ContactUpdateModal,
 * EnquiryEditModal). */
export default function EnquiryRespondModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    if (!text.trim()) {
      setError(true);
      return;
    }
    setSubmitting(true);
    await onSubmit(text.trim());
    setSubmitting(false);
  };

  return (
    <div className="eq-modal-overlay" onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} className="eq-modal-card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 20px", borderBottom: `1px solid ${colors.line}` }}>
          <div style={{ paddingRight: 12 }}>
            <p style={{ fontSize: fontSize.md - 1, fontWeight: 700, color: colors.ink, margin: 0 }}>Respond to enquiry</p>
            <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0, marginTop: 2 }}>Let the customer know you&apos;re interested</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: colors.muted, flexShrink: 0 }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ padding: "18px 20px 20px" }}>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(false);
            }}
            placeholder="Introduce yourself and how you can help…"
            rows={4}
            autoFocus
            style={{
              width: "100%",
              border: `1.5px solid ${error ? "#F87171" : colors.line}`,
              background: error ? "#FFF5F5" : colors.bg,
              borderRadius: radius.md,
              padding: "12px 14px",
              fontSize: fontSize.sm,
              color: colors.ink,
              resize: "vertical",
              outline: "none",
            }}
          />
          {error && <p style={{ color: "#F87171", fontSize: fontSize.xs, marginTop: 6 }}>Please write a response before submitting</p>}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, height: 48, borderRadius: radius.md, border: `1.5px solid ${colors.line}`, background: colors.bg, color: colors.ink2, fontSize: fontSize.sm, fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              style={{ flex: 2, height: 48, borderRadius: radius.md, background: colors.primary, color: "#fff", fontSize: fontSize.sm, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon name="check" size={15} color="#fff" /> {submitting ? "Sending…" : "Send response"}
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
  width: "min(460px, 100%)",
  background: colors.card,
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
  maxHeight: "88vh",
  overflowY: "auto" as const,
};
