"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import { hexToRgb } from "@/utils/color";
import { useCountUp } from "@/utils/useCountUp";
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
import ProDashboardAnalytics from "@/components/ProDashboardAnalytics";
import ProDashboardActivityChart from "@/components/ProDashboardActivityChart";
import ProDashboardSkeleton from "@/components/ProDashboardSkeleton";
import ProfessionalEnquiryCard from "@/components/ProfessionalEnquiry/Card";
import RespondModal from "@/components/ProfessionalEnquiry/RespondModal";
import InitiateProjectModal from "@/components/ProfessionalEnquiry/InitiateProjectModal";
import { useProfessionalEnquiries, type EnquiryKind } from "@/components/ProfessionalEnquiry/useProfessionalEnquiries";
import { getAuthToken, getActiveRole, setActiveRole } from "@/utils/authStorage";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";
import { useRoleSwitchStore } from "@/store/useRoleSwitchStore";
import ProfileService from "@/services/ProfileService";
import SwitchProfessionalService from "@/services/SwitchProfessionalService";
import ProfessionalDashboardService, {
  type ProfessionalHomeRecord,
  type ProfessionalProjectRecord,
} from "@/services/ProfessionalDashboardService";
import ProfessionalProjectCard from "./ProfessionalProjectCard";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

type ProjectTab = "ongoing" | "completed" | "cancelled";
type Tab = EnquiryKind | ProjectTab;

const ENQUIRY_TABS: { key: EnquiryKind; label: string; icon: IconName }[] = [
  { key: "job", label: "Job Enquiries", icon: "mail" },
  { key: "direct", label: "Direct Enquiries", icon: "chat" },
];
const PROJECT_TABS: { key: ProjectTab; label: string; icon: IconName }[] = [
  { key: "ongoing", label: "Ongoing", icon: "clock" },
  { key: "completed", label: "Completed", icon: "check" },
  { key: "cancelled", label: "Cancelled", icon: "close" },
];
const ALL_TABS = [...ENQUIRY_TABS, ...PROJECT_TABS];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Web counterpart of homedot-mobile-app's ProfessionalHomeScreen.js +
 * JobEnquiryScreen/DirectEnquiryScreen/TotalWorksTabViewNavigator, collapsed
 * into a single page (this app's established "own route, own hero banner"
 * pattern — see ProjectsScreen/EnquiriesScreen — rather than mobile's nested
 * tab navigators). Core dashboard scope only: summary, enquiries with
 * respond/ignore/reject, and the three project status lists. Gallery, blog
 * and notifications are out of scope. */
export default function ProfessionalDashboardScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const profile = useProfileStore((s) => s.profile);
  const home = useProfessionalHomeStore((s) => s.home);
  // Shows a loading skeleton only while there's truly nothing to paint yet —
  // once the shared store has fetched once this session (e.g. the professional
  // came from /professional/profile, which just saved an edit into it), this
  // is instantly false, so navigating here shows fresh data with no flash.
  const loadingHome = useProfessionalHomeStore((s) => s.loading || (!s.loaded && !s.home));

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [tab, setTab] = useState<Tab>("job");

  // Sliding pill behind the active tab — measured from the actual button
  // layout (widths vary per label), same pattern as ProfessionalDetail's
  // pf-tab-thumb.
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[tab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [tab, loadingHome]);

  const [projects, setProjects] = useState<Record<ProjectTab, ProfessionalProjectRecord[]>>({ ongoing: [], completed: [], cancelled: [] });
  const [projectPages, setProjectPages] = useState<Record<ProjectTab, number>>({ ongoing: 1, completed: 1, cancelled: 1 });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMoreProject, setLoadingMoreProject] = useState(false);

  const refreshProjects = async () => {
    setLoadingProjects(true);
    const res = await ProfessionalDashboardService.getProjects(1);
    setLoadingProjects(false);
    const groups = res.data?.data?.[0];
    if (!res.success || !res.data?.status || !groups) return;
    setProjects({ ongoing: groups.ongoing ?? [], completed: groups.completed ?? [], cancelled: groups.cancelled ?? [] });
    setProjectPages({ ongoing: 1, completed: 1, cancelled: 1 });
  };

  const enq = useProfessionalEnquiries(refreshProjects);

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      setLoadingProjects(false);
      return;
    }
    setSignedIn(true);
    useProfileStore.getState().fetch();
    useProfessionalHomeStore.getState().refresh();
    refreshProjects();
  }, []);

  const switchToUser = async () => {
    setSwitchingRole(true);
    setRoleError(null);
    await useRoleSwitchStore.getState().runSwitch("user", async () => {
      const res = await SwitchProfessionalService.switchRole();
      if (!res.success || res.data?.status === false) {
        setRoleError(res.data?.message || res.message || "Couldn't switch modes. Please try again.");
        return false;
      }
      const pair = res.data?.data?.[0];
      if (pair) useAuthStore.getState().setTokens({ token: pair.token, refreshToken: pair.reToken });
      setActiveRole("user");
      router.push("/profile");
      return true;
    });
    setSwitchingRole(false);
  };

  const logout = async () => {
    setLoggingOut(true);
    await ProfileService.logout().catch(() => null);
    useAuthStore.getState().clearTokens();
    useProfileStore.getState().clear();
    useProfessionalHomeStore.getState().clear();
    router.push("/");
  };

  const loadMoreProjects = async (t: ProjectTab) => {
    if (loadingMoreProject) return;
    setLoadingMoreProject(true);
    const nextPage = projectPages[t] + 1;
    const res = await ProfessionalDashboardService.getProjects(nextPage);
    setLoadingMoreProject(false);
    const groups = res.data?.data?.[0];
    const next = groups?.[t];
    if (res.success && res.data?.status && next && next.length > 0) {
      setProjects((prev) => ({ ...prev, [t]: [...prev[t], ...next] }));
      setProjectPages((p) => ({ ...p, [t]: nextPage }));
    }
  };

  const info = home?.professionalInfo?.[0];
  const enquiryTotal = enq.enquiryCounts.job + enq.enquiryCounts.direct;
  const isEnquiryTab = tab === "job" || tab === "direct";
  const previewEnquiries = isEnquiryTab ? enq.enquiries[tab as EnquiryKind].slice(0, 3) : [];
  const activeProjects = !isEnquiryTab ? projects[tab as ProjectTab] : [];
  const initiatingEnquiry = enq.initiatingId
    ? enq.enquiries.job.find((e) => e._id === enq.initiatingId) || enq.enquiries.direct.find((e) => e._id === enq.initiatingId)
    : null;

  const enquiryOrProjectContent = (
    <>
      {isEnquiryTab ? (
        enq.loading ? (
          <SkeletonGrid count={3} />
        ) : previewEnquiries.length === 0 ? (
          <EmptyState
            icon={tab === "job" ? "mail" : "chat"}
            title={tab === "job" ? "No Job Enquiries" : "No Direct Enquiries"}
            subtitle={tab === "job" ? "Job enquiries from clients will show up here." : "Enquiries sent to you directly will show up here."}
          />
        ) : (
          <>
            <Reveal stagger className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: spacing.lg }}>
              {previewEnquiries.map((e) => (
                <ProfessionalEnquiryCard
                  key={e._id}
                  enquiry={e}
                  kind={tab as EnquiryKind}
                  onPin={() => enq.pin(e._id)}
                  onRespond={() => enq.setRespondingId(e._id)}
                  onDecline={() => enq.openDecline(e._id, tab as EnquiryKind)}
                  onInitiateProject={() => enq.setInitiatingId(e._id)}
                />
              ))}
            </Reveal>
            {enq.enquiryCounts[tab as EnquiryKind] > previewEnquiries.length && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: spacing.xxl }}>
                <button
                  onClick={() => router.push(`/professional/enquiries?tab=${tab}`)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 600,
                    fontSize: fontSize.sm,
                    color: colors.white,
                    background: colors.primary,
                    borderRadius: radius.full,
                    padding: "12px 22px",
                  }}
                >
                  View all {enq.enquiryCounts[tab as EnquiryKind]} {tab === "job" ? "Job Enquiries" : "Direct Enquiries"}
                  <Icon name="arrow" size={14} color={colors.white} />
                </button>
              </div>
            )}
          </>
        )
      ) : loadingProjects ? (
        <SkeletonGrid />
      ) : activeProjects.length === 0 ? (
        <EmptyState icon="briefcase" title={`No ${tab} projects`} subtitle="Projects will appear here once a client engages you." />
      ) : (
        <>
          <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3" style={{ gap: spacing.lg }}>
            {activeProjects.map((p) => (
              <ProfessionalProjectCard key={p._id} project={p} />
            ))}
          </Reveal>
          <LoadMoreButton onClick={() => loadMoreProjects(tab as ProjectTab)} loading={loadingMoreProject} label="Show more projects" />
        </>
      )}
    </>
  );

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <DashboardMargins />
      <ScrollProgress />
      <Cursor />
      {/* No SiteNav/SiteFooter here — Professional mode is a self-contained
          area (mirrors homedot-mobile-app's separate Professional stack, with
          its own tab bar rather than the User side's chrome); RoleGate keeps
          the rest of the site unreachable while this mode is active, so a
          shared header pointing back into it would just create a bounce.
          Brand/switch-role/logout live inside the sidebar and profile rail
          below instead of a top bar — see reference screen-pro-dashboard.jsx. */}
      <LoginModal ref={loginModalRef} hideTrigger />

      {signedIn && home && (
        <ProDashboardHero>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.78)",
                background: "rgba(255,255,255,0.14)",
                padding: "5px 12px",
                borderRadius: radius.full,
              }}
            >
              Professional dashboard
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
              <span className="pdash-pulse-dot" />
              Live
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4.2vw, 44px)", fontWeight: 600, color: colors.white, letterSpacing: "-0.02em" }}>
              {greeting()}, {home.name.split(" ")[0]} 👋
            </h1>
            {info?.verified ? (
              <Badge icon="verified" text={info.featured ? "Featured" : "Verified"} glow />
            ) : (
              <Badge icon="clock" text="Pending verification" />
            )}
          </div>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: fontSize.md, maxWidth: 480 }}>
            {info?.professionalCategoryName}
            {info?.subCategoryName ? ` · ${info.subCategoryName}` : ""}
          </p>
          {roleError && <span style={{ display: "block", color: "#FCA5A5", fontSize: fontSize.xs }}>{roleError}</span>}
        </ProDashboardHero>
      )}

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in to see your professional dashboard"
            subtitle="Your enquiries, projects and professional profile show up here once you're signed in."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
                Log in
              </Button>
            }
          />
        ) : loadingHome ? (
          <ProDashboardSkeleton rail />
        ) : !home ? (
          <EmptyState
            icon="hardhat"
            title="No professional profile found"
            subtitle="Become a professional from your profile page to unlock this dashboard."
            action={
              <Button
                variant="primary"
                size="lg"
                icon={<Icon name="hardhat" size={18} />}
                onClick={() => {
                  // No professional record actually exists despite the
                  // persisted "professional" role — clear it first, or
                  // RoleGate would immediately bounce this navigation
                  // straight back here.
                  setActiveRole("user");
                  router.push("/profile");
                }}
              >
                Go to profile
              </Button>
            }
          />
        ) : (
          <>
            {/* One left rail (profile card + navigator, sticky as a single
                unit) beside one right column (stats, donut, activity graph,
                then the tab card) — replaces the earlier split where the
                profile card sat in its own top block at a different column
                width than the sidebar underneath it, which read as two
                misaligned panels rather than one cohesive nav+identity rail. */}
            <div
              className="grid grid-cols-1 xl:grid-cols-[280px_1fr]"
              style={{ position: "relative", zIndex: 3, gap: spacing.xl, marginTop: "clamp(-72px, -6vw, -40px)", alignItems: "start" }}
            >
              <div className="xl:sticky xl:top-24" style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
                <ProfileRailCard home={home} profile={profile} onSwitch={switchToUser} switching={switchingRole} roleError={roleError} />
                <ProDashboardSidebar onLogout={logout} loggingOut={loggingOut} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl, minWidth: 0 }}>
                <Reveal
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.line}`,
                    borderRadius: radius.lg,
                    boxShadow: shadow.md,
                    padding: "20px clamp(16px, 2.6vw, 28px)",
                  }}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: spacing.md }}>
                    <StatTile icon="mail" label="Enquiries" value={enquiryTotal} tint={colors.accent} />
                    <StatTile icon="clock" label="Ongoing" value={projects.ongoing.length} tint={colors.price} />
                    <StatTile icon="briefcase" label="Total Work" value={home.totalProjects ?? 0} tint={colors.primary} />
                    <StatTile icon="star" label="Avg. Rating" value={Number(info?.rating ?? 0)} decimals={1} tint={colors.goldDeep} />
                  </div>
                </Reveal>

                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: spacing.xl, alignItems: "stretch" }}>
                  <ProDashboardAnalytics
                    ongoing={projects.ongoing.length}
                    completed={projects.completed.length}
                    cancelled={projects.cancelled.length}
                    jobCount={enq.enquiryCounts.job}
                    directCount={enq.enquiryCounts.direct}
                    rating={Number(info?.rating ?? 0)}
                  />
                  <ProDashboardActivityChart projects={[...projects.ongoing, ...projects.completed, ...projects.cancelled]} />
                </div>

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
                    className="pdash-tabbar"
                    style={{
                      position: "relative",
                      display: "flex",
                      gap: 2,
                      marginBottom: 22,
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
                    {ALL_TABS.map((t) => (
                      <TabButton
                        key={t.key}
                        ref={(el) => {
                          tabRefs.current[t.key] = el;
                        }}
                        active={tab === t.key}
                        icon={t.icon}
                        label={t.label}
                        count={t.key === "job" || t.key === "direct" ? enq.enquiryCounts[t.key] : projects[t.key as ProjectTab].length}
                        onClick={() => setTab(t.key)}
                      />
                    ))}
                  </div>

                  {enquiryOrProjectContent}
                </Reveal>
              </div>
            </div>
          </>
        )}
      </section>

      {enq.respondingId && (
        <RespondModal onClose={() => enq.setRespondingId(null)} onSubmit={enq.submitRespond} />
      )}

      {enq.decliningId && (
        <ConfirmModal
          icon="close"
          title={enq.decliningKind === "direct" ? "Reject this enquiry?" : "Ignore this enquiry?"}
          message={
            enq.decliningKind === "direct"
              ? "The customer will be notified that you're not available for this job."
              : "This enquiry will be removed from your list without notifying the customer."
          }
          confirmLabel={enq.decliningKind === "direct" ? "Yes, reject it" : "Yes, ignore it"}
          loading={enq.declining}
          onClose={enq.closeDecline}
          onConfirm={enq.confirmDecline}
        />
      )}

      {enq.initiatingId && initiatingEnquiry && (
        <InitiateProjectModal
          enquiry={initiatingEnquiry}
          loading={enq.initiating}
          onClose={() => enq.setInitiatingId(null)}
          onSubmit={enq.submitInitiateProject}
        />
      )}

      {enq.toast && (
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
          {enq.toast}
        </div>
      )}
    </div>
  );
}

/** Premium, restrained treatment for the light-background margins either side
 * of the centered content column: a soft ink vignette (not a mix of bright
 * colored "confetti" blobs), one slim gold hairline echoing an architect's
 * ruler, and a couple of large, thin-stroke navy watermarks with a single
 * gold accent — mostly-monochrome-plus-one-metallic-accent being the classic
 * "premium" palette move, rather than many saturated brand colors at once. */
function DashboardMargins() {
  const marks: { icon: IconName; left?: string; right?: string; top: string; size: number; cls: string; color: string }[] = [
    { icon: "villa", left: "3%", top: "20%", size: 210, cls: "pdash-illustration", color: `rgba(${hexToRgb(colors.primary)}, 0.06)` },
    { icon: "compass", left: "6%", top: "74%", size: 100, cls: "pdash-illustration-sub", color: `rgba(${hexToRgb(colors.goldDeep)}, 0.13)` },
    { icon: "house", right: "3%", top: "24%", size: 190, cls: "pdash-illustration-sub2", color: `rgba(${hexToRgb(colors.primary)}, 0.06)` },
    { icon: "ruler", right: "7%", top: "76%", size: 92, cls: "pdash-illustration", color: `rgba(${hexToRgb(colors.goldDeep)}, 0.13)` },
  ];
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}>
      <span
        style={{
          position: "absolute",
          left: "-8%",
          top: "10%",
          width: 420,
          height: 620,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.primary}, transparent 70%)`,
          opacity: 0.05,
          filter: "blur(60px)",
        }}
      />
      <span
        style={{
          position: "absolute",
          right: "-8%",
          top: "18%",
          width: 420,
          height: 620,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.primary}, transparent 70%)`,
          opacity: 0.05,
          filter: "blur(60px)",
        }}
      />

      {/* Slim architect's-ruler hairlines — a quiet, precise motif rather
          than literal icons filling the whole margin. */}
      <span
        style={{
          position: "absolute",
          left: "2.4%",
          top: "8%",
          width: 1,
          height: "34%",
          background: `linear-gradient(to bottom, transparent, ${colors.goldDeep}55 20%, ${colors.goldDeep}55 80%, transparent)`,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: "2.4%",
          top: "52%",
          width: 1,
          height: "34%",
          background: `linear-gradient(to bottom, transparent, ${colors.goldDeep}55 20%, ${colors.goldDeep}55 80%, transparent)`,
        }}
      />

      {marks.map((m, i) => (
        <span key={i} className={m.cls} style={{ position: "absolute", left: m.left, right: m.right, top: m.top }}>
          <Icon name={m.icon} size={m.size} strokeWidth={0.6} color={m.color} />
        </span>
      ))}
    </div>
  );
}

function Badge({ icon, text, glow }: { icon: IconName; text: string; glow?: boolean }) {
  return (
    <span
      className={glow ? "animate-glow-pulse" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "rgba(255,255,255,0.16)",
        borderRadius: radius.full,
        padding: "4px 10px",
        fontSize: 10.5,
        fontWeight: 700,
        color: colors.white,
      }}
    >
      <Icon name={icon} size={11} color={colors.white} /> {text}
    </span>
  );
}

function StatTile({ icon, label, value, decimals = 0, tint }: { icon: IconName; label: string; value: number; decimals?: number; tint: string }) {
  const animated = useCountUp(value);
  return (
    <div
      className="pdash-stat"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.md,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span style={{ width: 50, height: 50, borderRadius: 14, background: `rgba(${hexToRgb(tint)}, 0.14)`, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={22} color={tint} />
      </span>
      <div>
        <p style={{ color: colors.ink, fontSize: "clamp(20px, 2.4vw, 26px)", fontWeight: 700, margin: 0, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
          {animated.toFixed(decimals)}
        </p>
        <p style={{ color: colors.muted, fontSize: 11, fontWeight: 600, margin: 0, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</p>
      </div>
    </div>
  );
}

/** Profile card heading the dashboard's sticky left rail (paired with
 * ProDashboardSidebar right below it) — reference screen-pro-dashboard.jsx's
 * pdash-rail, rebuilt from real fields only: ProfessionalDashboardService
 * .getHome() has no location/email, so those come from useProfileStore
 * (fetched alongside getHome() in this screen's mount effect) and are simply
 * omitted if absent rather than shown as placeholder data. */
function ProfileRailCard({
  home,
  profile,
  onSwitch,
  switching,
  roleError,
}: {
  home: ProfessionalHomeRecord;
  profile: { location?: string; email?: string } | null;
  onSwitch: () => void;
  switching: boolean;
  roleError: string | null;
}) {
  const info = home.professionalInfo?.[0];
  const title = [info?.professionalCategoryName, info?.subCategoryName].filter(Boolean).join(" · ");

  return (
    <Reveal
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        overflow: "hidden",
      }}
    >
      <div style={{ height: 84, background: colors.primary }} />
      <div style={{ padding: "0 20px 20px", marginTop: -42, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span style={{ position: "relative", flexShrink: 0 }}>
          <span
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              overflow: "hidden",
              border: `3px solid ${colors.card}`,
              background: colors.primarySoft,
              display: "grid",
              placeItems: "center",
            }}
          >
            {home.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={home.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Icon name="user" size={30} color={colors.primary} />
            )}
          </span>
          <span
            className="pdash-pulse-dot"
            style={{ position: "absolute", right: 2, bottom: 2, width: 12, height: 12, border: `2px solid ${colors.card}` }}
          />
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <h2 style={{ fontSize: fontSize.md, fontWeight: 700 }}>{home.name}</h2>
          {info?.verified && <Icon name="verified" size={16} filled color={colors.primary} />}
        </div>
        {title && <span style={{ fontSize: fontSize.xs, color: colors.muted, marginTop: 2 }}>{title}</span>}
        {!info?.verified && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              marginTop: 8,
              fontSize: 10.5,
              fontWeight: 700,
              color: colors.goldDeep,
              background: "rgba(245,166,35,0.14)",
              padding: "4px 10px",
              borderRadius: radius.full,
            }}
          >
            <Icon name="clock" size={11} color={colors.goldDeep} /> Verification pending
          </span>
        )}
        {info?.rating != null && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: fontSize.xs, fontWeight: 700, color: colors.ink2, marginTop: 6 }}>
            <Icon name="star" size={13} filled color={colors.gold} /> {info.rating}
          </span>
        )}

        {info?.skills && info.skills.length > 0 && (
          <div style={{ width: "100%", marginTop: spacing.lg, textAlign: "left" }}>
            <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
              Skills
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {info.skills.map((s) => (
                <span
                  key={s.levelThreeId}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: colors.primary,
                    background: colors.primarySoft,
                    padding: "5px 10px",
                    borderRadius: radius.full,
                  }}
                >
                  {s.levelThreeName}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: spacing.lg, textAlign: "left" }}>
          {info?.experience != null && (
            <RailMetaRow icon="calendar" text={`${info.experience} years of experience`} />
          )}
          {profile?.location && <RailMetaRow icon="location" text={profile.location} />}
          {profile?.email && <RailMetaRow icon="mail" text={profile.email} />}
        </div>

        {roleError && <p style={{ color: "#C0392B", fontSize: fontSize.xs, marginTop: spacing.md }}>{roleError}</p>}

        <button
          onClick={onSwitch}
          disabled={switching}
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            marginTop: spacing.lg,
            height: 42,
            borderRadius: radius.full,
            background: colors.primarySoft,
            color: colors.primary,
            fontSize: fontSize.sm,
            fontWeight: 700,
          }}
        >
          {switching ? "Switching…" : "Switch to Home Owner"} <Icon name="arrow" size={14} />
        </button>
      </div>
    </Reveal>
  );
}

function RailMetaRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: fontSize.xs, color: colors.ink2 }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>
        <Icon name={icon} size={14} color={colors.muted} />
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{text}</span>
    </div>
  );
}
