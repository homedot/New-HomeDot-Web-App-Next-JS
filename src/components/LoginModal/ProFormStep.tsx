"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import type { LocationValue } from "@/components/LocationMapPicker";
import EmailField, { type EmailFieldHandle } from "@/components/EmailField";
import SkillsPicker from "@/components/SkillsPicker";
import SwitchProfessionalService, {
  PROFESSIONAL_TYPES,
  buildSkillsPayload,
  type ProfessionalCategoryOption,
  type ProfessionalSubCategoryOption,
  type ProfessionalSkillRecord,
} from "@/services/SwitchProfessionalService";
import CountryCodeSelect from "./CountryCodeSelect";
import { inputWrap, fieldInputStyle, Field, digitLimitFor, type Method } from "./shared";

export interface ProFormValues {
  professionalType: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  /** Pre-built via SwitchProfessionalService.buildSkillsPayload — each entry
   * already carries the full category/sub-category hierarchy alongside its
   * own levelThreeId/levelThreeName, matching what the signup API expects. */
  skills: string[];
  name: string;
  countryCode: string;
  mobile: string;
  email: string;
  experience: string;
  description: string;
  location: LocationValue;
}

export default function ProFormStep({
  method,
  contactValue,
  countryCode,
  location,
  onChangeLocation,
  onBack,
  onSubmit,
}: {
  method: Method;
  contactValue: string;
  countryCode: string;
  location: LocationValue;
  onChangeLocation: () => void;
  onBack: () => void;
  /** Resolves to `null` on success, or an error message to display inline
   * (the step stays mounted so the user doesn't lose entered data). */
  onSubmit: (values: ProFormValues) => Promise<string | null>;
}) {
  const [professionalType, setProfessionalType] = useState<number | null>(null);
  const [categories, setCategories] = useState<ProfessionalCategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subCategories, setSubCategories] = useState<ProfessionalSubCategoryOption[]>([]);
  const [subCategoryId, setSubCategoryId] = useState("");
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<ProfessionalSkillRecord[]>([]);
  const [name, setName] = useState("");
  const [cc, setCc] = useState(countryCode);
  const [mobile, setMobile] = useState(
    method === "phone" ? contactValue.replace(/\D/g, "") : "",
  );
  const [email, setEmail] = useState(method === "email" ? contactValue : "");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailFieldRef = useRef<EmailFieldHandle>(null);

  useEffect(() => {
    SwitchProfessionalService.getCategories().then((res) => {
      if (res.success && res.data?.status) setCategories(res.data.data);
    });
  }, []);

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

  const digitLimit = digitLimitFor(cc);
  const mobileValid = mobile.replace(/\D/g, "").length === digitLimit;
  const emailValid = /\S+@\S+\.\S+/.test(email);
  const selectedType = PROFESSIONAL_TYPES.find((t) => t.id === professionalType);
  const expNum = Number(experience);
  const valid =
    !!selectedType &&
    !!categoryId &&
    !!subCategoryId &&
    selectedSkills.length > 0 &&
    name.trim().length > 1 &&
    mobileValid &&
    emailValid &&
    experience.trim() !== "" &&
    Number.isFinite(expNum) &&
    expNum >= 0 &&
    expNum <= 70;

  const handleSubmit = async () => {
    if (!valid || !selectedType || submitting) return;
    setSubmitting(true);
    setError(null);
    // The email step's own OTP flow already ran it through ZeroBounce; only
    // a freshly-typed email (phone signup) needs validating here.
    if (method === "phone") {
      const emailOk = await emailFieldRef.current?.validate();
      if (!emailOk) {
        setSubmitting(false);
        return;
      }
    }
    const categoryName = categories.find((c) => c._id === categoryId)?.categoryName || "";
    const subCategoryName =
      subCategories.find((s) => s.subcategoryId === subCategoryId)?.subcategoryName || "";
    const errorMessage = await onSubmit({
      professionalType: selectedType.title,
      categoryId,
      categoryName,
      subCategoryId,
      subCategoryName,
      skills: buildSkillsPayload(selectedSkills, {
        levelOneId: categoryId,
        levelOneName: categoryName,
        levelTwoId: subCategoryId,
        levelTwoName: subCategoryName,
      }),
      name: name.trim(),
      countryCode: cc,
      mobile,
      email,
      experience: experience.trim(),
      description: description.trim(),
      location,
    });
    setSubmitting(false);
    if (errorMessage) setError(errorMessage);
  };

  return (
    <div className="login-step">
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: fontSize.sm + 0.5,
          fontWeight: 600,
          color: colors.muted,
          marginBottom: spacing.lg,
        }}
      >
        <Icon name="arrowLeft" size={17} /> Back
      </button>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          letterSpacing: "-0.02em",
          marginBottom: spacing.sm,
        }}
      >
        Create your professional account
      </h1>
      <p
        style={{
          fontSize: fontSize.base,
          color: colors.muted,
          lineHeight: 1.5,
          marginBottom: spacing.xl - 2,
        }}
      >
        Tell homeowners what you do and how to reach you.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
        <SelectField
          label="Professional Type"
          value={professionalType !== null ? String(professionalType) : ""}
          placeholder="Select"
          options={PROFESSIONAL_TYPES.map((t) => ({ value: String(t.id), label: t.title }))}
          onChange={(v) => setProfessionalType(Number(v))}
        />

        <Field label="Name">
          <div style={inputWrap}>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={fieldInputStyle}
            />
          </div>
        </Field>

        <Field label="Mobile Number">
          <div style={inputWrap}>
            <CountryCodeSelect value={cc} onChange={setCc} disabled={method === "phone"} />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98470 11223"
              value={mobile}
              readOnly={method === "phone"}
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, "").slice(0, digitLimit))
              }
              style={{ ...fieldInputStyle, opacity: method === "phone" ? 0.7 : 1 }}
            />
          </div>
          {method === "email" && (
            <span style={{ fontSize: fontSize.xs, color: colors.muted }}>
              {mobile.length}/{digitLimit} digits
            </span>
          )}
        </Field>

        <Field label="Email">
          <EmailField
            ref={emailFieldRef}
            value={email}
            onChange={setEmail}
            readOnly={method === "email"}
            placeholder="Email address"
            wrapStyle={inputWrap}
            inputStyle={{ ...fieldInputStyle, opacity: method === "email" ? 0.7 : 1 }}
          />
        </Field>

        <SelectField
          label="Professional category"
          value={categoryId}
          placeholder="Select a category"
          options={categories.map((c) => ({ value: c._id, label: c.categoryName }))}
          onChange={onCategoryChange}
        />

        <SelectField
          label="Sub category"
          value={subCategoryId}
          placeholder={
            !categoryId
              ? "Choose a category first"
              : loadingSubCategories
                ? "Loading…"
                : "Select a sub category"
          }
          options={subCategories.map((s) => ({ value: s.subcategoryId, label: s.subcategoryName }))}
          disabled={!categoryId || loadingSubCategories}
          onChange={onSubCategoryChange}
        />

        <Field label="Skills">
          <SkillsPicker
            categoryId={categoryId}
            subCategoryId={subCategoryId}
            selected={selectedSkills}
            onChange={setSelectedSkills}
          />
        </Field>

        <Field label="Years of Experience">
          <div style={inputWrap}>
            <input
              type="number"
              min={0}
              max={70}
              placeholder="Experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              style={fieldInputStyle}
            />
          </div>
        </Field>

        <Field label="Description (optional)">
          <textarea
            placeholder="Tell homeowners about your trade — leave blank to use a default description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              border: `1.5px solid ${colors.line}`,
              borderRadius: radius.md,
              padding: "14px 16px",
              fontSize: fontSize.md - 0.5,
              color: colors.ink,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </Field>

        <Field label="Location">
          <div style={{ ...inputWrap, justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: spacing.sm, minWidth: 0 }}>
              <Icon name="location" size={18} color={colors.muted} />
              <span
                style={{
                  fontSize: fontSize.md - 0.5,
                  color: colors.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {location.address}
              </span>
            </span>
            <button
              onClick={onChangeLocation}
              style={{
                flexShrink: 0,
                fontSize: fontSize.sm,
                fontWeight: 600,
                color: colors.primary,
              }}
            >
              Change
            </button>
          </div>
        </Field>
      </div>

      {error && (
        <p style={{ fontSize: fontSize.sm, color: "#C0392B", marginTop: spacing.md, marginBottom: 0 }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`login-cta${valid ? " is-ready" : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          width: "100%",
          height: 52,
          marginTop: spacing.xl,
          borderRadius: radius.md,
          background: colors.primary,
          color: colors.white,
          fontWeight: 600,
          fontSize: fontSize.md - 1,
          opacity: valid && !submitting ? 1 : 0.5,
        }}
      >
        {submitting ? "Submitting…" : "Submit"}
        {!submitting && <Icon name="arrow" size={18} color={colors.white} />}
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <div style={{ ...inputWrap, position: "relative", paddingRight: 40 }}>
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
        <span
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <Icon name="chevronDown" size={16} color={colors.muted} />
        </span>
      </div>
    </Field>
  );
}
