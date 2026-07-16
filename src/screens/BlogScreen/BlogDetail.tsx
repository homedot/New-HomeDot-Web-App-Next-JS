"use client";

import { useState, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import BlogCard from "@/components/BlogCard";
import Reveal from "@/components/Reveal";
import type { BlogArticle } from "@/services/BlogScreenService";

const wrap: CSSProperties = {
  maxWidth: 820,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

const wideWrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

export default function BlogDetail({
  article,
  loading,
  saved,
  onSave,
  onBack,
  onOpenRelated,
}: {
  article: BlogArticle | null;
  loading: boolean;
  saved: boolean;
  onSave: () => void;
  onBack: () => void;
  onOpenRelated: (slug: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window === "undefined") return;
    const url = article ? `${window.location.origin}/blog?post=${article.slug}` : window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div style={{ paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
      <div style={{ ...wideWrap, marginBottom: spacing.lg }}>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: fontSize.sm,
            fontWeight: 600,
            color: colors.ink2,
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.full,
            padding: "9px 16px",
            boxShadow: shadow.sm,
          }}
        >
          <Icon name="arrowLeft" size={16} />
          Back to Blog
        </button>
      </div>

      {loading || !article ? (
        <div style={wrap}>
          <div className="skeleton-shimmer" style={{ height: "clamp(220px, 32vw, 380px)", borderRadius: radius.lg }} />
          <div style={{ marginTop: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.md }}>
            <div className="skeleton-shimmer" style={{ height: 14, width: "30%", borderRadius: 6 }} />
            <div className="skeleton-shimmer" style={{ height: 30, width: "85%", borderRadius: 8 }} />
            <div className="skeleton-shimmer" style={{ height: 16, width: "100%", borderRadius: 6 }} />
            <div className="skeleton-shimmer" style={{ height: 16, width: "92%", borderRadius: 6 }} />
            <div className="skeleton-shimmer" style={{ height: 16, width: "78%", borderRadius: 6 }} />
          </div>
        </div>
      ) : (
        <>
          <div style={wrap}>
            {/* hero image */}
            <div
              className="bl-hero"
              style={{
                position: "relative",
                borderRadius: radius.lg,
                overflow: "hidden",
                height: "clamp(220px, 32vw, 380px)",
                boxShadow: shadow.md,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            {/* title + meta */}
            <div className="bl-meta" style={{ marginTop: spacing.xl }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  color: colors.white,
                  background: colors.primary,
                  padding: "6px 12px",
                  borderRadius: radius.full,
                }}
              >
                <Icon name="book" size={11} color={colors.white} />
                BLOG
              </span>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(26px, 3.6vw, 40px)",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                  marginTop: spacing.md,
                }}
              >
                {article.title}
              </h1>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: spacing.md,
                  marginTop: spacing.lg,
                  paddingTop: spacing.lg,
                  paddingBottom: spacing.lg,
                  borderTop: `1px solid ${colors.line}`,
                  borderBottom: `1px solid ${colors.line}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {article.authorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.authorAvatar}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2px solid ${colors.white}`, boxShadow: `0 0 0 1px ${colors.line}` }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                        color: colors.white,
                        fontWeight: 700,
                      }}
                    >
                      {article.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: fontSize.sm + 0.5, fontWeight: 700 }}>{article.authorName}</p>
                    <p style={{ fontSize: fontSize.xs, color: colors.muted, marginTop: 1 }}>
                      {article.authorRole ? `${article.authorRole} · ` : ""}
                      {article.date}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                  <button
                    key={saved ? "saved" : "unsaved"}
                    onClick={onSave}
                    aria-label={saved ? "Remove from saved" : "Save article"}
                    className={saved ? "bl-heart-pop" : undefined}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: colors.card,
                      border: `1px solid ${colors.line}`,
                      display: "grid",
                      placeItems: "center",
                      color: saved ? "#E5484D" : colors.ink2,
                    }}
                  >
                    <Icon name="heart" size={18} filled={saved} />
                  </button>
                  <button
                    onClick={handleShare}
                    aria-label="Copy link"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: colors.card,
                      border: `1px solid ${colors.line}`,
                      display: "grid",
                      placeItems: "center",
                      color: colors.ink2,
                    }}
                  >
                    <Icon name="share" size={17} />
                  </button>
                  {copied && (
                    <span
                      className="bl-toast"
                      style={{
                        position: "absolute",
                        top: -34,
                        right: 0,
                        fontSize: fontSize.xs,
                        fontWeight: 600,
                        color: colors.white,
                        background: colors.ink,
                        padding: "6px 10px",
                        borderRadius: radius.sm,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Link copied
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* body */}
            <div className="bl-body" style={{ marginTop: spacing.xl }}>
              {article.description.split(/\n{2,}/).map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: fontSize.md,
                    color: colors.ink2,
                    lineHeight: 1.8,
                    marginBottom: spacing.lg,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* about author */}
            {(article.authorBio || article.authorRole) && (
              <Reveal
                style={{
                  marginTop: spacing.xl,
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.lg,
                  padding: spacing.xl,
                  display: "flex",
                  gap: spacing.lg,
                  alignItems: "flex-start",
                  boxShadow: shadow.sm,
                }}
              >
                <div className="bl-author-glow" style={{ flexShrink: 0 }}>
                  {article.authorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.authorAvatar}
                      alt=""
                      style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${colors.white}`, boxShadow: `0 0 0 1px ${colors.line}` }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                        color: colors.white,
                        fontWeight: 700,
                        fontSize: fontSize.lg,
                      }}
                    >
                      {article.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: fontSize.xs, fontWeight: 700, letterSpacing: 0.6, color: colors.muted, textTransform: "uppercase" }}>
                    About the author
                  </p>
                  <h4 style={{ fontSize: fontSize.lg - 1, fontWeight: 700, marginTop: 4 }}>{article.authorName}</h4>
                  {article.authorRole && (
                    <p style={{ fontSize: fontSize.sm, color: colors.primary, fontWeight: 600, marginTop: 2 }}>{article.authorRole}</p>
                  )}
                  {article.authorBio && (
                    <p style={{ fontSize: fontSize.sm + 0.5, color: colors.muted, lineHeight: 1.6, marginTop: 8 }}>{article.authorBio}</p>
                  )}
                </div>
              </Reveal>
            )}
          </div>

          {/* related articles */}
          {article.related.length > 0 && (
            <div style={{ ...wideWrap, marginTop: spacing.huge }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: spacing.lg }}>
                <span style={{ width: 4, height: 22, borderRadius: 2, background: colors.primary }} />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xxl - 4, fontWeight: 600 }}>Related Articles</h3>
              </div>
              <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
                {article.related.map((r) => (
                  <BlogCard key={r.slug} post={r} onOpen={() => onOpenRelated(r.slug)} />
                ))}
              </Reveal>
            </div>
          )}
        </>
      )}
    </div>
  );
}
