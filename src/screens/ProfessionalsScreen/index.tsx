"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import ProCard, { type Professional } from "@/components/ProCard";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import { getAuthToken } from "@/utils/authStorage";
import LandingScreenService, {
  toServiceCategoryCard,
  type ServiceCategoryCard,
} from "@/services/LandingScreenService";
import ProfessionalsScreenService, {
  toProfessionalRecord,
  type ProfessionalsFilterQuery,
  type ProfessionalsFilterPayload,
} from "@/services/ProfessionalsScreenService";
import ProfessionalDetail from "./ProfessionalDetail";
import { professionals as mockProfessionals, ratingBuckets, experienceBuckets, budgetBuckets, type ProfessionalRecord } from "./data";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

export default function ProfessionalsScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [categoryOptions, setCategoryOptions] = useState<ServiceCategoryCard[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState<number | null>(null); // index into budgetBuckets
  const [rating, setRating] = useState<number | null>(null); // exact star value
  const [experience, setExperience] = useState<number | null>(null); // index into experienceBuckets
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<"recommended" | "rating" | "experience">("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [saved, setSaved] = useState<string[]>([]);
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [apiProfessionals, setApiProfessionals] = useState<ProfessionalRecord[]>(mockProfessionals);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(mockProfessionals.length);
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<ProfessionalRecord | null>(null);
  const initialSlugHandled = useRef(false);

  useEffect(() => {
    LandingScreenService.getServiceCategories().then((res) => {
      if (res.success && res.data?.status) {
        setCategoryOptions(res.data.data.map(toServiceCategoryCard));
      }
    });
  }, []);

  const filterQuery = useMemo((): ProfessionalsFilterQuery => {
    const b = budget != null ? budgetBuckets[budget] : null;
    return {
      category: category !== "all" ? category : null,
      sqMin: b ? b.sqMin : null,
      sqMax: b ? b.sqMax : null,
    };
  }, [category, budget]);

  const filterPayload = useMemo((): ProfessionalsFilterPayload => {
    const e = experience != null ? experienceBuckets[experience] : null;
    return {
      rating: rating != null ? [rating] : "",
      minExperience: e ? e.min : "",
      maxExperience: e ? e.max : "",
      professionalType: "",
    };
  }, [rating, experience]);

  // Reset to page 1 and refetch whenever a server-side filter changes —
  // mirrors MarketplaceScreen's equivalent effect.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const res = await ProfessionalsScreenService.getProfessionalsFilter(1, filterQuery, filterPayload);
      if (cancelled) return;
      setLoading(false);
      const result = res.data?.data?.[0];
      if (res.success && res.data?.status) {
        setApiProfessionals(result ? result.data.map(toProfessionalRecord) : []);
        setTotalRows(result?.totalCount?.total_rows ?? 0);
        setPage(1);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [filterQuery, filterPayload]);

  const loadMore = async () => {
    if (loading || apiProfessionals.length >= totalRows) return;
    setLoading(true);
    const res = await ProfessionalsScreenService.getProfessionalsFilter(page + 1, filterQuery, filterPayload);
    setLoading(false);
    const result = res.data?.data?.[0];
    if (res.success && res.data?.status && result) {
      setApiProfessionals((prev) => [...prev, ...result.data.map(toProfessionalRecord)]);
      setPage((p) => p + 1);
    }
  };

  const findBySlug = (slug: string | null) =>
    slug ? (apiProfessionals.find((p) => p.slug === slug) ?? null) : null;

  // Resolves a shared "?professional=<slug>" link once the first page of
  // results has loaded — best-effort only: unlike properties, there's no
  // confirmed guest "get professional by slug" endpoint yet, so this only
  // finds a match if that professional happens to already be on the loaded
  // page(s).
  useEffect(() => {
    const resolve = () => {
      if (initialSlugHandled.current || loading) return;
      const slug = searchParams.get("professional");
      if (!slug) return;
      const match = findBySlug(slug);
      if (match) {
        initialSlugHandled.current = true;
        setDetail(match);
      }
    };
    resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiProfessionals, loading]);

  const setProfessionalQueryParam = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("professional", slug);
    else params.delete("professional");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const openDetail = (p: ProfessionalRecord) => {
    initialSlugHandled.current = true;
    setDetail(p);
    window.scrollTo(0, 0);
    setProfessionalQueryParam(p.slug);
  };

  const closeDetail = () => {
    setDetail(null);
    window.scrollTo(0, 0);
    setProfessionalQueryParam(null);
  };

  // Mirrors MarketplaceScreen's toggleSave: gate behind login, then flip
  // local state optimistically. No backend call yet — professionals
  // favoriting isn't wired to an API in this pass.
  const toggleSave = (id: string) => {
    if (!getAuthToken()) {
      loginModalRef.current?.open();
      return;
    }
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  // Client-side refinements only — the server already applied
  // category/budget/rating/experience. Free-text search and "verified
  // only" have no server param on this endpoint, and sort has none either,
  // so all three are applied here over whatever page(s) are loaded.
  const list = useMemo(() => {
    let out = apiProfessionals.slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.profession.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (verifiedOnly) out = out.filter((p) => p.verified);
    if (sort === "rating") out = [...out].sort((a, b) => b.rating - a.rating);
    if (sort === "experience") out = [...out].sort((a, b) => b.experience - a.experience);
    return out;
  }, [apiProfessionals, query, verifiedOnly, sort]);

  const activeCount = (budget != null ? 1 : 0) + (rating != null ? 1 : 0) + (experience != null ? 1 : 0) + (verifiedOnly ? 1 : 0);
  const clearAll = () => {
    setBudget(null);
    setRating(null);
    setExperience(null);
    setVerifiedOnly(false);
  };

  const similarFor = (p: ProfessionalRecord) => {
    const sameCat = apiProfessionals.filter((x) => x.id !== p.id && x.category === p.category);
    const fallback = apiProfessionals.filter((x) => x.id !== p.id);
    return (sameCat.length >= 3 ? sameCat : fallback).slice(0, 3);
  };

  const hasMore = apiProfessionals.length < totalRows;

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <LoginModal ref={loginModalRef} hideTrigger />

      {detail ? (
        <ProfessionalDetail
          pro={detail}
          similar={similarFor(detail)}
          saved={saved}
          onSave={toggleSave}
          onBack={closeDetail}
          onOpen={openDetail}
        />
      ) : (
        <>
          {/* compact hero + search */}
          <section style={{ ...wrap, paddingTop: spacing.xl }}>
            <div
              style={{
                position: "relative",
                borderRadius: radius.lg,
                overflow: "hidden",
                height: "clamp(180px, 22vw, 260px)",
                boxShadow: shadow.md,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80"
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(95deg, ${colors.primary} 0%, rgba(16,28,48,0.45) 55%, transparent 80%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "clamp(22px, 3.5vw, 44px)",
                  bottom: "clamp(20px, 3vw, 34px)",
                  color: colors.white,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: fontSize.sm,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  <span>Home</span>
                  <Icon name="arrow" size={13} />
                  <span style={{ color: colors.white }}>Professionals</span>
                </div>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(24px, 3.4vw, 40px)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    marginTop: spacing.sm + 2,
                  }}
                >
                  Find a verified pro for your home
                </h1>
              </div>
            </div>

            {/* search bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm + 2,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.lg,
                padding: spacing.sm + 2,
                margin: "-30px auto 0",
                position: "relative",
                zIndex: 2,
                width: "calc(100% - 40px)",
                boxShadow: shadow.lg,
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  height: 50,
                  border: `1.5px solid ${colors.line}`,
                  borderRadius: 12,
                  padding: "0 14px",
                  color: colors.muted,
                  flex: "1.4 1 220px",
                  minWidth: 220,
                }}
              >
                <Icon name="search" size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Interior designer, architect, contractor…"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "none",
                    width: "100%",
                    fontSize: fontSize.base - 0.5,
                    color: colors.ink,
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  height: 50,
                  border: `1.5px solid ${colors.line}`,
                  borderRadius: 12,
                  padding: "0 14px",
                  color: colors.muted,
                  flexShrink: 0,
                }}
              >
                <Icon name="location" size={18} />
                <input
                  defaultValue="Kochi, Kerala"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "none",
                    fontSize: fontSize.base - 0.5,
                    color: colors.ink,
                    width: 140,
                  }}
                />
              </label>
              <Button variant="primary" size="md" icon={<Icon name="search" size={17} />}>
                Search
              </Button>
            </div>

            {/* category pills */}
            <div
              className="no-scrollbar"
              style={{
                display: "flex",
                gap: 9,
                overflowX: "auto",
                marginTop: spacing.xl,
                paddingBottom: 2,
              }}
            >
              <CategoryPill label="All" active={category === "all"} onClick={() => setCategory("all")} />
              {categoryOptions.map((c) => (
                <CategoryPill
                  key={c.id}
                  label={c.name}
                  icon={c.icon}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                />
              ))}
            </div>
          </section>

          {/* listings */}
          <section style={{ ...wrap, paddingTop: spacing.xxl + 6 }}>
            <div
              className="grid grid-cols-1 lg:grid-cols-[262px_1fr]"
              style={{ gap: spacing.xxl, alignItems: "start" }}
            >
              {/* filter sidebar */}
              <aside
                className="hidden lg:block"
                style={{
                  position: "sticky",
                  top: 90,
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.md,
                  padding: `4px ${spacing.lg}px ${spacing.md}px`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 0 4px",
                  }}
                >
                  <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.muted }}>
                    {activeCount > 0 ? `${activeCount} active` : "All professionals"}
                  </span>
                  {activeCount > 0 && (
                    <button
                      onClick={clearAll}
                      style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.accent }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <FilterGroup title="Budget (₹ / sqft)">
                  {budgetBuckets.map((b, i) => (
                    <RadioRow key={b.label} label={b.label} checked={budget === i} onChange={() => setBudget(budget === i ? null : i)} />
                  ))}
                </FilterGroup>

                <FilterGroup title="Rating">
                  {ratingBuckets.map((r) => (
                    <RadioRow
                      key={r.value}
                      label={r.label}
                      checked={rating === r.value}
                      onChange={() => setRating(rating === r.value ? null : r.value)}
                    />
                  ))}
                </FilterGroup>

                <FilterGroup title="Experience">
                  {experienceBuckets.map((e, i) => (
                    <RadioRow
                      key={e.label}
                      label={e.label}
                      checked={experience === i}
                      onChange={() => setExperience(experience === i ? null : i)}
                    />
                  ))}
                </FilterGroup>

                <FilterGroup title="Verification" last>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: fontSize.base - 1, color: colors.ink2, fontWeight: 600 }}>
                      HomeDot verified only
                    </span>
                    <span
                      onClick={() => setVerifiedOnly((v) => !v)}
                      style={{
                        width: 40,
                        height: 24,
                        borderRadius: radius.full,
                        background: verifiedOnly ? colors.primary : colors.line,
                        position: "relative",
                        flexShrink: 0,
                        transition: "background .15s ease",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: verifiedOnly ? 19 : 3,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: colors.white,
                          boxShadow: shadow.sm,
                          transition: "left .15s ease",
                        }}
                      />
                    </span>
                  </label>
                </FilterGroup>
              </aside>

              {/* results */}
              <main>
                <div style={{ marginBottom: spacing.lg }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 600 }}>
                    {category === "all" ? "Professionals" : categoryOptions.find((c) => c.id === category)?.name} in Kochi
                  </h2>
                  <p style={{ color: colors.muted, fontSize: fontSize.base, marginTop: 5 }}>
                    {totalRows} {totalRows === 1 ? "professional" : "professionals"} found · sorted by {sort}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing.lg,
                    gap: spacing.md,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="lg:hidden" style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.muted }}>
                    {activeCount > 0 ? `${activeCount} filters active` : "All professionals"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginLeft: "auto" }}>
                    <div
                      style={{
                        display: "flex",
                        background: colors.card,
                        border: `1px solid ${colors.line}`,
                        borderRadius: 10,
                        padding: 3,
                      }}
                    >
                      {(["grid", "list"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          aria-label={v}
                          style={{
                            width: 34,
                            height: 30,
                            borderRadius: 7,
                            display: "grid",
                            placeItems: "center",
                            color: view === v ? colors.primary : colors.muted,
                            background: view === v ? colors.primarySoft : "transparent",
                          }}
                        >
                          <Icon name={v === "grid" ? "grid" : "menu"} size={17} />
                        </button>
                      ))}
                    </div>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: fontSize.sm,
                        color: colors.muted,
                        border: `1px solid ${colors.line}`,
                        borderRadius: 10,
                        padding: "9px 12px",
                        background: colors.card,
                      }}
                    >
                      Sort:
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as typeof sort)}
                        style={{ border: "none", outline: "none", background: "none", fontWeight: 600, color: colors.ink }}
                      >
                        <option value="recommended">Recommended</option>
                        <option value="rating">Highest rated</option>
                        <option value="experience">Most experienced</option>
                      </select>
                    </label>
                  </div>
                </div>

                {activeCount > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg }}>
                    {budget != null && <Chip label={budgetBuckets[budget].label} onRemove={() => setBudget(null)} />}
                    {rating != null && <Chip label={ratingBuckets.find((r) => r.value === rating)!.label} onRemove={() => setRating(null)} />}
                    {experience != null && <Chip label={experienceBuckets[experience].label} onRemove={() => setExperience(null)} />}
                    {verifiedOnly && <Chip label="Verified only" onRemove={() => setVerifiedOnly(false)} />}
                    <button
                      onClick={clearAll}
                      style={{ fontSize: fontSize.xs + 0.5, fontWeight: 600, color: colors.accent, textDecoration: "underline" }}
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {list.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      border: `1px dashed ${colors.line}`,
                      borderRadius: radius.lg,
                      background: colors.card,
                    }}
                  >
                    <span
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: colors.primarySoft,
                        color: colors.primary,
                        display: "grid",
                        placeItems: "center",
                        margin: "0 auto 16px",
                      }}
                    >
                      <Icon name="search" size={26} />
                    </span>
                    <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>No professionals match your filters</h3>
                    <p style={{ color: colors.muted, marginBottom: spacing.lg }}>
                      Try widening your budget or removing a filter.
                    </p>
                    <Button variant="outline" onClick={clearAll}>
                      Clear all filters
                    </Button>
                  </div>
                ) : view === "grid" ? (
                  <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
                    {list.map((p) => (
                      <ProCard
                        key={p.id}
                        pro={p}
                        saved={saved.includes(p.id)}
                        onSave={toggleSave}
                        onOpen={() => openDetail(p)}
                      />
                    ))}
                  </Reveal>
                ) : (
                  <Reveal stagger style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
                    {list.map((p) => (
                      <ProfessionalRow
                        key={p.id}
                        pro={p}
                        saved={saved.includes(p.id)}
                        onSave={toggleSave}
                        onOpen={() => openDetail(p)}
                      />
                    ))}
                  </Reveal>
                )}

                {hasMore && list.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: spacing.xxl }}>
                    <Button variant="outline" size="lg" onClick={loadMore}>
                      {loading ? "Loading…" : "Show more professionals"}
                    </Button>
                  </div>
                )}
              </main>
            </div>
          </section>
        </>
      )}

      <SiteFooter />
    </div>
  );
}

function CategoryPill({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: Parameters<typeof Icon>[0]["name"];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: fontSize.sm,
        fontWeight: 600,
        color: active ? colors.white : colors.ink2,
        background: active ? colors.primary : colors.card,
        border: `1px solid ${active ? colors.primary : colors.line}`,
        padding: "9px 16px",
        borderRadius: radius.full,
        boxShadow: shadow.sm,
      }}
    >
      {icon && <Icon name={icon} size={15} />}
      {label}
    </button>
  );
}

function FilterGroup({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <div style={{ padding: "16px 0", borderBottom: last ? "none" : `1px solid ${colors.line}` }}>
      <h4 style={{ fontSize: fontSize.sm + 0.5, fontWeight: 700, marginBottom: spacing.sm + 2 }}>{title}</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm + 1 }}>{children}</div>
    </div>
  );
}

function RadioRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: fontSize.base - 1, color: colors.ink2, cursor: "pointer" }}>
      <input type="radio" checked={checked} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span
        style={{
          width: 19,
          height: 19,
          borderRadius: "50%",
          border: `${checked ? 5.5 : 1.5}px solid ${checked ? colors.primary : colors.line}`,
          flexShrink: 0,
        }}
      />
      {label}
    </label>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: fontSize.xs + 0.5,
        fontWeight: 600,
        color: colors.ink2,
        background: colors.primarySoft,
        padding: "7px 12px",
        borderRadius: radius.full,
      }}
    >
      {label} <Icon name="close" size={13} />
    </button>
  );
}

function ProfessionalRow({
  pro,
  saved,
  onSave,
  onOpen,
}: {
  pro: Professional & { category: string; tags: string[]; experience: number; projects: number };
  saved: boolean;
  onSave: (id: string) => void;
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="grid grid-cols-1 sm:grid-cols-[220px_1fr]"
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: shadow.sm,
      }}
    >
      <div style={{ position: "relative", minHeight: 180, background: colors.primarySoft }}>
        {pro.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pro.cover} alt={pro.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
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
      </div>
      <div style={{ padding: spacing.lg + 2, display: "flex", flexDirection: "column", gap: spacing.sm + 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: spacing.md }}>
          <div>
            <h3 style={{ fontSize: fontSize.lg - 1, fontWeight: 700, margin: "0 0 4px" }}>{pro.name}</h3>
            <p style={{ fontSize: fontSize.sm, color: colors.muted }}>
              {pro.profession} · {pro.location.split(",")[0]}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(pro.id);
            }}
            aria-label="Save"
            style={{ color: saved ? "#E5484D" : colors.muted, flexShrink: 0 }}
          >
            <Icon name="heart" size={19} filled={saved} />
          </button>
        </div>
        <p style={{ fontSize: fontSize.sm + 1, color: colors.ink2, lineHeight: 1.5 }}>{pro.tagline}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {pro.tags.map((t) => (
            <span
              key={t}
              style={{ fontSize: 12, fontWeight: 600, color: colors.ink2, background: "#EFEFF2", padding: "5px 11px", borderRadius: radius.full }}
            >
              {t}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: "auto", paddingTop: spacing.sm }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
            <Icon name="star" size={14} filled color={colors.gold} />
            {pro.rating.toFixed(1)}
          </span>
          <span style={{ color: colors.line }}>·</span>
          <span style={{ color: colors.muted }}>{pro.experience} yrs</span>
          {pro.projects > 0 && (
            <>
              <span style={{ color: colors.line }}>·</span>
              <span style={{ color: colors.muted }}>{pro.projects} projects</span>
            </>
          )}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 4 }}>
            <b style={{ fontSize: fontSize.lg - 1 }}>{pro.price === "₹0" ? "Free" : pro.price}</b>
            {pro.priceUnit && <em style={{ fontStyle: "normal", fontSize: fontSize.xs, color: colors.muted }}>/ {pro.priceUnit}</em>}
          </span>
        </div>
      </div>
    </article>
  );
}
