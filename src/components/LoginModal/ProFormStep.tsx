"use client";

import { useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import { categories, homeServices } from "@/screens/LandingScreen/data";
import type { LocationValue } from "@/components/LocationMapPicker";
import { inputWrap, fieldInputStyle, Field, COUNTRY_CODES, type Method } from "./shared";

export type ProfessionalType = "design" | "household";

const PROFESSIONAL_TYPES: { value: ProfessionalType; label: string }[] = [
  { value: "design", label: "Design & Build Professional" },
  { value: "household", label: "Household Service Provider" },
];

const CATEGORY_OPTIONS: Record<ProfessionalType, string[]> = {
  design: categories.map((c) => c.name),
  household: homeServices.map((s) => s.name),
};

export interface ProFormValues {
  professionalType: ProfessionalType;
  category: string;
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
  onSubmit: (values: ProFormValues) => void;
}) {
  const [professionalType, setProfessionalType] = useState<ProfessionalType | "">("");
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [cc, setCc] = useState(countryCode);
  const [mobile, setMobile] = useState(
    method === "phone" ? contactValue.replace(/\D/g, "") : "",
  );
  const [email, setEmail] = useState(method === "email" ? contactValue : "");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");

  const mobileValid = mobile.replace(/\D/g, "").length >= 10;
  const emailValid = /\S+@\S+\.\S+/.test(email);
  const valid =
    !!professionalType &&
    !!category &&
    name.trim().length > 1 &&
    mobileValid &&
    emailValid &&
    experience.trim().length > 0 &&
    description.trim().length > 0;

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
          value={professionalType}
          placeholder="Select"
          options={PROFESSIONAL_TYPES}
          onChange={(v) => {
            setProfessionalType(v as ProfessionalType);
            setCategory("");
          }}
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
            <select
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              disabled={method === "phone"}
              aria-label="Country code"
              style={ccSelectStyle}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98470 11223"
              value={mobile}
              readOnly={method === "phone"}
              onChange={(e) => setMobile(e.target.value)}
              style={{ ...fieldInputStyle, opacity: method === "phone" ? 0.7 : 1 }}
            />
          </div>
        </Field>

        <Field label="Email">
          <div style={inputWrap}>
            <Icon name="mail" size={18} color={colors.muted} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              readOnly={method === "email"}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...fieldInputStyle, opacity: method === "email" ? 0.7 : 1 }}
            />
          </div>
        </Field>

        <SelectField
          label="Professional category"
          value={category}
          placeholder={professionalType ? "Select" : "Choose a professional type first"}
          options={
            professionalType
              ? CATEGORY_OPTIONS[professionalType].map((name) => ({ value: name, label: name }))
              : []
          }
          disabled={!professionalType}
          onChange={setCategory}
        />

        <Field label="Year of Experience">
          <div style={inputWrap}>
            <input
              type="number"
              min={0}
              placeholder="Experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              style={fieldInputStyle}
            />
          </div>
        </Field>

        <Field label="Description">
          <textarea
            placeholder="Description"
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

      <button
        onClick={() =>
          valid &&
          professionalType &&
          onSubmit({
            professionalType,
            category,
            name: name.trim(),
            countryCode: cc,
            mobile,
            email,
            experience,
            description,
            location,
          })
        }
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
          opacity: valid ? 1 : 0.5,
        }}
      >
        Submit <Icon name="arrow" size={18} color={colors.white} />
      </button>
    </div>
  );
}

const ccSelectStyle = {
  appearance: "none",
  border: "none",
  outline: "none",
  background: "none",
  fontSize: fontSize.md,
  fontWeight: 600,
  color: colors.ink,
  flexShrink: 0,
  paddingRight: 10,
  borderRight: `1px solid ${colors.line}`,
  marginRight: 2,
} as const;

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
