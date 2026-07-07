import type { CSSProperties, ReactNode } from "react";
import { colors } from "@/constants/colors";
import { radius, spacing, fontSize } from "@/utils/size";
import countryCodes from "@/utils/CountryCode";

export type Method = "phone" | "email";

export const COUNTRIES = countryCodes.filter(
  (c): c is typeof countryCodes[number] & { dial_code: string } => !!c.dial_code,
);

const DEFAULT_DIGIT_LIMIT = 10;

export function digitLimitFor(dialCode: string): number {
  return COUNTRIES.find((c) => c.dial_code === dialCode)?.no_of_digit || DEFAULT_DIGIT_LIMIT;
}

export const inputWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm + 2,
  height: 54,
  border: `1.5px solid ${colors.line}`,
  borderRadius: radius.md,
  padding: "0 16px",
  background: colors.white,
};

export const fieldInputStyle: CSSProperties = {
  border: "none",
  outline: "none",
  background: "none",
  width: "100%",
  fontSize: fontSize.md - 0.5,
  color: colors.ink,
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: spacing.sm - 2 }}>
      <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.ink }}>
        {label}
      </span>
      {children}
    </label>
  );
}
