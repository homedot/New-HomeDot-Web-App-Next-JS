import { colors } from "@/constants/colors";
import { radius, shadow, spacing, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import type { BlogCard as BlogCardData } from "@/services/BlogScreenService";

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
        flexDirection: featured ? "row" : "column",
        cursor: onOpen ? "pointer" : "default",
        height: "100%",
      }}
    >
      <div
        className={featured ? "hidden sm:block" : undefined}
        style={{
          position: "relative",
          aspectRatio: featured ? undefined : "16/10.5",
          width: featured ? "44%" : undefined,
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
        {onSave && (
          <button
            aria-label={saved ? "Remove from saved" : "Save article"}
            onClick={(e) => {
              e.stopPropagation();
              onSave(post.id);
            }}
            className={saved ? "bl-heart-pop" : undefined}
            key={saved ? "saved" : "unsaved"}
            style={{
              position: "absolute",
              right: spacing.sm + 2,
              top: spacing.sm + 2,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(16,28,48,0.55)",
              border: "1px solid rgba(255,255,255,0.22)",
              display: "grid",
              placeItems: "center",
              color: saved ? "#FF6259" : colors.white,
            }}
          >
            <Icon name="heart" size={15} filled={saved} />
          </button>
        )}
      </div>
      <div
        style={{
          padding: featured ? spacing.xxl : spacing.xl,
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm + 1,
          flex: 1,
          justifyContent: "center",
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
            fontSize: featured ? fontSize.xxl - 2 : fontSize.lg - 1,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: featured ? 3 : 2,
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
              WebkitLineClamp: featured ? 3 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </p>
        )}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: fontSize.sm,
            fontWeight: 600,
            color: colors.primary,
            marginTop: spacing.xs,
          }}
        >
          Read more <Icon name="arrow" size={15} />
        </span>
      </div>
    </article>
  );
}
