"use client";

import { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import Reveal from "@/components/Reveal";
import ProfessionalsScreenService, { toInviteUrl } from "@/services/ProfessionalsScreenService";

const QUOTE =
  "Join us on HomeDot — a fantastic app that simplifies house building and household management. Let's create and maintain our dream homes together!";

/** Web counterpart of homedot-mobile-app's InviteaFriendScreen — same headline,
 * quote card and referral link, adapted from a native Share sheet to the Web
 * Share API with a copy-link fallback. */
export default function InviteFriendPanel() {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await ProfessionalsScreenService.getInviteLink();
      if (cancelled) return;
      setLoading(false);
      const raw = res.data?.data?.[0]?.inviteLink;
      const url = raw ? toInviteUrl(raw) : null;
      if (!res.success || !res.data?.status || !url) {
        setError(res.data?.message || res.message || "Couldn't load your invite link. Please try again.");
        return;
      }
      setLink(url);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const shareLink = async () => {
    if (!link) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "HomeDot", text: QUOTE, url: link });
        return;
      } catch {
        // User cancelled the share sheet, or the browser rejected it — fall
        // through to clipboard copy so the action never dead-ends.
      }
    }
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <Reveal style={{ textAlign: "center", padding: "8px 4px" }}>
      <span
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: colors.primarySoft,
          color: colors.primary,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 18px",
        }}
      >
        <Icon name="share" size={26} />
      </span>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xl, fontWeight: 600, marginBottom: 8 }}>
        Share HomeDot with friends
      </h2>
      <p style={{ color: colors.muted, maxWidth: 420, marginInline: "auto", lineHeight: 1.6 }}>
        Invite your friends and family to discover the easiest way to manage and build their dream home.
      </p>

      <div
        style={{
          display: "flex",
          textAlign: "left",
          background: colors.bg,
          border: `1px solid ${colors.line}`,
          borderRadius: radius.md,
          overflow: "hidden",
          margin: "28px auto 0",
          maxWidth: 480,
        }}
      >
        <span style={{ width: 4, background: colors.primary, flexShrink: 0 }} />
        <p style={{ padding: "16px 18px", fontSize: fontSize.sm, lineHeight: 1.6, color: colors.ink2, fontStyle: "italic" }}>
          &ldquo;{QUOTE}&rdquo;
        </p>
      </div>

      <div style={{ maxWidth: 480, margin: "20px auto 0" }}>
        {loading ? (
          <p style={{ color: colors.muted, fontSize: fontSize.sm }}>Getting your invite link…</p>
        ) : error ? (
          <div>
            <p style={{ color: "#C0392B", fontSize: fontSize.sm, marginBottom: spacing.sm }}>{error}</p>
            <button onClick={() => setRetryCount((n) => n + 1)} style={{ fontSize: fontSize.sm, fontWeight: 700, color: colors.primary }}>
              Try again
            </button>
          </div>
        ) : (
          link && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.md,
                padding: "12px 14px",
                boxShadow: shadow.sm,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: fontSize.sm - 0.5,
                  color: colors.ink2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
              >
                {link}
              </span>
              <button
                onClick={shareLink}
                aria-label="Copy invite link"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: fontSize.xs,
                  fontWeight: 700,
                  color: colors.primary,
                  background: colors.primarySoft,
                  padding: "8px 12px",
                  borderRadius: radius.full,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name="share" size={13} /> {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )
        )}
      </div>

      <div style={{ marginTop: spacing.xl }}>
        <Button variant="primary" size="lg" icon={<Icon name="share" size={17} />} onClick={shareLink}>
          Invite Friends
        </Button>
      </div>
    </Reveal>
  );
}
