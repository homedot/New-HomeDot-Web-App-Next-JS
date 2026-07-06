import type { CSSProperties, ReactNode } from "react";
import { colors } from "@/constants/colors";
import { radius, spacing, fontSize } from "@/utils/size";

export type Method = "phone" | "email";

export const COUNTRY_CODES = ["+91", "+971", "+966", "+65", "+44", "+1", "+61"];

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
