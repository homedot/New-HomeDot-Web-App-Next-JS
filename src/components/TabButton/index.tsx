"use client";

import { forwardRef } from "react";
import { colors } from "@/constants/colors";
import { radius, fontSize } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";

/** Sliding-pill tab button — pairs with the `.pf-tab-thumb`/`.pf-tab-btn`
 * CSS (shared with ProfessionalDetail's tab bar). Extracted from
 * ProfessionalDashboardScreen so ProfessionalEnquiriesScreen's Job/Direct
 * switcher can reuse the identical look. The parent owns the sliding
 * indicator's position/width state (tied to its own tab refs). */
const TabButton = forwardRef<HTMLButtonElement, { active: boolean; icon: IconName; label: string; count: number; onClick: () => void }>(
  function TabButton({ active, icon, label, count, onClick }, ref) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className="pf-tab-btn"
        style={{
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: fontSize.sm,
          fontWeight: 600,
          padding: "10px 16px",
          borderRadius: radius.full,
          whiteSpace: "nowrap",
          color: active ? colors.white : colors.ink2,
        }}
      >
        <Icon name={icon} size={15} color={active ? colors.white : colors.muted} /> {label}
        {count > 0 && (
          <span
            style={{
              marginLeft: 2,
              fontSize: fontSize.xs,
              fontWeight: 700,
              background: active ? "rgba(255,255,255,0.22)" : colors.card,
              color: active ? colors.white : colors.muted,
              padding: "1px 7px",
              borderRadius: radius.full,
            }}
          >
            {count}
          </span>
        )}
      </button>
    );
  }
);

export default TabButton;
