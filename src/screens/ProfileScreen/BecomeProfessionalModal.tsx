"use client";

import { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import SkillsPicker from "@/components/SkillsPicker";
import SwitchProfessionalService, {
  PROFESSIONAL_TYPES,
  DEFAULT_PROFESSIONAL_DESCRIPTION,
  buildSkillsPayload,
  type ProfessionalCategoryOption,
  type ProfessionalSubCategoryOption,
  type ProfessionalSkillRecord,
  type AuthTokenPairRecord,
} from "@/services/SwitchProfessionalService";

/** Web counterpart of homedot-mobile-app's PerfessionalInfoRegisterScreen +
 * BecomeaProfessionalSkillsScreen, collapsed into a single modal (this app's
 * established pattern for multi-field flows — see EnquiryEditModal,
 * ContactUpdateModal) instead of mobile's two-screen navigation. Only the
 * "already signed in, adding the professional role" path is implemented —
 * mobile's initial-signup variant of this same screen collects name/contact
 * too, which doesn't apply here since the account already exists. */
export default function BecomeProfessionalModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (tokens: AuthTokenPairRecord | undefined) => void;
}) {
  const [professionalType, setProfessionalType] = useState<number | null>(null);
  const [categories, setCategories] = useState<ProfessionalCategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subCategories, setSubCategories] = useState<ProfessionalSubCategoryOption[]>([]);
  const [subCategoryId, setSubCategoryId] = useState("");
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [experience, setExperience] = useState("");

  const [selectedSkills, setSelectedSkills] = useState<ProfessionalSkillRecord[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SwitchProfessionalService.getCategories().then((res) => {
      if (res.success && res.data?.status) setCategories(res.data.data);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubCategoryId("");
    setSubCategories([]);
    setSelectedSkills([]);
    if (!id) return;
    setLoadingSubCategories(true);
    SwitchProfessionalService.getSubCategories(id).then((res) => {
      setLoadingSubCategories(false);
      if (res.success && res.data?.status) setSubCategories(res.data.data);
    });
  };

  const onSubCategoryChange = (id: string) => {
    setSubCategoryId(id);
    setSelectedSkills([]);
  };

  const selectedType = PROFESSIONAL_TYPES.find((t) => t.id === professionalType);
  const expNum = Number(experience);
  const canSubmit =
    !!selectedType &&
    !!categoryId &&
    !!subCategoryId &&
    selectedSkills.length > 0 &&
    experience.trim() !== "" &&
    Number.isFinite(expNum) &&
    expNum >= 0 &&
    expNum <= 70;

  const submit = async () => {
    if (!canSubmit || !selectedType) {
      setError("Please fill in every field and select at least one skill.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await SwitchProfessionalService.becomeProfessional({
      professionalCategory: categoryId,
      subCategory: subCategoryId,
      professionalType: selectedType.title,
      experience: experience.trim(),
      description: DEFAULT_PROFESSIONAL_DESCRIPTION,
      skills: buildSkillsPayload(selectedSkills, {
        levelOneId: categoryId,
        levelOneName: categories.find((c) => c._id === categoryId)?.categoryName || "",
        levelTwoId: subCategoryId,
        levelTwoName: subCategories.find((s) => s.subcategoryId === subCategoryId)?.subcategoryName || "",
      }),
    });
    setSubmitting(false);
    if (!res.success || res.data?.status === false) {
      setError(res.data?.message || res.message || "Something went wrong. Please try again.");
      return;
    }
    onSuccess(res.data?.data?.[0]);
  };

  return (
    <div className="eq-modal-overlay" onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} className="eq-modal-card" style={cardStyle}>
        <div
          style={{
            background: `linear-gradient(150deg, ${colors.primaryDeep}, ${colors.primary})`,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(255,255,255,0.16)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="arrowLeft" size={17} color="#fff" />
          </button>
          <div>
            <p style={{ color: "#fff", fontSize: fontSize.md - 1, fontWeight: 700, margin: 0 }}>Become a Professional</p>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: fontSize.xs, margin: 0, marginTop: 1 }}>
              Tell us about your trade to unlock your professional profile
            </p>
          </div>
        </div>

        <div style={{ padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <SectionLabel>Professional type</SectionLabel>
            <div style={{ display: "flex", gap: 10 }}>
              {PROFESSIONAL_TYPES.map((t) => {
                const active = t.id === professionalType;
                return (
                  <button
                    key={t.id}
                    onClick={() => setProfessionalType(t.id)}
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: radius.md,
                      border: `1.5px solid ${active ? colors.primary : colors.line}`,
                      background: active ? colors.primarySoft : colors.bg,
                      color: active ? colors.primary : colors.ink2,
                      fontSize: fontSize.sm,
                      fontWeight: 600,
                    }}
                  >
                    {t.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <SectionLabel>Category</SectionLabel>
            <SelectBox
              value={categoryId}
              onChange={onCategoryChange}
              placeholder="Select a category"
              options={categories.map((c) => ({ value: c._id, label: c.categoryName }))}
            />
          </div>

          <div>
            <SectionLabel>Sub category</SectionLabel>
            <SelectBox
              value={subCategoryId}
              onChange={onSubCategoryChange}
              placeholder={!categoryId ? "Select a category first" : loadingSubCategories ? "Loading…" : "Select a sub category"}
              options={subCategories.map((s) => ({ value: s.subcategoryId, label: s.subcategoryName }))}
              disabled={!categoryId || loadingSubCategories}
            />
          </div>

          <div>
            <SectionLabel>Skills</SectionLabel>
            <SkillsPicker categoryId={categoryId} subCategoryId={subCategoryId} selected={selectedSkills} onChange={setSelectedSkills} />
          </div>

          <div>
            <SectionLabel>Years of experience</SectionLabel>
            <div style={inputWrap}>
              <Icon name="clock" size={15} color={colors.muted} />
              <input
                type="number"
                min={0}
                max={70}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 5"
                style={fieldInputStyle}
              />
            </div>
          </div>

          {error && <p style={{ color: "#C0392B", fontSize: fontSize.sm, margin: 0 }}>{error}</p>}
        </div>

        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={submit}
            disabled={submitting || !canSubmit}
            style={{
              height: 52,
              borderRadius: radius.md,
              background: canSubmit ? colors.primary : colors.line,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: fontSize.md - 1,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {submitting ? "Submitting…" : "Become a Professional"}
          </button>
          <button onClick={onClose} style={{ padding: "10px 0", fontSize: fontSize.sm, fontWeight: 600, color: colors.muted, textAlign: "center" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10.5, fontWeight: 700, color: colors.muted, letterSpacing: 0.6, textTransform: "uppercase", margin: 0, marginBottom: 8 }}>
      {children}
    </p>
  );
}

function SelectBox({
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div style={{ ...inputWrap, position: "relative", paddingRight: 38, opacity: disabled ? 0.6 : 1 }}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...fieldInputStyle, appearance: "none", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: colors.muted, fontSize: 11 }}>
        ▾
      </span>
    </div>
  );
}

const inputWrap = {
  display: "flex" as const,
  alignItems: "center" as const,
  gap: spacing.sm + 2,
  height: 46,
  border: `1.5px solid ${colors.line}`,
  borderRadius: radius.md,
  padding: "0 14px",
  background: colors.bg,
};

const fieldInputStyle = {
  border: "none",
  outline: "none",
  background: "none",
  width: "100%",
  fontSize: fontSize.sm,
  color: colors.ink,
};

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
  maxHeight: "90vh",
  overflowY: "auto" as const,
};
