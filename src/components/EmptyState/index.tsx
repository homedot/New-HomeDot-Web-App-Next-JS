"use client";

import type { ReactNode } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";

/** Generic dashed-border empty/gate placeholder — icon badge, title, subtitle,
 * optional action button. Extracted from ProfessionalDashboardScreen so it can
 * be reused by ProfessionalEnquiriesScreen (sign-in gate, no-results states). */
export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "70px 20px", border: `1px dashed ${colors.line}`, borderRadius: radius.lg, background: colors.card }}>
      <span style={{ width: 64, height: 64, borderRadius: "50%", background: colors.primarySoft, color: colors.primary, display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
        <Icon name={icon} size={28} />
      </span>
      <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: colors.muted, marginBottom: spacing.lg, maxWidth: 420, marginInline: "auto" }}>{subtitle}</p>
      {action}
    </div>
  );
}
