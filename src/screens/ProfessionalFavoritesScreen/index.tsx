"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import BlogCard from "@/components/BlogCard";
import AmbientBackground from "@/components/AmbientBackground";
import ProDashboardHero from "@/components/ProDashboardHero";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import EmptyState from "@/components/EmptyState";
import SkeletonGrid from "@/components/SkeletonGrid";
import ProDashboardSidebar from "@/components/ProDashboardSidebar";
import ProDashboardSkeleton from "@/components/ProDashboardSkeleton";
import BlogScreenService, {
  toBlogCard,
  toBlogArticle,
  type BlogCard as BlogCardData,
  type BlogArticle,
} from "@/services/BlogScreenService";
import ProfessionalBlogService from "@/services/ProfessionalBlogService";
import BlogDetail from "@/screens/BlogScreen/BlogDetail";
import { getAuthToken } from "@/utils/authStorage";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";
import ProfileService from "@/services/ProfileService";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

/** Web counterpart of homedot-mobile-app's professional FavoritesScreen.js —
 * "Favourite Blogs" only (mobile's professional favorites screen has no
 * properties/professionals tabs, unlike the regular-user FavoritesScreen at
 * /favorites). Needed as its own /professional/* route rather than reusing
 * /favorites directly: RoleGate bounces a professional-mode account back to
 * /professional/dashboard from any route outside /professional, so the
 * ProDashboardSidebar's "Favourites" link previously pointed at a page a
 * professional could never actually stay on. Also reads/writes through the
 * professional-scoped endpoints (PROFESSIONAL.FAVORITE_BLOGS /
 * PROFESSIONAL.ALL_BLOGS's shared toggle) rather than /favorites' user-scoped
 * ones — see ProfessionalBlogService's and AllBlogsPanel's comments on why
 * those two are genuinely separate server-side collections. */
export default function ProfessionalFavoritesScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [blogs, setBlogs] = useState<BlogCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string[]>([]);

  const [detail, setDetail] = useState<BlogArticle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const autoOpenHandled = useRef(false);

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      setLoading(false);
      return;
    }
    setSignedIn(true);
    useProfileStore.getState().fetch();
    useProfessionalHomeStore.getState().refresh();
    ProfessionalBlogService.getFavoriteBlogs().then((res) => {
      setLoading(false);
      if (res.success && res.data?.status) {
        setBlogs((res.data.data ?? []).map(toBlogCard));
      }
    });
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await ProfileService.logout().catch(() => null);
    useAuthStore.getState().clearTokens();
    useProfileStore.getState().clear();
    useProfessionalHomeStore.getState().clear();
    router.push("/");
  };

  // Same optimistic-removal pattern as /favorites' unfavoriteBlog — the
  // shared BLOG.TOGGLE_FAVORITE endpoint un-favorites it, correct for both
  // roles (see ApiConstants.PROFESSIONAL.ALL_BLOGS's comment).
  const unfavoriteBlog = (id: string) => {
    if (removing.includes(id)) return;
    setRemoving((r) => [...r, id]);
    BlogScreenService.toggleFavoriteBlog(id).then((res) => {
      setRemoving((r) => r.filter((x) => x !== id));
      if (res.success) {
        setBlogs((b) => b.filter((p) => p.id !== id));
      }
    });
  };

  const setPostQueryParam = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("post", slug);
    else params.delete("post");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Opens a blog's full detail inline (same self-contained-dashboard pattern
  // as AllBlogsPanel) rather than routing out to the public /blog page.
  const openDetail = (slug: string) => {
    autoOpenHandled.current = true;
    setDetailLoading(true);
    setDetail(null);
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
    setPostQueryParam(null);
  };

  // Resolves a shared "?post=<slug>" link once — same best-effort-once
  // pattern as AllBlogsPanel/BlogScreen's identical effect.
  useEffect(() => {
    if (autoOpenHandled.current) return;
    const slug = searchParams.get("post");
    if (!slug) return;
    autoOpenHandled.current = true;
    const timer = setTimeout(() => openDetail(slug), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        background: colors.bg,
        color: colors.ink,
        position: "relative",
        zIndex: 0,
      }}
    >
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      {/* No SiteNav — same self-contained professional area as
          ProfessionalDashboardScreen (see its own comment on this).
          SiteFooter is still shown, variant="professional". */}
      <LoginModal ref={loginModalRef} hideTrigger />

      {signedIn && (
        <ProDashboardHero minHeight="clamp(220px, 22vw, 280px)">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: fontSize.sm,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <span>Dashboard</span>
            <Icon name="arrow" size={13} />
            <span style={{ color: colors.white }}>Favourites</span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4.2vw, 44px)",
              fontWeight: 600,
              color: colors.white,
              letterSpacing: "-0.02em",
            }}
          >
            Favourite Blogs
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: fontSize.md,
              maxWidth: 480,
            }}
          >
            {blogs.length > 0
              ? `${blogs.length} blog${blogs.length === 1 ? "" : "s"} saved for easy reading.`
              : "Blogs you favourite from All Blogs are saved here."}
          </p>
        </ProDashboardHero>
      )}

      <section
        style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}
      >
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in to see your favourites"
            subtitle="Blogs you favourite show up here once you're signed in."
            action={
              <Button
                variant="primary"
                size="lg"
                icon={<Icon name="check" size={18} />}
                onClick={() => loginModalRef.current?.open()}
              >
                Log in
              </Button>
            }
          />
        ) : signedIn === null ? (
          <ProDashboardSkeleton />
        ) : (
          <div
            className="grid grid-cols-1 xl:grid-cols-[264px_1fr]"
            style={{ gap: spacing.xl, alignItems: "start" }}
          >
            <ProDashboardSidebar onLogout={logout} loggingOut={loggingOut} />

            <main style={{ minWidth: 0 }}>
              {detail || detailLoading ? (
                <BlogDetail
                  article={detail}
                  loading={detailLoading}
                  saved={!!detail && blogs.some((b) => b.id === detail.id)}
                  onSave={() => detail && unfavoriteBlog(detail.id)}
                  onBack={closeDetail}
                  onOpenRelated={openDetail}
                />
              ) : (
                <Reveal
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.line}`,
                    borderRadius: radius.lg,
                    padding: "clamp(18px, 2.4vw, 26px)",
                    boxShadow: shadow.sm,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: spacing.lg,
                    }}
                  >
                    <h3 style={{ fontSize: fontSize.md, fontWeight: 700 }}>
                      Favourite blogs
                    </h3>
                    {blogs.length > 0 && (
                      <span
                        style={{
                          fontSize: fontSize.xs,
                          fontWeight: 700,
                          color: colors.muted,
                          background: colors.bg,
                          border: `1px solid ${colors.line}`,
                          padding: "3px 10px",
                          borderRadius: radius.full,
                        }}
                      >
                        {blogs.length}
                      </span>
                    )}
                  </div>
                  {loading ? (
                    <SkeletonGrid />
                  ) : blogs.length === 0 ? (
                    <EmptyState
                      icon="heart"
                      title="No favourite blogs yet"
                      subtitle="Tap the heart on any article in All Blogs to save it here for quick access later."
                      action={
                        <Button
                          variant="primary"
                          size="lg"
                          icon={<Icon name="compass" size={18} />}
                          onClick={() => router.push("/professional/blogs")}
                        >
                          Browse All Blogs
                        </Button>
                      }
                    />
                  ) : (
                    <Reveal
                      stagger
                      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                      style={{ gap: spacing.lg }}
                    >
                      {blogs.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            opacity: removing.includes(b.id) ? 0.5 : 1,
                            transition: "opacity 0.2s ease",
                          }}
                        >
                          <BlogCard
                            post={b}
                            saved
                            onSave={unfavoriteBlog}
                            onOpen={() => b.slug && openDetail(b.slug)}
                          />
                        </div>
                      ))}
                    </Reveal>
                  )}
                </Reveal>
              )}
            </main>
          </div>
        )}
      </section>

      <SiteFooter variant="professional" />
    </div>
  );
}
