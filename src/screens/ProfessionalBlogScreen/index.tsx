"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import AmbientBackground from "@/components/AmbientBackground";
import ProDashboardHero from "@/components/ProDashboardHero";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import EmptyState from "@/components/EmptyState";
import SkeletonGrid from "@/components/SkeletonGrid";
import LoadMoreButton from "@/components/LoadMoreButton";
import TabButton from "@/components/TabButton";
import ConfirmModal from "@/components/ConfirmModal";
import ProDashboardSidebar from "@/components/ProDashboardSidebar";
import ProDashboardSkeleton from "@/components/ProDashboardSkeleton";
import ProfessionalBlogCardItem from "@/components/ProfessionalBlog/Card";
import BlogFormModal from "@/components/ProfessionalBlog/FormModal";
import { useProfessionalBlogs, type BlogTab } from "@/components/ProfessionalBlog/useProfessionalBlogs";
import { toProfessionalBlogCard } from "@/services/ProfessionalBlogService";
import { getAuthToken } from "@/utils/authStorage";
import ProfileService from "@/services/ProfileService";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

const TABS: { key: BlogTab; label: string; icon: IconName }[] = [
  { key: "published", label: "Published", icon: "book" },
  { key: "draft", label: "Drafts", icon: "edit" },
];

/** Web counterpart of homedot-mobile-app's ProfessionalBlogScreen/AllBlogList
 * — the professional's own "My Blogs" management surface (as opposed to
 * BlogScreen, the guest-facing read feed). Same full-screen layout as
 * ProfessionalEnquiriesScreen/ProfessionalWorkfolioScreen: ProDashboardHero
 * + ProDashboardSidebar + a single card with an animated pill tab bar
 * (Published/Drafts) — data and mutations come from useProfessionalBlogs. */
export default function ProfessionalBlogScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const blog = useProfessionalBlogs();

  const tabRefs = useRef<Partial<Record<BlogTab, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[blog.tab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // `signedIn` matters too — see ProfessionalEnquiriesScreen's identical effect comment.
  }, [blog.tab, signedIn]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
    setSignedIn(!!getAuthToken());
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await ProfileService.logout().catch(() => null);
    useAuthStore.getState().clearTokens();
    useProfileStore.getState().clear();
    useProfessionalHomeStore.getState().clear();
    router.push("/");
  };

  const activeRecords = blog.tab === "published" ? blog.published : blog.drafts;
  const activeCards = activeRecords.map(toProfessionalBlogCard);
  const totalBlogs = blog.publishedCount + blog.drafts.length;

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      {/* No SiteNav/SiteFooter — same self-contained professional area as
          ProfessionalDashboardScreen (see its own comment on this). */}
      <LoginModal ref={loginModalRef} hideTrigger />

      {signedIn && (
        <ProDashboardHero minHeight="clamp(220px, 22vw, 280px)">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: "rgba(255,255,255,0.75)" }}>
            <span>Dashboard</span>
            <Icon name="arrow" size={13} />
            <span style={{ color: colors.white }}>Blogs</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4.2vw, 44px)", fontWeight: 600, color: colors.white, letterSpacing: "-0.02em" }}>
            My Blogs
          </h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: fontSize.md, maxWidth: 480 }}>
            {totalBlogs > 0 ? `${totalBlogs} blog${totalBlogs === 1 ? "" : "s"} — share tips and projects with home owners.` : "Share tips, projects and advice to reach home owners."}
          </p>
        </ProDashboardHero>
      )}

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in to manage your blogs"
            subtitle="Write and publish blogs to home owners once you're signed in."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
                Log in
              </Button>
            }
          />
        ) : signedIn === null ? (
          <ProDashboardSkeleton />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[264px_1fr]" style={{ gap: spacing.xl, alignItems: "start" }}>
            <ProDashboardSidebar onLogout={logout} loggingOut={loggingOut} />

            <main style={{ minWidth: 0 }}>
              <Reveal
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.lg,
                  padding: "clamp(18px, 2.4vw, 26px)",
                  boxShadow: shadow.sm,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: spacing.sm }}>
                  <div
                    className="pdash-tabbar"
                    style={{
                      position: "relative",
                      display: "flex",
                      gap: 2,
                      padding: 5,
                      background: colors.bg,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.full,
                      overflowX: "auto",
                    }}
                  >
                    <span
                      className="pf-tab-thumb"
                      style={{
                        position: "absolute",
                        top: 5,
                        bottom: 5,
                        left: indicator.left,
                        width: indicator.width,
                        background: colors.primary,
                        borderRadius: radius.full,
                        zIndex: 0,
                      }}
                    />
                    {TABS.map((t) => (
                      <TabButton
                        key={t.key}
                        ref={(el) => {
                          tabRefs.current[t.key] = el;
                        }}
                        active={blog.tab === t.key}
                        icon={t.icon}
                        label={t.label}
                        count={t.key === "published" ? blog.publishedCount : blog.drafts.length}
                        onClick={() => blog.setTab(t.key)}
                      />
                    ))}
                  </div>

                  <button
                    onClick={blog.openCreate}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      height: 40,
                      padding: "0 16px",
                      borderRadius: radius.full,
                      background: colors.primary,
                      color: "#fff",
                      fontSize: fontSize.sm,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="book" size={15} color="#fff" /> New blog
                  </button>
                </div>

                {blog.loading ? (
                  <SkeletonGrid />
                ) : activeCards.length === 0 ? (
                  <EmptyState
                    icon={blog.tab === "published" ? "book" : "edit"}
                    title={blog.tab === "published" ? "No blogs published yet" : "No drafts saved"}
                    subtitle={
                      blog.tab === "published"
                        ? "Publish your first blog to reach home owners browsing HomeDot."
                        : "Save a blog as a draft to keep working on it later."
                    }
                    action={
                      blog.tab === "published" ? (
                        <Button variant="primary" size="lg" icon={<Icon name="book" size={18} />} onClick={blog.openCreate}>
                          Write a blog
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <>
                    <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.lg }}>
                      {activeCards.map((card, i) => (
                        <ProfessionalBlogCardItem
                          key={card.id}
                          blog={card}
                          onEdit={() => blog.openEdit(activeRecords[i])}
                          onDelete={() => blog.requestDelete(card.id)}
                        />
                      ))}
                    </Reveal>
                    {blog.tab === "published" && activeCards.length < blog.publishedCount && (
                      <LoadMoreButton onClick={blog.loadMore} loading={blog.loadingMore} label="Show more blogs" />
                    )}
                  </>
                )}
              </Reveal>
            </main>
          </div>
        )}
      </section>

      {blog.formTarget && (
        <BlogFormModal target={blog.formTarget} loading={blog.saving} onClose={blog.closeForm} onSubmit={blog.submitForm} />
      )}

      {blog.deletingId && (
        <ConfirmModal
          icon="trash"
          title="Delete this blog?"
          message="This blog will be permanently removed and won't be visible to home owners anymore."
          confirmLabel="Yes, delete it"
          loading={blog.deleting}
          onClose={blog.cancelDelete}
          onConfirm={blog.confirmDelete}
        />
      )}

      {blog.toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100,
            background: colors.ink,
            color: colors.white,
            padding: "12px 20px",
            borderRadius: radius.full,
            fontSize: fontSize.sm,
            fontWeight: 600,
            boxShadow: "0 20px 40px -14px rgba(0,0,0,0.35)",
          }}
        >
          {blog.toast}
        </div>
      )}
    </div>
  );
}
