"use client";

import { useState, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import type { ProfessionalEnquiryRecord } from "@/services/ProfessionalDashboardService";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Web counterpart of homedot-mobile-app's EnquiryCard.js as used on the
 * Professional side (Job/Direct Enquiries) — a different card from this
 * app's own EnquiriesScreen/EnquiryCard.tsx, which is the User-side "my
 * sent enquiries" card. Field shapes and available actions differ (customer
 * info instead of professional info; respond/ignore/reject instead of
 * edit/delete). */
export default function ProfessionalEnquiryCard({
  enquiry,
  kind,
  onPin,
  onRespond,
  onDecline,
}: {
  enquiry: ProfessionalEnquiryRecord;
  kind: "job" | "direct";
  onPin: () => void;
  onRespond: () => void;
  onDecline: () => void;
}) {
  const [pinPop, setPinPop] = useState(0);
  const response = enquiry.professionalResponse?.[0];
  const hasResponded = !!response?.responseText || !!response?.response;
  const customerDeclined = !!response?.userReject;
  const customerAccepted = !!response?.userAccepted;
  const hasProject = Array.isArray(enquiry.projectInfo) && enquiry.projectInfo.length > 0;

  const cardStyle: CSSProperties = {
    background: colors.card,
    border: `1px solid ${customerDeclined ? "#FECACA" : colors.line}`,
    borderRadius: radius.lg,
    overflow: "hidden",
    boxShadow: shadow.sm,
  };

  const customerName = enquiry.customerInfo?.[0]?.name || "Customer";
  const initial = customerName.charAt(0).toUpperCase() || "C";

  return (
    <article className="card-hover" style={cardStyle}>
      <div
        style={{
          background: customerDeclined
            ? "linear-gradient(150deg, #7f1d1d, #dc2626)"
            : `linear-gradient(150deg, ${colors.primaryDeep}, ${colors.primary})`,
          padding: "14px 16px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              flexShrink: 0,
              overflow: "hidden",
              background: "rgba(255,255,255,0.18)",
              display: "grid",
              placeItems: "center",
              fontSize: fontSize.sm,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {enquiry.customerInfo?.[0]?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={enquiry.customerInfo[0].profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initial
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#fff", fontSize: fontSize.sm, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {customerName}
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>
              <Icon name="calendar" size={10} color="rgba(255,255,255,0.7)" />
              {formatDate(enquiry.createdAt)}
            </span>
          </div>
          {!enquiry.read && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F87171", flexShrink: 0 }} />
          )}
          <button
            key={pinPop}
            onClick={() => {
              setPinPop((n) => n + 1);
              onPin();
            }}
            aria-label={enquiry.isPinned ? "Unpin enquiry" : "Pin enquiry"}
            className={pinPop ? "eq-pin-pop" : undefined}
            style={{ display: "grid", placeItems: "center", flexShrink: 0 }}
          >
            <Icon name="bookmark" size={17} filled={!!enquiry.isPinned} color={enquiry.isPinned ? "#fbbf24" : "rgba(255,255,255,0.85)"} />
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        {enquiry.enquiryCategoryName && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: colors.primarySoft,
              color: colors.primary,
              borderRadius: radius.full,
              padding: "4px 10px",
              fontSize: 10.5,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            <Icon name="briefcase" size={10} /> {enquiry.enquiryCategoryName}
          </span>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          <InfoRow icon="location" text={enquiry.location} />
          <InfoRow icon="book" text={enquiry.requirement} lines={2} />
        </div>

        {hasProject && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: colors.primarySoft,
              border: `1px solid ${colors.primary}22`,
              borderRadius: radius.md,
              padding: "9px 12px",
              marginBottom: 12,
            }}
          >
            <Icon name="briefcase" size={14} color={colors.primary} />
            <span style={{ flex: 1, fontSize: fontSize.sm - 0.5, fontWeight: 600, color: colors.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {enquiry.projectInfo?.[0]?.projectName || "Project"}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.primary, flexShrink: 0, textTransform: "capitalize" }}>
              {enquiry.projectInfo?.[0]?.projectStatus || "In progress"}
            </span>
          </div>
        )}

        <div style={{ height: 1, background: colors.line, marginBottom: 12 }} />

        {customerDeclined ? (
          <Pill icon="close" color="#DC2626" bg="#FFF5F5" border="#FECACA" text="Customer declined your response" />
        ) : hasProject ? null : customerAccepted ? (
          <Pill icon="check" color="#059669" bg="#F0FDF4" border="#86EFAC" text="Customer accepted — starting a project" />
        ) : hasResponded ? (
          <Pill icon="clock" color={colors.primary} bg={colors.primarySoft} border={`${colors.primary}25`} text="Awaiting customer decision" />
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onDecline}
              style={{
                flex: 1,
                height: 38,
                borderRadius: radius.md,
                border: `1.5px solid ${colors.line}`,
                background: colors.bg,
                color: colors.ink2,
                fontSize: fontSize.xs,
                fontWeight: 700,
              }}
            >
              {kind === "job" ? "Ignore" : "Reject"}
            </button>
            <button
              onClick={onRespond}
              style={{
                flex: 2,
                height: 38,
                borderRadius: radius.md,
                background: colors.primary,
                color: "#fff",
                fontSize: fontSize.xs,
                fontWeight: 700,
              }}
            >
              Respond
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function InfoRow({ icon, text, lines = 1 }: { icon: "location" | "book"; text: string; lines?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: colors.primarySoft,
          color: colors.primary,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={13} />
      </span>
      <span
        style={{
          fontSize: fontSize.sm - 0.5,
          color: colors.ink2,
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function Pill({ icon, color, bg, border, text }: { icon: "close" | "check" | "clock"; color: string; bg: string; border: string; text: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: radius.full,
        padding: "6px 12px",
        fontSize: fontSize.xs,
        fontWeight: 600,
        color,
      }}
    >
      <Icon name={icon} size={13} color={color} /> {text}
    </span>
  );
}
