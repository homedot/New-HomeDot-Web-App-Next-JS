"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import BlogCard from "@/components/BlogCard";
import CardSkeleton from "@/components/CardSkeleton";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import { getAuthToken } from "@/utils/authStorage";
import BlogScreenService, {
  toBlogCard,
  toBlogArticle,
  type BlogCard as BlogCardData,
  type BlogArticle,
  type BlogCategory,
} from "@/services/BlogScreenService";
import BlogDetail from "./BlogDetail";
import { categoryTabs, fallbackPosts, heroImage } from "./data";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

export default function BlogScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [category, setCategory] = useState<"all" | BlogCategory>("all");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<BlogCardData[]>(fallbackPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // True until the very first response for the current category comes back
  // (success or failure) — drives the skeleton grid instead of flashing
  // fallbackPosts that then get swapped for the real thing.
  const [initialLoad, setInitialLoad] = useState(true);

  const [saved, setSaved] = useState<string[]>([]);
  const [detail, setDetail] = useState<BlogArticle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const autoOpenHandled = useRef(false);

  // Seeds the saved/favorited set from the backend for signed-in visitors,
  // same pattern as ProfessionalsScreen/MarketplaceScreen.
  useEffect(() => {
    if (!getAuthToken()) return;
    BlogScreenService.getFavoriteBlogs().then((res) => {
      if (res.success && res.data?.status && res.data.data) {
        setSaved(res.data.data.map((b) => b._id));
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const res =
        category === "all"
          ? await BlogScreenService.getBlogList(1)
          : await BlogScreenService.getBlogsByCategory(category);
      if (cancelled) return;
      setLoading(false);
      setInitialLoad(false);
      const result = res.data?.data?.[0];
      if (res.success && res.data?.status) {
        const list = result ? result.data.map(toBlogCard) : [];
        setPosts(list);
        setPage(1);
        setHasMore(category === "all" && list.length > 0 && (result?.totalCount ? list.length < result.totalCount.total_rows : true));
      } else {
        setPosts([]);
        setHasMore(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const loadMore = async () => {
    if (loading || loadingMore || category !== "all") return;
    setLoadingMore(true);
    const res = await BlogScreenService.getBlogList(page + 1);
    setLoadingMore(false);
    const result = res.data?.data?.[0];
    if (res.success && res.data?.status && result && result.data.length > 0) {
      const next = result.data.map(toBlogCard);
      setPosts((prev) => [...prev, ...next]);
      setPage((p) => p + 1);
      if (result.totalCount) setHasMore(posts.length + next.length < result.totalCount.total_rows);
    } else {
      setHasMore(false);
    }
  };

  const setPostQueryParam = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("post", slug);
    else params.delete("post");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Full-article reading is signed-in only, mirroring homedot-mobile-app's
  // BlogScreenGradeningandHomeDesignCards.cardClick (guests get a "Login
  // Required" popup instead) — same gating convention already established
  // on this site by ProfessionalsScreen's openDetail.
  const openDetail = (slug: string) => {
    if (!getAuthToken()) {
      loginModalRef.current?.open();
      return;
    }
    autoOpenHandled.current = true;
    setDetailLoading(true);
    setDetail(null);
    window.scrollTo(0, 0);
    setPostQueryParam(slug);
    BlogScreenService.getBlogDetail(slug).then((res) => {
      setDetailLoading(false);
      if (res.success && res.data?.status && res.data.data) {
        setDetail(toBlogArticle(res.data.data));
      }
    });
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailLoading(false);
    window.scrollTo(0, 0);
    setPostQueryParam(null);
  };

  // Resolves a shared "?post=<slug>" link once, for signed-in visitors —
  // same best-effort-once pattern as ProfessionalsScreen's slug resolution.
  useEffect(() => {
    if (autoOpenHandled.current || !getAuthToken()) return;
    const slug = searchParams.get("post");
    if (!slug) return;
    autoOpenHandled.current = true;
    // Deferred a tick so the state updates inside openDetail don't run
    // synchronously within this effect's body (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => openDetail(slug), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSave = (id: string) => {
    if (!getAuthToken()) {
      loginModalRef.current?.open();
      return;
    }
    const wasSaved = saved.includes(id);
    setSaved((s) => (wasSaved ? s.filter((x) => x !== id) : [...s, id]));
    BlogScreenService.toggleFavoriteBlog(id).then((res) => {
      if (!res.success || !res.data?.status) {
        setSaved((s) => (wasSaved ? [...s, id] : s.filter((x) => x !== id)));
      }
    });
  };

  const list = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.trim().toLowerCase();
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
  }, [posts, query]);

  const [featured, ...rest] = list;

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <LoginModal ref={loginModalRef} hideTrigger />

      {detail || detailLoading ? (
        <BlogDetail
          article={detail}
          loading={detailLoading}
          saved={!!detail && saved.includes(detail.id)}
          onSave={() => detail && toggleSave(detail.id)}
          onBack={closeDetail}
          onOpenRelated={openDetail}
        />
      ) : (
        <>
          {/* hero */}
          <section style={{ ...wrap, paddingTop: spacing.xl }}>
            <div
              style={{
                position: "relative",
                borderRadius: radius.lg,
                overflow: "hidden",
                height: "clamp(200px, 26vw, 300px)",
                boxShadow: shadow.md,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(95deg, ${colors.primary} 0%, rgba(16,28,48,0.5) 55%, transparent 85%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "clamp(22px, 3.5vw, 44px)",
                  bottom: "clamp(20px, 3vw, 34px)",
                  color: colors.white,
                  maxWidth: 640,
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
                  <span style={{ color: colors.white }}>Blog</span>
                </div>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(26px, 3.6vw, 42px)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    marginTop: spacing.sm + 2,
                  }}
                >
                  Ideas, tips &amp; inspiration for your home
                </h1>
                <p style={{ marginTop: 8, fontSize: fontSize.base, color: "rgba(255,255,255,0.88)" }}>
                  Real advice from verified professionals and the HomeDot team.
                </p>
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
                margin: "-28px auto 0",
                position: "relative",
                zIndex: 2,
                width: "calc(100% - 40px)",
                boxShadow: shadow.lg,
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
                  flex: 1,
                }}
              >
                <Icon name="search" size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles — kitchens, budgets, contractors…"
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
              {categoryTabs.map((c) => (
                <button
                  key={c.id}
                  className="bl-pill"
                  onClick={() => setCategory(c.id)}
                  style={{
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: fontSize.sm,
                    fontWeight: 600,
                    color: category === c.id ? colors.white : colors.ink2,
                    background: category === c.id ? colors.primary : colors.card,
                    border: `1px solid ${category === c.id ? colors.primary : colors.line}`,
                    padding: "9px 16px",
                    borderRadius: radius.full,
                    boxShadow: shadow.sm,
                  }}
                >
                  <Icon name={c.icon} size={15} />
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* results */}
          <section style={{ ...wrap, paddingTop: spacing.xxl + 6, paddingBottom: spacing.huge }}>
            <div style={{ marginBottom: spacing.lg }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 600 }}>
                {categoryTabs.find((c) => c.id === category)?.label}
              </h2>
              <p style={{ color: colors.muted, fontSize: fontSize.base, marginTop: 5 }}>
                {initialLoad ? "Finding the latest stories for you…" : `${list.length} ${list.length === 1 ? "article" : "articles"}`}
              </p>
            </div>

            {initialLoad ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : list.length === 0 ? (
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
                  <Icon name="book" size={26} />
                </span>
                <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>No articles match your search</h3>
                <p style={{ color: colors.muted }}>Try a different keyword or browse another category.</p>
              </div>
            ) : (
              <>
                {featured && !query.trim() && (
                  <Reveal style={{ marginBottom: spacing.xl }}>
                    <BlogCard
                      post={featured}
                      featured
                      onOpen={() => featured.slug && openDetail(featured.slug)}
                      saved={saved.includes(featured.id)}
                      onSave={toggleSave}
                    />
                  </Reveal>
                )}
                <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
                  {(query.trim() ? list : rest).map((p) => (
                    <BlogCard
                      key={p.id}
                      post={p}
                      onOpen={() => p.slug && openDetail(p.slug)}
                      saved={saved.includes(p.id)}
                      onSave={toggleSave}
                    />
                  ))}
                </Reveal>
              </>
            )}

            {hasMore && list.length > 0 && !query.trim() && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: spacing.xxl }}>
                <button
                  onClick={loadMore}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 600,
                    fontSize: fontSize.sm,
                    color: colors.ink,
                    background: colors.card,
                    border: `1.5px solid ${colors.line}`,
                    borderRadius: radius.full,
                    padding: "15px 26px",
                    boxShadow: shadow.sm,
                  }}
                >
                  {loadingMore ? "Loading…" : "Show more articles"}
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <SiteFooter />
    </div>
  );
}
