"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import CardSkeleton from "@/components/CardSkeleton";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import { getAuthToken } from "@/utils/authStorage";
import MarketplaceScreenService, { type PropertyRecord } from "@/services/MarketplaceScreenService";
import MyPropertyDetail from "./MyPropertyDetail";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

type Purpose = "Buy" | "Rent";

function formatPriceINR(amount: number): string {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(amount % 1e7 === 0 ? 0 : 2)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(amount % 1e5 === 0 ? 0 : 2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function parseBeds(bedrooms: string | undefined): number {
  const m = /^(\d+)/.exec(bedrooms ?? "");
  return m ? parseInt(m[1], 10) : 0;
}

// The only two confirmed raw `status` values are "Listed" (admin-approved,
// live) and "Sold Out". homedot-mobile-app's own card component never reads
// `status` at all — it discovers "not approved yet" reactively, only when
// the owner taps through and the detail fetch comes back with an empty
// propertyDetails array (see MyPropertyDetail's pending-approval state).
// Defaulting anything that isn't explicitly "Listed" to "Live" would show a
// still-pending submission as already live, so unrecognized statuses fall
// through to "Pending Approval" instead.
function statusMeta(status: string): { label: string; grad: string; icon: "check" | "close" | "clock" } {
  if (status === "Sold Out") return { label: "Sold Out", grad: "linear-gradient(90deg, #EF4444, #DC2626)", icon: "close" };
  if (status === "Listed") return { label: "Live", grad: "linear-gradient(90deg, #10B981, #059669)", icon: "check" };
  return { label: "Pending Approval", grad: "linear-gradient(90deg, #F59E0B, #D97706)", icon: "clock" };
}

export default function MyPropertyScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const loginModalRef = useRef<LoginModalHandle>(null);
  const autoOpenHandled = useRef(false);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [purpose, setPurpose] = useState<Purpose>("Buy");
  const [lists, setLists] = useState<Record<Purpose, PropertyRecord[]>>({ Buy: [], Rent: [] });
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<{ slug: string; purpose: Purpose } | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      setLoading(false);
      return;
    }
    setSignedIn(true);
    Promise.all([MarketplaceScreenService.getMyProperties("Buy"), MarketplaceScreenService.getMyProperties("Rent")]).then(
      ([buyRes, rentRes]) => {
        setLoading(false);
        setLists({
          Buy: buyRes.success && buyRes.data?.status ? (buyRes.data.data?.[0]?.data ?? []) : [],
          Rent: rentRes.success && rentRes.data?.status ? (rentRes.data.data?.[0]?.data ?? []) : [],
        });
      },
    );
  }, []);

  // Resolves a shared "?property=<slug>&purpose=<Buy|Rent>" link once, same
  // pattern as BlogScreen/ProjectsScreen's slug resolution.
  useEffect(() => {
    if (autoOpenHandled.current) return;
    const slug = searchParams.get("property");
    if (!slug) return;
    autoOpenHandled.current = true;
    const p: Purpose = searchParams.get("purpose") === "Rent" ? "Rent" : "Buy";
    const timer = setTimeout(() => setDetail({ slug, purpose: p }), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPropertyQueryParam = (slug: string | null, p?: Purpose) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("property", slug);
      params.set("purpose", p ?? "Buy");
    } else {
      params.delete("property");
      params.delete("purpose");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const openDetail = (slug: string, p: Purpose) => {
    autoOpenHandled.current = true;
    window.scrollTo(0, 0);
    setPropertyQueryParam(slug, p);
    setDetail({ slug, purpose: p });
  };

  const closeDetail = () => {
    setDetail(null);
    window.scrollTo(0, 0);
    setPropertyQueryParam(null);
  };

  const removeFromList = (id: string, p: Purpose) => {
    setLists((prev) => ({ ...prev, [p]: prev[p].filter((r) => r._id !== id) }));
  };

  const updateInList = (id: string, p: Purpose, patch: Partial<PropertyRecord>) => {
    setLists((prev) => ({ ...prev, [p]: prev[p].map((r) => (r._id === id ? { ...r, ...patch } : r)) }));
  };

  if (detail) {
    return (
      <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
        <AmbientBackground />
        <ScrollProgress />
        <Cursor />
        <SiteNav />
        <MyPropertyDetail
          slug={detail.slug}
          purpose={detail.purpose}
          onBack={closeDetail}
          onSoldOut={() => updateInList(detail.slug, detail.purpose, { status: "Sold Out" })}
          onDeleted={() => {
            removeFromList(detail.slug, detail.purpose);
            closeDetail();
          }}
        />
        <SiteFooter />
      </div>
    );
  }

  const list = lists[purpose];

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <LoginModal ref={loginModalRef} hideTrigger />

      <section style={{ ...wrap, paddingTop: spacing.xl }}>
        <Reveal
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: radius.lg,
            padding: "clamp(28px, 5vw, 44px)",
            background: `linear-gradient(120deg, ${colors.primary} 0%, #1c3155 60%, ${colors.price} 130%)`,
            boxShadow: shadow.md,
            marginBottom: spacing.xl,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <span
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: colors.accent,
              filter: "blur(70px)",
              opacity: 0.35,
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: "rgba(255,255,255,0.75)" }}>
              <span>Home</span>
              <Icon name="arrow" size={13} />
              <span style={{ color: colors.white }}>My Property</span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 3.4vw, 38px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: colors.white,
                marginTop: spacing.sm,
              }}
            >
              My Property
            </h1>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: fontSize.base, marginTop: 6 }}>
              Manage the listings you&apos;ve posted on HomeDot.
            </p>
          </div>
          {signedIn && (
            <span style={{ position: "relative" }}>
              <Button variant="light" size="lg" icon={<Icon name="briefcase" size={17} />} onClick={() => router.push("/property/add")}>
                Add Property
              </Button>
            </span>
          )}
        </Reveal>

        {signedIn && (
          <div style={{ display: "flex", gap: 8, marginBottom: spacing.xl }}>
            {(["Buy", "Rent"] as Purpose[]).map((p) => (
              <button
                key={p}
                onClick={() => setPurpose(p)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: fontSize.sm,
                  fontWeight: 600,
                  padding: "10px 18px",
                  borderRadius: radius.full,
                  background: purpose === p ? colors.primary : colors.card,
                  color: purpose === p ? colors.white : colors.ink2,
                  border: `1px solid ${purpose === p ? colors.primary : colors.line}`,
                }}
              >
                <Icon name={p === "Buy" ? "house" : "briefcase"} size={16} /> {p === "Buy" ? "For Sale" : "For Rent"}
                {lists[p].length > 0 && (
                  <span
                    style={{
                      marginLeft: 2,
                      fontSize: fontSize.xs,
                      fontWeight: 700,
                      background: purpose === p ? "rgba(255,255,255,0.22)" : colors.primarySoft,
                      color: purpose === p ? colors.white : colors.primary,
                      padding: "1px 7px",
                      borderRadius: radius.full,
                    }}
                  >
                    {lists[p].length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <section style={{ ...wrap, paddingBottom: spacing.huge }}>
        {signedIn === false && (
          <EmptyState
            title="Sign in to see your properties"
            subtitle="Listings you post on HomeDot show up here once you're signed in."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
                Log in
              </Button>
            }
          />
        )}

        {signedIn && loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {signedIn && !loading && list.length === 0 && (
          <EmptyState
            title={purpose === "Rent" ? "No rental listings yet" : "No properties for sale yet"}
            subtitle="Post your first listing and it'll show up here for you to manage."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="briefcase" size={18} />} onClick={() => router.push("/property/add")}>
                Add a property
              </Button>
            }
          />
        )}

        {signedIn && !loading && list.length > 0 && (
          <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
            {list.map((p) => (
              <OwnerPropertyCard key={p._id} record={p} onOpen={() => openDetail(p.propertySlug, purpose)} />
            ))}
          </Reveal>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function OwnerPropertyCard({ record, onOpen }: { record: PropertyRecord; onOpen: () => void }) {
  const isSold = record.status === "Sold Out";
  const meta = statusMeta(record.status);
  const cover = record.propertyImages?.[0]?.imageFile;
  const beds = parseBeds(record.bedrooms);

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
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/11", background: colors.primarySoft, overflow: "hidden" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={record.propertyAdTitle} loading="lazy" className="card-hover-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: colors.muted }}>
            <Icon name="house" size={32} />
          </div>
        )}
        <span
          style={{
            position: "absolute",
            left: spacing.md,
            top: spacing.md,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: fontSize.xs,
            fontWeight: 700,
            color: colors.white,
            background: meta.grad,
            padding: "6px 13px",
            borderRadius: radius.full,
          }}
        >
          <Icon name={meta.icon} size={11} color={colors.white} />
          {meta.label}
        </span>
        {record.propertyType && (
          <span
            style={{
              position: "absolute",
              right: spacing.md,
              top: spacing.md,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 0.3,
              color: colors.white,
              background: "rgba(16,28,48,0.55)",
              padding: "5px 11px",
              borderRadius: radius.full,
              textTransform: "uppercase",
            }}
          >
            {record.propertyType}
          </span>
        )}
      </div>
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: spacing.sm + 1, flex: 1 }}>
        <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: colors.muted, minWidth: 0 }}>
          <Icon name="location" size={15} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {record.propertySubLocation || record.propertyLocation}
          </span>
        </p>
        <h3
          style={{
            fontSize: fontSize.lg - 1,
            fontWeight: 700,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {record.propertyAdTitle}
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", color: colors.ink2 }}>
          {beds > 0 && (
            <span style={{ fontSize: 13.5 }}>
              {beds} {beds === 1 ? "Bed" : "Beds"}
            </span>
          )}
          {record.bathrooms > 0 && <span style={{ fontSize: 13.5 }}>{record.bathrooms} Baths</span>}
          {!!record.buildUpArea && <span style={{ fontSize: 13.5 }}>{record.buildUpArea.toLocaleString()} sqft</span>}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <span>
            <em style={{ fontStyle: "normal", fontSize: fontSize.xs, color: colors.muted, display: "block" }}>
              {isSold ? "Last listed price" : "Price"}
            </em>
            <b style={{ fontFamily: "var(--font-display)", fontSize: fontSize.lg, fontWeight: 700, color: colors.price }}>
              {formatPriceINR(record.price ?? 0)}
            </b>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: fontSize.sm, fontWeight: 600, color: colors.primary }}>
            Manage <Icon name="arrow" size={14} className="bl-cta-arrow" />
          </span>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "70px 20px",
        border: `1px dashed ${colors.line}`,
        borderRadius: radius.lg,
        background: colors.card,
      }}
    >
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
        <Icon name="house" size={28} />
      </span>
      <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: colors.muted, marginBottom: spacing.lg, maxWidth: 420, marginInline: "auto" }}>{subtitle}</p>
      {action}
    </div>
  );
}
