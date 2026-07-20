"use client";

import { useState, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import type { EnquiryRecord } from "@/services/EnquiryService";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const STATUS: Record<string, { label: string; fg: string; bg: string; icon: IconName }> = {
  pending: { label: "Pending", fg: "#FCD34D", bg: "rgba(252,211,77,0.2)", icon: "clock" },
  "project-initiated": { label: "In Progress", fg: "#fff", bg: "rgba(255,255,255,0.2)", icon: "compass" },
  "project-completed": { label: "Completed", fg: "#4ADE80", bg: "rgba(74,222,128,0.2)", icon: "check" },
  rejected: { label: "Rejected", fg: "#F87171", bg: "rgba(248,113,113,0.2)", icon: "close" },
};

export default function EnquiryCard({
  enquiry,
  onPin,
  onDelete,
  onEdit,
  onOpenResponse,
  onViewProject,
}: {
  enquiry: EnquiryRecord;
  onPin: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onOpenResponse: () => void;
  onViewProject: () => void;
}) {
  const [pinPop, setPinPop] = useState(0);
  // Same field, two meanings — see EnquiryProfessionalResponse's doc comment:
  // this "rejected" is a status token on the list record, not the free-text
  // message shown once the response detail is fetched.
  const isRejected = enquiry.professionalResponse?.[0]?.responseText === "rejected";
  const isCompleted = enquiry.status === "project-completed";
  const isInitiated = enquiry.status === "project-initiated";
  const hasProfResponse = enquiry.professionalResponse.length !== 0;
  const isProjectExist = Array.isArray(enquiry.projectInfo) && enquiry.projectInfo.length > 0;

  const statusKey = isRejected ? "rejected" : enquiry.status || "pending";
  const st = STATUS[statusKey] ?? STATUS.pending;

  const cardStyle: CSSProperties = {
    background: colors.card,
    border: `1px solid ${isRejected ? "#FECACA" : colors.line}`,
    borderRadius: radius.lg,
    overflow: "hidden",
    boxShadow: shadow.sm,
  };

  return (
    <article className="card-hover" style={cardStyle}>
      {/* Header strip */}
      <div
        style={{
          background: isRejected
            ? "linear-gradient(150deg, #7f1d1d, #dc2626)"
            : `linear-gradient(150deg, ${colors.primaryDeep}, ${colors.primary})`,
          padding: "14px 16px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              maxWidth: "56%",
              background: "rgba(255,255,255,0.16)",
              borderRadius: radius.full,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.95)",
            }}
          >
            <Icon name="briefcase" size={11} color="rgba(255,255,255,0.85)" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{enquiry.enquiryCategoryName}</span>
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: st.bg,
              borderRadius: radius.full,
              padding: "4px 9px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.2,
              color: st.fg,
            }}
          >
            <Icon name={st.icon} size={11} color={st.fg} />
            {st.label}
          </span>

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

        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>
          <Icon name="calendar" size={10} color="rgba(255,255,255,0.7)" />
          {formatDate(enquiry.enquiryDate)}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          <InfoRow icon="location" text={enquiry.location} />
          <InfoRow icon="book" text={enquiry.requirement} lines={2} />
        </div>

        {(isCompleted || isInitiated) && isProjectExist && (
          <button
            onClick={onViewProject}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              background: colors.primarySoft,
              border: `1px solid ${colors.primary}22`,
              borderRadius: radius.md,
              padding: "9px 12px",
              marginBottom: 12,
              textAlign: "left",
            }}
          >
            <Icon name="briefcase" size={14} color={colors.primary} />
            <span style={{ flex: 1, fontSize: fontSize.sm - 0.5, fontWeight: 600, color: colors.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {enquiry.projectInfo?.[0]?.projectName || "Project"}
            </span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isCompleted ? "#16A34A" : colors.primary,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: isCompleted ? "#16A34A" : colors.primary, flexShrink: 0 }}>
              {isCompleted ? "Completed" : "In Progress"}
            </span>
          </button>
        )}

        <div style={{ height: 1, background: colors.line, marginBottom: 12 }} />

        {isRejected ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FFF5F5",
              border: "1px solid #FECACA",
              borderRadius: radius.full,
              padding: "6px 12px",
              fontSize: fontSize.xs,
              fontWeight: 600,
              color: "#DC2626",
            }}
          >
            <Icon name="close" size={13} color="#DC2626" /> Enquiry rejected
          </span>
        ) : isCompleted || isInitiated ? null : hasProfResponse ? (
          <button
            onClick={onOpenResponse}
            className="pd-badge-pulse"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              background: colors.primary + "0A",
              border: `1px solid ${colors.primary}25`,
              borderRadius: radius.md,
              padding: "10px 12px",
              textAlign: "left",
            }}
          >
            <span style={{ position: "relative", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="mail" size={18} color={colors.primary} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#F87171", border: "1.5px solid #fff" }} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: fontSize.sm - 0.5, fontWeight: 700, color: colors.ink }}>Response received</span>
              <span style={{ display: "block", fontSize: fontSize.xs, color: colors.muted }}>Tap to view &amp; take action</span>
            </span>
            <Icon name="arrow" size={13} color={colors.primary} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: colors.bg,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.full,
                padding: "6px 11px",
                fontSize: fontSize.xs,
                fontStyle: "italic",
                color: colors.muted,
              }}
            >
              <Icon name="clock" size={12} color={colors.muted} /> Awaiting response
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <IconButton icon="edit" onClick={onEdit} />
              <IconButton icon="trash" onClick={onDelete} danger />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function InfoRow({ icon, text, lines = 1 }: { icon: IconName; text: string; lines?: number }) {
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

function IconButton({ icon, onClick, danger }: { icon: IconName; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={icon}
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        display: "grid",
        placeItems: "center",
        background: danger ? "#DC2626" : colors.primary,
        transition: "transform 0.15s ease",
      }}
      className="eq-icon-btn"
    >
      <Icon name={icon} size={14} color="#fff" />
    </button>
  );
}
