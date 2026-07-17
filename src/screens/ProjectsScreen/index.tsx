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
import ProjectsService, { type ProjectRecord, type ProjectStatus } from "@/services/ProjectsService";
import ProjectDetail from "./ProjectDetail";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

type TabKey = "ongoing" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string; icon: "clock" | "check" | "close" }[] = [
  { key: "ongoing", label: "Ongoing", icon: "clock" },
  { key: "completed", label: "Completed", icon: "check" },
  { key: "cancelled", label: "Cancelled", icon: "close" },
];

const STATUS_STYLE: Record<string, { bg: string; ic: "clock" | "check" | "close" }> = {
  ongoing: { bg: "linear-gradient(90deg, #10B981, #059669)", ic: "clock" },
  active: { bg: "linear-gradient(90deg, #10B981, #059669)", ic: "clock" },
  completed: { bg: "linear-gradient(90deg, #3B82F6, #1D4ED8)", ic: "check" },
  pending: { bg: "linear-gradient(90deg, #F59E0B, #D97706)", ic: "clock" },
  cancelled: { bg: "linear-gradient(90deg, #EF4444, #DC2626)", ic: "close" },
};

function statusStyle(status: ProjectStatus) {
  return STATUS_STYLE[status?.toLowerCase?.() ?? ""] ?? { bg: "linear-gradient(90deg, #6B7280, #4B5563)", ic: "clock" as const };
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProjectsScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const loginModalRef = useRef<LoginModalHandle>(null);
  const autoOpenHandled = useRef(false);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabKey>("ongoing");
  const [groups, setGroups] = useState<Record<TabKey, ProjectRecord[]>>({ ongoing: [], completed: [], cancelled: [] });
  const [pages, setPages] = useState<Record<TabKey, number>>({ ongoing: 1, completed: 1, cancelled: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [detailSlug, setDetailSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      setLoading(false);
      return;
    }
    setSignedIn(true);
    ProjectsService.getMyProjects(1).then((res) => {
      setLoading(false);
      const result = res.data?.data?.[0];
      if (res.success && res.data?.status && result) {
        setGroups({ ongoing: result.ongoing ?? [], completed: result.completed ?? [], cancelled: result.cancelled ?? [] });
      }
    });
  }, []);

  // Resolves a shared "?project=<slug>" link once, same pattern as
  // BlogScreen's slug resolution. Deferred a tick so the state update isn't
  // synchronous within the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (autoOpenHandled.current) return;
    const slug = searchParams.get("project");
    if (!slug) return;
    autoOpenHandled.current = true;
    const timer = setTimeout(() => setDetailSlug(slug), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProjectQueryParam = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("project", slug);
    else params.delete("project");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const openDetail = (slug: string) => {
    autoOpenHandled.current = true;
    window.scrollTo(0, 0);
    setProjectQueryParam(slug);
    setDetailSlug(slug);
  };

  const closeDetail = () => {
    setDetailSlug(null);
    window.scrollTo(0, 0);
    setProjectQueryParam(null);
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = pages[tab] + 1;
    const res = await ProjectsService.getMyProjects(nextPage);
    setLoadingMore(false);
    const result = res.data?.data?.[0];
    if (res.success && res.data?.status && result) {
      const next = result[tab] ?? [];
      if (next.length > 0) {
        setGroups((g) => ({ ...g, [tab]: [...g[tab], ...next] }));
        setPages((p) => ({ ...p, [tab]: nextPage }));
      }
    }
  };

  if (detailSlug) {
    return (
      <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
        <AmbientBackground />
        <ScrollProgress />
        <Cursor />
        <SiteNav />
        <ProjectDetail slug={detailSlug} onBack={closeDetail} />
        <SiteFooter />
      </div>
    );
  }

  const list = groups[tab];

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
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: "rgba(255,255,255,0.75)" }}>
            <span>Home</span>
            <Icon name="arrow" size={13} />
            <span style={{ color: colors.white }}>My Projects</span>
          </div>
          <h1
            style={{
              position: "relative",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.4vw, 38px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: colors.white,
              marginTop: spacing.sm,
            }}
          >
            My Projects
          </h1>
          <p style={{ position: "relative", color: "rgba(255,255,255,0.82)", fontSize: fontSize.base, marginTop: 6 }}>
            Track every home project you&apos;ve started with a HomeDot professional.
          </p>
        </Reveal>

        {signedIn && (
          <div style={{ display: "flex", gap: 8, marginBottom: spacing.xl }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: fontSize.sm,
                  fontWeight: 600,
                  padding: "10px 18px",
                  borderRadius: radius.full,
                  background: tab === t.key ? colors.primary : colors.card,
                  color: tab === t.key ? colors.white : colors.ink2,
                  border: `1px solid ${tab === t.key ? colors.primary : colors.line}`,
                }}
              >
                <Icon name={t.icon} size={16} /> {t.label}
                {groups[t.key].length > 0 && (
                  <span
                    style={{
                      marginLeft: 2,
                      fontSize: fontSize.xs,
                      fontWeight: 700,
                      background: tab === t.key ? "rgba(255,255,255,0.22)" : colors.primarySoft,
                      color: tab === t.key ? colors.white : colors.primary,
                      padding: "1px 7px",
                      borderRadius: radius.full,
                    }}
                  >
                    {groups[t.key].length}
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
            icon="briefcase"
            title="Sign in to see your projects"
            subtitle="Projects you start with a professional show up here once you're signed in."
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
            icon="briefcase"
            title={`No ${tab} projects yet`}
            subtitle="Projects you start with a verified professional will show up here."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="search" size={18} />} onClick={() => router.push("/professionals")}>
                Browse professionals
              </Button>
            }
          />
        )}

        {signedIn && !loading && list.length > 0 && (
          <>
            <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
              {list.map((p) => (
                <ProjectCard key={p._id} project={p} onOpen={() => p.projectSlug && openDetail(p.projectSlug)} />
              ))}
            </Reveal>
            <div style={{ display: "flex", justifyContent: "center", marginTop: spacing.xxl }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
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
                {loadingMore ? "Loading…" : "Show more projects"}
              </button>
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: ProjectRecord; onOpen: () => void }) {
  const thumb = project.projectImages?.[0]?.projectImage;
  const st = statusStyle(project.projectStatus);
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: "14px 16px" }}>
        <h3
          style={{
            fontSize: fontSize.md,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project.projectName}
        </h3>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10.5,
            fontWeight: 700,
            color: colors.white,
            background: st.bg,
            padding: "5px 10px",
            borderRadius: radius.full,
            textTransform: "capitalize",
          }}
        >
          <Icon name={st.ic} size={10} color={colors.white} />
          {project.projectStatus}
        </span>
      </div>

      <div style={{ height: 1, background: colors.line, margin: "0 16px" }} />

      <div style={{ display: "flex", gap: spacing.md, padding: 14 }}>
        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: radius.md,
            overflow: "hidden",
            background: colors.primarySoft,
            flexShrink: 0,
          }}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="card-hover-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: colors.muted }}>
              <Icon name="briefcase" size={24} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: spacing.sm + 2, minWidth: 0, flex: 1 }}>
          <InfoRow icon="calendar" label="Date" value={`${formatDate(project.startDate)} – ${formatDate(project.endDate)}`} />
          <InfoRow icon="location" label="Location" value={project.location || "—"} />
        </div>
      </div>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryDeep})`, marginTop: "auto" }} />
    </article>
  );
}

function InfoRow({ icon, label, value }: { icon: "calendar" | "location"; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: colors.primarySoft,
          color: colors.primary,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={12} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 9.5, fontWeight: 700, color: colors.muted, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {label}
        </span>
        <span
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: fontSize.sm,
            fontWeight: 600,
            color: colors.ink,
          }}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: "briefcase";
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
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
        <Icon name={icon} size={28} />
      </span>
      <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: colors.muted, marginBottom: spacing.lg, maxWidth: 420, marginInline: "auto" }}>{subtitle}</p>
      {action}
    </div>
  );
}
