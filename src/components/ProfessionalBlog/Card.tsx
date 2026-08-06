"use client";

import { colors } from "@/constants/colors";
import { radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import type { ProfessionalBlogCard } from "@/services/ProfessionalBlogService";

/** A single entry in the professional's "My Blogs" grid — visual language
 * follows ProfessionalEnquiryCard.tsx (card-hover lift, colors/radius/
 * fontSize from @/utils/size) rather than the guest-facing BlogCard, since
 * this is a management card (Edit/Delete/View live) not a read card. */
export default function ProfessionalBlogCardItem({
  blog,
  onEdit,
  onDelete,
}: {
  blog: ProfessionalBlogCard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className="card-hover"
      style={{
        background: colors.bg,
        border: `1px solid ${blog.draft ? colors.line : colors.line}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16 / 10", overflow: "hidden", background: colors.line }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={blog.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: blog.draft ? colors.ink : colors.white,
            background: blog.draft ? colors.gold : "rgba(16,28,48,0.62)",
            padding: "4px 10px",
            borderRadius: radius.full,
          }}
        >
          {blog.draft ? <Icon name="edit" size={10} color={colors.ink} /> : <Icon name="check" size={10} color={colors.white} />}
          {blog.draft ? "Draft" : "Published"}
        </span>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <h3
          style={{
            fontSize: 15.5,
            lineHeight: 1.3,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {blog.title || "Untitled blog"}
        </h3>
        {blog.excerpt && (
          <p
            style={{
              fontSize: 13,
              color: colors.ink2,
              lineHeight: 1.5,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            {blog.excerpt}
          </p>
        )}

        {blog.date && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: colors.muted, marginTop: "auto", paddingTop: 4 }}>
            <Icon name="calendar" size={12} color={colors.muted} />
            <span>{blog.date}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", borderTop: `1px solid ${colors.line}` }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "11px 0",
            fontSize: fontSize.sm - 1,
            fontWeight: 600,
            color: colors.ink2,
            borderRight: `1px solid ${colors.line}`,
          }}
        >
          <Icon name="edit" size={13} color={colors.ink2} /> Edit
        </button>
        {!blog.draft && (
          <a
            href={`/blog?post=${encodeURIComponent(blog.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "11px 0",
              fontSize: fontSize.sm - 1,
              fontWeight: 600,
              color: colors.primary,
              borderRight: `1px solid ${colors.line}`,
            }}
          >
            <Icon name="share" size={13} color={colors.primary} /> View
          </a>
        )}
        <button
          onClick={onDelete}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "11px 0",
            fontSize: fontSize.sm - 1,
            fontWeight: 600,
            color: "#DC2626",
          }}
        >
          <Icon name="trash" size={13} color="#DC2626" /> Delete
        </button>
      </div>
    </article>
  );
}
