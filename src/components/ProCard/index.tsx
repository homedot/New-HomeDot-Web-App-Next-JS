import { colors } from "@/constants/colors";
import { radius, shadow, spacing, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Same category → photo pairing ProfessionalsScreen/data.ts uses for its
// mock cards, kept here (rather than imported) to avoid a circular import —
// that file already imports the `Professional` type from this one. Keyword
// match mirrors LandingScreenService's iconForCategory so a professional
// with no cover of their own gets a photo that actually looks like their
// trade instead of one generic stock image.
const CATEGORY_COVER_IMAGE: [match: string, url: string][] = [
  ["interior", unsplash("1618221195710-dd6b41faaea6")],
  ["architect", unsplash("1487958449943-2429e8be8625")],
  ["landscap", unsplash("1558904541-efa843a96f01")],
  ["engineer", unsplash("1581094794329-c8112a89af12")],
  ["kitchen", unsplash("1556911220-bff31c812dba")],
  ["bath", unsplash("1556911220-bff31c812dba")],
  ["contractor", unsplash("1503387762-592deb58ef4e")],
];
const DEFAULT_COVER_IMAGE = unsplash("1503387762-592deb58ef4e");

function coverForProfession(profession: string): string {
  const p = profession.toLowerCase();
  return (
    CATEGORY_COVER_IMAGE.find(([match]) => p.includes(match))?.[1] ??
    DEFAULT_COVER_IMAGE
  );
}

export type Professional = {
  id: string;
  slug?: string;
  name: string;
  profession: string;
  location: string;
  cover?: string;
  avatar?: string;
  rating: number;
  reviews: number;
  verified?: boolean;
  price: string;
  priceUnit: string;
  tagline: string;
};

export default function ProCard({
  pro,
  onOpen,
  saved,
  onSave,
}: {
  pro: Professional;
  onOpen?: () => void;
  saved?: boolean;
  onSave?: (id: string) => void;
}) {
  const initial = pro.name.trim().charAt(0).toUpperCase() || "?";
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
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/10", background: colors.primarySoft, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pro.cover || coverForProfession(pro.profession)}
          alt={pro.name}
          loading="lazy"
          className="card-hover-img"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {pro.verified && (
          <span
            style={{
              position: "absolute",
              left: spacing.md,
              bottom: spacing.md,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: fontSize.xs,
              fontWeight: 700,
              color: colors.white,
              background: "rgba(16,28,48,0.72)",
              padding: "5px 11px",
              borderRadius: radius.full,
            }}
          >
            <Icon name="verified" size={13} filled color={colors.white} />
            Verified
          </span>
        )}
        {onSave && (
          <button
            aria-label={saved ? "Remove from saved" : "Save professional"}
            onClick={(e) => {
              e.stopPropagation();
              onSave(pro.id);
            }}
            style={{
              position: "absolute",
              right: spacing.md,
              top: spacing.md,
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: colors.white,
              display: "grid",
              placeItems: "center",
              color: saved ? "#E5484D" : colors.ink2,
              boxShadow: shadow.sm,
            }}
          >
            <Icon name="heart" size={18} filled={saved} />
          </button>
        )}
      </div>
      <div style={{ padding: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.md, flex: 1 }}>
        <div style={{ display: "flex", gap: spacing.md, alignItems: "center" }}>
          {pro.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pro.avatar}
              alt={pro.name}
              style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: `2px solid ${colors.white}`, boxShadow: `0 0 0 1px ${colors.line}` }}
            />
          ) : (
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                color: colors.white,
                fontWeight: 700,
                fontSize: fontSize.md,
                border: `2px solid ${colors.white}`,
                boxShadow: `0 0 0 1px ${colors.line}`,
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
          )}
          <div>
            <h3 style={{ fontSize: fontSize.lg - 1.5, fontWeight: 700 }}>{pro.name}</h3>
            <p style={{ fontSize: fontSize.xs, color: colors.muted, marginTop: 2 }}>
              {pro.profession} · {pro.location.split(",")[0]}
            </p>
          </div>
        </div>
        <p style={{ fontSize: fontSize.sm + 1, color: colors.ink2, lineHeight: 1.45 }}>{pro.tagline}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: fontSize.sm }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
            <Icon name="star" size={14} filled color={colors.gold} />
            {pro.rating.toFixed(1)}
          </span>
          {pro.reviews > 0 && (
            <>
              <span style={{ color: colors.line }}>·</span>
              <span style={{ color: colors.muted }}>{pro.reviews} reviews</span>
            </>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <span>
            <b style={{ fontSize: fontSize.lg - 1 }}>{pro.price}</b>
            {pro.priceUnit && (
              <em style={{ fontStyle: "normal", fontSize: fontSize.xs, color: colors.muted }}> / {pro.priceUnit}</em>
            )}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: fontSize.sm, fontWeight: 600, color: colors.primary }}
          >
            View profile <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
