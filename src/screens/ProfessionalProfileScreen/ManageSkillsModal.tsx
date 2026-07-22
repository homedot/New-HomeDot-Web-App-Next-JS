"use client";

import { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import { radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import SkillsPicker from "@/components/SkillsPicker";
import type { ProfessionalSkillRecord } from "@/services/SwitchProfessionalService";

/** Web counterpart of mobile's separate "Manage Skills" screen sub-flow off
 * ProfessionalEditProfileScreen — a modal here instead (this app's
 * established pattern for sub-flows), wrapping the shared SkillsPicker and
 * scoped to the professional's existing category/sub-category (which this
 * screen doesn't let you change, matching mobile). Saves independently of
 * the main Basic Details form, same as mobile's separate skills screen. */
export default function ManageSkillsModal({
  categoryId,
  subCategoryId,
  currentSkills,
  loading,
  onClose,
  onSubmit,
}: {
  categoryId: string;
  subCategoryId: string;
  currentSkills: ProfessionalSkillRecord[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (skills: ProfessionalSkillRecord[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<ProfessionalSkillRecord[]>(currentSkills);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    if (selected.length === 0) return;
    await onSubmit(selected);
  };

  return (
    <div className="eq-modal-overlay" onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} className="eq-modal-card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 20px", borderBottom: `1px solid ${colors.line}` }}>
          <div style={{ paddingRight: 12 }}>
            <p style={{ fontSize: fontSize.md - 1, fontWeight: 700, color: colors.ink, margin: 0 }}>Manage skills</p>
            <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0, marginTop: 2 }}>Choose what best describes your expertise</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: colors.muted, flexShrink: 0 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ padding: "18px 20px 20px" }}>
          <SkillsPicker categoryId={categoryId} subCategoryId={subCategoryId} selected={selected} onChange={setSelected} />

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, height: 48, borderRadius: radius.md, border: `1.5px solid ${colors.line}`, background: colors.bg, color: colors.ink2, fontSize: fontSize.sm, fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading || selected.length === 0}
              style={{
                flex: 2,
                height: 48,
                borderRadius: radius.md,
                background: colors.primary,
                color: "#fff",
                fontSize: fontSize.sm,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: selected.length === 0 ? 0.6 : 1,
              }}
            >
              <Icon name="check" size={15} color="#fff" /> {loading ? "Saving…" : "Save skills"}
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
  width: "min(480px, 100%)",
  background: colors.card,
  borderRadius: 24,
  overflow: "hidden",
  boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
  maxHeight: "88vh",
  overflowY: "auto" as const,
};
