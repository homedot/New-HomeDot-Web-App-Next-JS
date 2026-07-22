"use client";

import { useState, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import type { ProfessionalEnquiryRecord } from "@/services/ProfessionalDashboardService";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Web counterpart of homedot-mobile-app's EnquiryCard.js as used on the
 * Professional side (Job/Direct Enquiries) — a different card from this
 * app's own EnquiriesScreen/EnquiryCard.tsx, which is the User-side "my
 * sent enquiries" card. Field shapes and available actions differ (customer
 * info instead of professional info; respond/ignore/reject instead of
 * edit/delete). Visual language follows HomeDot_Web_UI_Reference/styles.css's
 * .enq-card (ref+pin top row, dot-marker thread preview, accept/reject
 * pills) — a light card rather than this app's usual dark-header card, to
 * match the reference professional dashboard exactly. Shared by
 * ProfessionalDashboardScreen (3-item preview) and ProfessionalEnquiriesScreen
 * (full paginated list). */
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
  const isDone = hasProject && enquiry.projectInfo?.[0]?.projectStatus?.toLowerCase() === "completed";

  const cardStyle: CSSProperties = {
    background: isDone ? `color-mix(in srgb, #1F8A5B 5%, ${colors.card})` : colors.bg,
    border: `1px solid ${customerDeclined ? "#FECACA" : isDone ? "#1F8A5B38" : colors.line}`,
    borderRadius: radius.lg,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const customerName = enquiry.customerInfo?.[0]?.name || "Customer";
  const ref = enquiry._id ? `#${enquiry._id.slice(-8).toUpperCase()}` : null;
  const responseText = response?.responseText;
  const thread: { who: string; text: string }[] = [
    { who: customerName, text: enquiry.requirement },
    ...(responseText ? [{ who: "Me", text: responseText }] : []),
  ];

  const steps = [
    { label: "Received", done: true },
    { label: "Responded", done: hasResponded },
    { label: "Initiated", done: hasProject },
    { label: "Completed", done: isDone },
  ];

  return (
    <article className="card-hover" style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary, letterSpacing: 0.2 }}>{ref}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!enquiry.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F87171", flexShrink: 0 }} />}
          <button
            key={pinPop}
            onClick={() => {
              setPinPop((n) => n + 1);
              onPin();
            }}
            aria-label={enquiry.isPinned ? "Unpin enquiry" : "Pin enquiry"}
            className={pinPop ? "eq-pin-pop" : undefined}
            style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", flexShrink: 0, color: enquiry.isPinned ? colors.accent : colors.muted }}
          >
            <Icon name="sparkle" size={16} filled={!!enquiry.isPinned} color={enquiry.isPinned ? colors.accent : colors.muted} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <h3 style={{ fontSize: 15.5, lineHeight: 1.3, fontFamily: "var(--font-display)", fontWeight: 600 }}>
          {enquiry.enquiryCategoryName || "Enquiry"}
        </h3>
        <span style={{ fontSize: 12, color: colors.muted, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>{formatDate(enquiry.createdAt)}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: colors.ink2 }}>
          <Icon name="user" size={13} color={colors.muted} />
          <span>{customerName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12.5, color: colors.ink2, lineHeight: 1.4 }}>
          <span style={{ marginTop: 1, flexShrink: 0 }}>
            <Icon name="location" size={13} color={colors.muted} />
          </span>
          <span>{enquiry.location}</span>
        </div>
      </div>

      <div style={{ position: "relative", padding: "2px 2px 4px" }}>
        <div style={{ position: "absolute", left: "12.5%", right: "12.5%", top: 9, height: 2, background: colors.line }} />
        <div
          style={{
            position: "absolute",
            left: "12.5%",
            top: 9,
            height: 2,
            width: `${Math.max(0, steps.filter((s) => s.done).length - 1) / (steps.length - 1) * 75}%`,
            background: colors.accent,
            transition: "width 0.3s ease",
          }}
        />
        <div style={{ position: "relative", display: "flex" }}>
          {steps.map((s) => (
            <div key={s.label} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: s.done ? colors.accent : colors.line,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 600,
                  color: s.done ? colors.ink2 : colors.muted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 12, background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 11 }}>
        {thread.map((t, i) => (
          <div key={i} style={{ position: "relative", paddingLeft: 14 }}>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 5,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: t.who === "Me" ? colors.accent : colors.muted,
              }}
            />
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: t.who === "Me" ? colors.accent : colors.ink }}>{t.who}</span>
            <span style={{ display: "block", fontSize: 13, color: colors.ink2, lineHeight: 1.4 }}>{t.text}</span>
          </div>
        ))}
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

      {customerDeclined ? (
        <Status color="#DC2626" bg="#FFF5F5" text="Customer declined your response" />
      ) : hasProject ? null : customerAccepted ? (
        <Status color="#059669" bg="#F0FDF4" text="Customer accepted — starting a project" />
      ) : hasResponded ? (
        <Status color={colors.primary} bg={colors.primarySoft} text="Awaiting customer decision" />
      ) : (
        <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
          <button
            onClick={onRespond}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontWeight: 600,
              fontSize: 13.5,
              padding: 10,
              borderRadius: 10,
              background: colors.primary,
              color: "#fff",
            }}
          >
            <Icon name="check" size={14} color="#fff" /> Accept
          </button>
          <button
            onClick={onDecline}
            style={{
              flex: 1,
              fontWeight: 600,
              fontSize: 13.5,
              padding: 10,
              borderRadius: 10,
              background: colors.card,
              color: colors.ink2,
              boxShadow: `inset 0 0 0 1.5px ${colors.line}`,
            }}
          >
            {kind === "job" ? "Ignore" : "Decline"}
          </button>
        </div>
      )}
    </article>
  );
}

function Status({ color, bg, text }: { color: string; bg: string; text: string }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        fontWeight: 600,
        fontSize: 13.5,
        padding: 10,
        borderRadius: 10,
        background: bg,
        color,
      }}
    >
      {text}
    </span>
  );
}
