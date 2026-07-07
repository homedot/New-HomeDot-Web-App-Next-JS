"use client";

import { useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import LocationMapPicker, {
  type LocationValue,
} from "@/components/LocationMapPicker";
import CountryCodeSelect from "./CountryCodeSelect";
import { inputWrap, fieldInputStyle, Field, digitLimitFor, type Method } from "./shared";

export interface UserFormValues {
  name: string;
  countryCode: string;
  mobile: string;
  email: string;
  location: LocationValue;
}

export default function UserFormStep({
  method,
  contactValue,
  countryCode,
  onBack,
  onSubmit,
}: {
  method: Method;
  contactValue: string;
  countryCode: string;
  onBack: () => void;
  onSubmit: (values: UserFormValues) => void;
}) {
  const [name, setName] = useState("");
  const [cc, setCc] = useState(countryCode);
  const [mobile, setMobile] = useState(
    method === "phone" ? contactValue.replace(/\D/g, "") : "",
  );
  const [email, setEmail] = useState(method === "email" ? contactValue : "");
  const [location, setLocation] = useState<LocationValue | null>(null);

  const digitLimit = digitLimitFor(cc);
  const mobileValid = mobile.replace(/\D/g, "").length === digitLimit;
  const emailValid = /\S+@\S+\.\S+/.test(email);
  const valid = name.trim().length > 1 && mobileValid && emailValid && !!location;

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
        Create your account
      </h1>
      <p
        style={{
          fontSize: fontSize.base,
          color: colors.muted,
          lineHeight: 1.5,
          marginBottom: spacing.xl - 2,
        }}
      >
        Just a few details and you&apos;re in.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
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
              style={{
                ...fieldInputStyle,
                opacity: method === "phone" ? 0.7 : 1,
              }}
            />
          </div>
          {method === "email" && (
            <span style={{ fontSize: fontSize.xs, color: colors.muted }}>
              {mobile.length}/{digitLimit} digits
            </span>
          )}
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
              style={{
                ...fieldInputStyle,
                opacity: method === "email" ? 0.7 : 1,
              }}
            />
          </div>
        </Field>

        <Field label="Location">
          <LocationMapPicker value={location} onChange={setLocation} />
        </Field>
      </div>

      <button
        onClick={() =>
          valid &&
          location &&
          onSubmit({ name: name.trim(), countryCode: cc, mobile, email, location })
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
