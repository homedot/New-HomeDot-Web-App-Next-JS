"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = article?.images?.length ? article.images : article ? [article.image] : [];

  // A different article can load into the same mounted BlogDetail (openDetail
  // re-fetches in place rather than remounting) — reset which image is
  // featured/open so the previous article's selection doesn't linger. Reset
  // during render (not an effect) — same convention as ProfessionalDetail's
  // identical prevProId guard.
  const [prevArticleId, setPrevArticleId] = useState(article?.id);
  if (article?.id !== prevArticleId) {
    setPrevArticleId(article?.id);
    setHeroIndex(0);
    setLightboxIndex(null);
  }

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, images.length]);

  const handleShare = () => {
    if (typeof window === "undefined") return;
    const url = article
      ? `${window.location.origin}/blog?post=${article.slug}`
      : window.location.href;
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
          <div
            className="skeleton-shimmer"
            style={{
              height: "clamp(220px, 32vw, 380px)",
              borderRadius: radius.lg,
            }}
          />
          <div
            style={{
              marginTop: spacing.xl,
              display: "flex",
              flexDirection: "column",
              gap: spacing.md,
            }}
          >
            <div
              className="skeleton-shimmer"
              style={{ height: 14, width: "30%", borderRadius: 6 }}
            />
            <div
              className="skeleton-shimmer"
              style={{ height: 30, width: "85%", borderRadius: 8 }}
            />
            <div
              className="skeleton-shimmer"
              style={{ height: 16, width: "100%", borderRadius: 6 }}
            />
            <div
              className="skeleton-shimmer"
              style={{ height: 16, width: "92%", borderRadius: 6 }}
            />
            <div
              className="skeleton-shimmer"
              style={{ height: 16, width: "78%", borderRadius: 6 }}
            />
          </div>
        </div>
      ) : (
        <>
          <div style={wrap}>
            {/* hero image */}
            <button
              type="button"
              onClick={() => setLightboxIndex(heroIndex)}
              aria-label="View full-size image"
              className="bl-hero avatar-photo-btn"
              style={{
                position: "relative",
                display: "block",
                width: "100%",
                borderRadius: radius.lg,
                overflow: "hidden",
                height: "clamp(220px, 32vw, 380px)",
                boxShadow: shadow.md,
                cursor: "zoom-in",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[heroIndex] ?? article.image}
                alt={article.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span
                className="avatar-photo-hint"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(10,20,34,0.35)",
                }}
              >
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.16)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name="search" size={19} color={colors.white} />
                </span>
              </span>
              {images.length > 1 && (
                <span
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(10,20,34,0.55)",
                    color: colors.white,
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: radius.full,
                  }}
                >
                  <Icon name="grid" size={12} color={colors.white} /> {heroIndex + 1} / {images.length}
                </span>
              )}
            </button>

            {/* thumbnail strip — only when the blog has more than one image */}
            {images.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: spacing.sm,
                  overflowX: "auto",
                  paddingBottom: 2,
                }}
              >
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setHeroIndex(i);
                      setLightboxIndex(i);
                    }}
                    aria-label={`View image ${i + 1}`}
                    style={{
                      flexShrink: 0,
                      width: 76,
                      height: 56,
                      borderRadius: radius.md,
                      overflow: "hidden",
                      cursor: "zoom-in",
                      boxShadow: i === heroIndex ? `0 0 0 2px ${colors.primary}` : `0 0 0 1px ${colors.line}`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}

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
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${colors.white}`,
                        boxShadow: `0 0 0 1px ${colors.line}`,
                      }}
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
                    <p style={{ fontSize: fontSize.sm + 0.5, fontWeight: 700 }}>
                      {article.authorName}
                    </p>
                    <p
                      style={{
                        fontSize: fontSize.xs,
                        color: colors.muted,
                        marginTop: 1,
                      }}
                    >
                      {article.authorRole ? `${article.authorRole} · ` : ""}
                      {article.date}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    position: "relative",
                  }}
                >
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
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${colors.white}`,
                        boxShadow: `0 0 0 1px ${colors.line}`,
                      }}
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
                  <p
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      color: colors.muted,
                      textTransform: "uppercase",
                    }}
                  >
                    About the author
                  </p>
                  <h4
                    style={{
                      fontSize: fontSize.lg - 1,
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    {article.authorName}
                  </h4>
                  {article.authorRole && (
                    <p
                      style={{
                        fontSize: fontSize.sm,
                        color: colors.primary,
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      {article.authorRole}
                    </p>
                  )}
                  {article.authorBio && (
                    <p
                      style={{
                        fontSize: fontSize.sm + 0.5,
                        color: colors.muted,
                        lineHeight: 1.6,
                        marginTop: 8,
                      }}
                    >
                      {article.authorBio}
                    </p>
                  )}
                </div>
              </Reveal>
            )}
          </div>

          {/* related articles */}
          {article.related.length > 0 && (
            <div style={{ ...wideWrap, marginTop: spacing.huge }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: spacing.lg,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 22,
                    borderRadius: 2,
                    background: colors.primary,
                  }}
                />
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: fontSize.xxl - 4,
                    fontWeight: 600,
                  }}
                >
                  Related Articles
                </h3>
              </div>
              <Reveal
                stagger
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                style={{ gap: spacing.xl }}
              >
                {article.related.map((r) => (
                  <BlogCard
                    key={r.slug}
                    post={r}
                    onOpen={() => onOpenRelated(r.slug)}
                  />
                ))}
              </Reveal>
            </div>
          )}
        </>
      )}

      {lightboxIndex !== null && article && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="pd-lightbox-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10,20,34,0.92)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: 40,
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            className="pd-lightbox-arrow"
            style={{
              position: "absolute",
              zIndex: 2,
              top: 24,
              right: 28,
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.14)",
              color: colors.white,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="close" size={22} color={colors.white} />
          </button>

          {images.length > 1 && (
            <span
              style={{
                position: "absolute",
                zIndex: 2,
                top: 30,
                left: 28,
                color: colors.white,
                fontWeight: 600,
                fontSize: fontSize.sm,
                background: "rgba(255,255,255,0.14)",
                padding: "7px 14px",
                borderRadius: radius.full,
              }}
            >
              {lightboxIndex + 1} / {images.length}
            </span>
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
                }}
                aria-label="Previous photo"
                className="pd-lightbox-arrow"
                style={{
                  position: "absolute",
                  zIndex: 2,
                  left: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.14)",
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="arrowLeft" size={22} color={colors.white} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? i : (i + 1) % images.length));
                }}
                aria-label="Next photo"
                className="pd-lightbox-arrow"
                style={{
                  position: "absolute",
                  zIndex: 2,
                  right: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.14)",
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="arrow" size={22} color={colors.white} />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={lightboxIndex}
            src={images[lightboxIndex] ?? article.image}
            alt={article.title}
            onClick={(e) => e.stopPropagation()}
            className="pd-lightbox-img"
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "90vw",
              maxHeight: "78vh",
              borderRadius: radius.md,
              boxShadow: shadow.lg,
            }}
          />
        </div>
      )}
    </div>
  );
}
