import { colors } from "@/constants/colors";
import { radius, shadow, spacing, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import type { BlogCard as BlogCardData } from "@/services/BlogScreenService";

function SaveButton({
  saved,
  onSave,
  id,
  light,
}: {
  saved?: boolean;
  onSave: (id: string) => void;
  id: string;
  light?: boolean;
}) {
  return (
    <button
      aria-label={saved ? "Remove from saved" : "Save article"}
      onClick={(e) => {
        e.stopPropagation();
        onSave(id);
      }}
      className={`bl-heart-btn${saved ? " bl-heart-pop" : ""}`}
      key={saved ? "saved" : "unsaved"}
      style={{
        position: "absolute",
        right: spacing.sm + 2,
        top: spacing.sm + 2,
        width: light ? 38 : 32,
        height: light ? 38 : 32,
        borderRadius: "50%",
        background: "rgba(16,28,48,0.55)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.22)",
        display: "grid",
        placeItems: "center",
        color: saved ? "#FF6259" : colors.white,
      }}
    >
      <Icon name="heart" size={light ? 17 : 15} filled={saved} />
    </button>
  );
}

export default function BlogCard({
  post,
  onOpen,
  saved,
  onSave,
  featured = false,
}: {
  post: BlogCardData;
  onOpen?: () => void;
  saved?: boolean;
  onSave?: (id: string) => void;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <article
        className="card-hover"
        onClick={onOpen}
        style={{
          position: "relative",
          borderRadius: radius.lg,
          overflow: "hidden",
          boxShadow: shadow.md,
          cursor: onOpen ? "pointer" : "default",
          height: "clamp(320px, 42vw, 460px)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image}
          alt={post.title}
          className="card-hover-img"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(16,28,48,0) 28%, rgba(16,28,48,0.55) 66%, rgba(9,14,24,0.92) 100%)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: spacing.lg,
            left: spacing.lg,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: 0.6,
            color: colors.white,
            background: "rgba(255,255,255,0.16)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.3)",
            padding: "6px 12px",
            borderRadius: radius.full,
          }}
        >
          <Icon name="sparkle" size={11} color={colors.white} />
          FEATURED
        </span>
        {onSave && <SaveButton saved={saved} onSave={onSave} id={post.id} light />}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "clamp(20px, 3vw, 40px)",
            color: colors.white,
            maxWidth: 680,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: fontSize.xs,
              color: "rgba(255,255,255,0.85)",
              marginBottom: 12,
            }}
          >
            {post.authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.authorAvatar}
                alt=""
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1.5px solid rgba(255,255,255,0.5)",
                }}
              />
            ) : (
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  color: colors.white,
                  fontSize: 10,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {post.author.charAt(0).toUpperCase()}
              </span>
            )}
            <span style={{ fontWeight: 600, color: colors.white }}>{post.author}</span>
            {post.date && (
              <>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{post.date}</span>
              </>
            )}
          </div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p
              className="hidden sm:block"
              style={{
                marginTop: 10,
                fontSize: fontSize.base,
                color: "rgba(255,255,255,0.86)",
                lineHeight: 1.55,
                maxWidth: 560,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.excerpt}
            </p>
          )}
          <span
            style={{
              marginTop: spacing.lg,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: fontSize.sm,
              fontWeight: 700,
              color: colors.primary,
              background: colors.white,
              padding: "11px 20px",
              borderRadius: radius.full,
              boxShadow: "0 10px 24px -8px rgba(0,0,0,0.35)",
            }}
          >
            Read full story
            <Icon name="arrow" size={14} className="bl-cta-arrow" />
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className="card-hover"
      onClick={onOpen}
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        boxShadow: shadow.sm,
        display: "flex",
        flexDirection: "column",
        cursor: onOpen ? "pointer" : "default",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/10.5",
          flexShrink: 0,
          overflow: "hidden",
          background: colors.primarySoft,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="card-hover-img"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(16,28,48,0) 62%, rgba(16,28,48,0.32) 100%)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: spacing.sm + 2,
            left: spacing.sm + 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: 0.5,
            color: colors.white,
            background: colors.primary,
            padding: "5px 9px",
            borderRadius: radius.full,
          }}
        >
          <Icon name="book" size={10} color={colors.white} />
          BLOG
        </span>
        {onSave && <SaveButton saved={saved} onSave={onSave} id={post.id} />}
      </div>
      <div
        style={{
          padding: spacing.xl,
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm + 1,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: fontSize.xs,
            color: colors.muted,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, color: colors.ink2 }}>
            {post.authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.authorAvatar}
                alt=""
                style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: colors.primarySoft,
                  color: colors.primary,
                  fontSize: 9,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {post.author.charAt(0).toUpperCase()}
              </span>
            )}
            {post.author}
          </span>
          {post.date && <span>{post.date}</span>}
        </div>
        <h3
          style={{
            fontSize: fontSize.lg - 1,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            style={{
              fontSize: fontSize.sm + 1,
              color: colors.muted,
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </p>
        )}
        <div
          style={{
            marginTop: "auto",
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: fontSize.sm,
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            Explore article
            <Icon name="arrow" size={14} className="bl-cta-arrow" />
          </span>
        </div>
      </div>
    </article>
  );
}
