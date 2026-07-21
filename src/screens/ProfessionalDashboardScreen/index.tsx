"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import Brand from "@/components/Brand";
import CardSkeleton from "@/components/CardSkeleton";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import { getAuthToken, getActiveRole, setActiveRole } from "@/utils/authStorage";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useRoleSwitchStore } from "@/store/useRoleSwitchStore";
import ProfileService from "@/services/ProfileService";
import SwitchProfessionalService from "@/services/SwitchProfessionalService";
import ProfessionalDashboardService, {
  type ProfessionalHomeRecord,
  type ProfessionalEnquiryRecord,
  type ProfessionalProjectRecord,
} from "@/services/ProfessionalDashboardService";
import ProfessionalEnquiryCard from "./ProfessionalEnquiryCard";
import ProfessionalProjectCard from "./ProfessionalProjectCard";
import EnquiryRespondModal from "./EnquiryRespondModal";
import ConfirmModal from "./ConfirmModal";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

type EnquiryKind = "job" | "direct";
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

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [home, setHome] = useState<ProfessionalHomeRecord | null>(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [tab, setTab] = useState<Tab>("job");
  const [toast, setToast] = useState<string | null>(null);

  const [enquiries, setEnquiries] = useState<Record<EnquiryKind, ProfessionalEnquiryRecord[]>>({ job: [], direct: [] });
  const [enquiryCounts, setEnquiryCounts] = useState<Record<EnquiryKind, number>>({ job: 0, direct: 0 });
  const [enquiryPages, setEnquiryPages] = useState<Record<EnquiryKind, number>>({ job: 1, direct: 1 });
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [loadingMoreEnquiry, setLoadingMoreEnquiry] = useState(false);

  const [projects, setProjects] = useState<Record<ProjectTab, ProfessionalProjectRecord[]>>({ ongoing: [], completed: [], cancelled: [] });
  const [projectPages, setProjectPages] = useState<Record<ProjectTab, number>>({ ongoing: 1, completed: 1, cancelled: 1 });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMoreProject, setLoadingMoreProject] = useState(false);

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);

  const refreshEnquiries = async () => {
    setLoadingEnquiries(true);
    const res = await ProfessionalDashboardService.getEnquiries(1);
    setLoadingEnquiries(false);
    const groups = res.data?.data?.[0];
    if (!res.success || !res.data?.status || !groups) return;
    setEnquiries({
      job: groups.jobEnquiries?.[0]?.data ?? [],
      direct: groups.directEnquires?.[0]?.data ?? [],
    });
    setEnquiryCounts({
      job: groups.jobEnquiries?.[0]?.totalCount?.total_rows ?? 0,
      direct: groups.directEnquires?.[0]?.totalCount?.total_rows ?? 0,
    });
    setEnquiryPages({ job: 1, direct: 1 });
  };

  const refreshProjects = async () => {
    setLoadingProjects(true);
    const res = await ProfessionalDashboardService.getProjects(1);
    setLoadingProjects(false);
    const groups = res.data?.data?.[0];
    if (!res.success || !res.data?.status || !groups) return;
    setProjects({ ongoing: groups.ongoing ?? [], completed: groups.completed ?? [], cancelled: groups.cancelled ?? [] });
    setProjectPages({ ongoing: 1, completed: 1, cancelled: 1 });
  };

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      setLoadingHome(false);
      setLoadingEnquiries(false);
      setLoadingProjects(false);
      return;
    }
    setSignedIn(true);
    ProfessionalDashboardService.getHome().then((res) => {
      setLoadingHome(false);
      if (res.success && res.data?.status && res.data.data?.[0]) setHome(res.data.data[0]);
    });
    refreshEnquiries();
    refreshProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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
    router.push("/");
  };

  const pin = async (id: string) => {
    const res = await ProfessionalDashboardService.pinEnquiry(id);
    if (res.success && res.data?.status !== false) {
      refreshEnquiries();
      setToast(res.data?.message || "Updated pinned enquiries.");
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const submitRespond = async (text: string) => {
    if (!respondingId) return;
    const res = await ProfessionalDashboardService.respondToEnquiry(respondingId, text);
    setRespondingId(null);
    if (res.success && res.data?.status !== false) {
      refreshEnquiries();
      setToast(res.data?.message || "Response sent.");
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const confirmDecline = async () => {
    if (!decliningId) return;
    setDeclining(true);
    const kind: EnquiryKind = tab === "direct" ? "direct" : "job";
    const res =
      kind === "job"
        ? await ProfessionalDashboardService.ignoreJobEnquiry(decliningId)
        : await ProfessionalDashboardService.rejectDirectEnquiry(decliningId);
    setDeclining(false);
    setDecliningId(null);
    if (res.success && res.data?.status !== false) {
      refreshEnquiries();
      setToast(res.data?.message || (kind === "job" ? "Enquiry ignored." : "Enquiry rejected."));
    } else {
      setToast(res.data?.message || res.message || "Something went wrong.");
    }
  };

  const loadMoreEnquiries = async (kind: EnquiryKind) => {
    if (loadingMoreEnquiry) return;
    setLoadingMoreEnquiry(true);
    const nextPage = enquiryPages[kind] + 1;
    const res = await ProfessionalDashboardService.getEnquiries(nextPage);
    setLoadingMoreEnquiry(false);
    const groups = res.data?.data?.[0];
    const next = kind === "job" ? groups?.jobEnquiries?.[0]?.data : groups?.directEnquires?.[0]?.data;
    if (res.success && res.data?.status && next && next.length > 0) {
      setEnquiries((prev) => ({ ...prev, [kind]: [...prev[kind], ...next] }));
      setEnquiryPages((p) => ({ ...p, [kind]: nextPage }));
    }
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
  const enquiryTotal = enquiryCounts.job + enquiryCounts.direct;
  const isEnquiryTab = tab === "job" || tab === "direct";
  const activeEnquiries = isEnquiryTab ? enquiries[tab as EnquiryKind] : [];
  const activeProjects = !isEnquiryTab ? projects[tab as ProjectTab] : [];

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      {/* No SiteNav/SiteFooter here — Professional mode is a self-contained
          area (mirrors homedot-mobile-app's separate Professional stack, with
          its own tab bar rather than the User side's chrome); RoleGate keeps
          the rest of the site unreachable while this mode is active, so a
          shared header pointing back into it would just create a bounce. */}
      {signedIn && home && (
        <div style={{ background: colors.card, borderBottom: `1px solid ${colors.line}` }}>
          <div style={{ ...wrap, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Brand />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={switchToUser}
                disabled={switchingRole}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: fontSize.xs,
                  fontWeight: 700,
                  color: colors.primary,
                  background: colors.primarySoft,
                  padding: "10px 16px",
                  borderRadius: radius.full,
                }}
              >
                <Icon name="user" size={14} color={colors.primary} /> {switchingRole ? "Switching…" : "Switch to User"}
              </button>
              <button
                onClick={logout}
                disabled={loggingOut}
                aria-label="Log out"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: colors.bg,
                  color: colors.muted,
                  display: "grid",
                  placeItems: "center",
                  border: `1.5px solid ${colors.line}`,
                  flexShrink: 0,
                }}
              >
                <Icon name="logout" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      <LoginModal ref={loginModalRef} hideTrigger />

      <section style={{ ...wrap, paddingTop: spacing.xl }}>
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
          <div className="skeleton-shimmer" style={{ height: 180, borderRadius: radius.lg, marginBottom: spacing.xl }} />
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
            <Reveal
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: radius.lg,
                padding: "clamp(24px, 4vw, 38px)",
                background: `linear-gradient(120deg, ${colors.primary} 0%, #1c3155 60%, ${colors.price} 130%)`,
                boxShadow: shadow.md,
                marginBottom: spacing.xl,
              }}
            >
              <span style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: colors.accent, filter: "blur(70px)", opacity: 0.35 }} />

              <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: spacing.lg, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
                  <span
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2.5px solid rgba(255,255,255,0.85)",
                      background: "rgba(255,255,255,0.14)",
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {home.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={home.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Icon name="user" size={28} color={colors.white} />
                    )}
                  </span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 600, color: colors.white }}>
                        {home.name}
                      </h1>
                      {info?.verified ? (
                        <Badge icon="verified" text={info.featured ? "Featured" : "Verified"} />
                      ) : (
                        <Badge icon="clock" text="Pending verification" />
                      )}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.78)", fontSize: fontSize.sm, marginTop: 4 }}>
                      {info?.professionalCategoryName}
                      {info?.subCategoryName ? ` · ${info.subCategoryName}` : ""}
                    </p>
                  </div>
                </div>

                {roleError && (
                  <span style={{ color: "#FCA5A5", fontSize: fontSize.xs, textAlign: "right" }}>{roleError}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: spacing.md, marginTop: spacing.xl, position: "relative" }}>
                <StatTile icon="mail" label="Enquiries" value={String(enquiryTotal)} />
                <StatTile icon="briefcase" label="Total Work" value={String(home.totalProjects ?? 0)} />
                <StatTile icon="star" label="Avg. Rating" value={String(info?.rating ?? 0)} />
              </div>
            </Reveal>

            <div style={{ display: "flex", gap: 8, marginBottom: spacing.xl, flexWrap: "wrap" }}>
              {ENQUIRY_TABS.map((t) => (
                <TabButton key={t.key} active={tab === t.key} icon={t.icon} label={t.label} count={enquiryCounts[t.key]} onClick={() => setTab(t.key)} />
              ))}
              {PROJECT_TABS.map((t) => (
                <TabButton key={t.key} active={tab === t.key} icon={t.icon} label={t.label} count={projects[t.key].length} onClick={() => setTab(t.key)} />
              ))}
            </div>
          </>
        )}
      </section>

      {signedIn && home && (
        <section style={{ ...wrap, paddingBottom: spacing.huge }}>
          {isEnquiryTab ? (
            loadingEnquiries ? (
              <SkeletonGrid />
            ) : activeEnquiries.length === 0 ? (
              <EmptyState
                icon={tab === "job" ? "mail" : "chat"}
                title={tab === "job" ? "No Job Enquiries" : "No Direct Enquiries"}
                subtitle={tab === "job" ? "Job enquiries from clients will show up here." : "Enquiries sent to you directly will show up here."}
              />
            ) : (
              <>
                <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.lg }}>
                  {activeEnquiries.map((e) => (
                    <ProfessionalEnquiryCard
                      key={e._id}
                      enquiry={e}
                      kind={tab as EnquiryKind}
                      onPin={() => pin(e._id)}
                      onRespond={() => setRespondingId(e._id)}
                      onDecline={() => setDecliningId(e._id)}
                    />
                  ))}
                </Reveal>
                <LoadMore onClick={() => loadMoreEnquiries(tab as EnquiryKind)} loading={loadingMoreEnquiry} label="Show more enquiries" />
              </>
            )
          ) : loadingProjects ? (
            <SkeletonGrid />
          ) : activeProjects.length === 0 ? (
            <EmptyState icon="briefcase" title={`No ${tab} projects`} subtitle="Projects will appear here once a client engages you." />
          ) : (
            <>
              <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.lg }}>
                {activeProjects.map((p) => (
                  <ProfessionalProjectCard key={p._id} project={p} />
                ))}
              </Reveal>
              <LoadMore onClick={() => loadMoreProjects(tab as ProjectTab)} loading={loadingMoreProject} label="Show more projects" />
            </>
          )}
        </section>
      )}

      {respondingId && (
        <EnquiryRespondModal onClose={() => setRespondingId(null)} onSubmit={submitRespond} />
      )}

      {decliningId && (
        <ConfirmModal
          icon="close"
          title={tab === "direct" ? "Reject this enquiry?" : "Ignore this enquiry?"}
          message={
            tab === "direct"
              ? "The customer will be notified that you're not available for this job."
              : "This enquiry will be removed from your list without notifying the customer."
          }
          confirmLabel={tab === "direct" ? "Yes, reject it" : "Yes, ignore it"}
          loading={declining}
          onClose={() => setDecliningId(null)}
          onConfirm={confirmDecline}
        />
      )}

      {toast && (
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
          {toast}
        </div>
      )}
    </div>
  );
}

function Badge({ icon, text }: { icon: IconName; text: string }) {
  return (
    <span
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

function StatTile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: radius.md, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={16} color={colors.white} />
      </span>
      <div>
        <p style={{ color: colors.white, fontSize: fontSize.lg, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{value}</p>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10.5, fontWeight: 600, margin: 0, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</p>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, count, onClick }: { active: boolean; icon: IconName; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: fontSize.sm,
        fontWeight: 600,
        padding: "10px 16px",
        borderRadius: radius.full,
        background: active ? colors.primary : colors.card,
        color: active ? colors.white : colors.ink2,
        border: `1px solid ${active ? colors.primary : colors.line}`,
      }}
    >
      <Icon name={icon} size={15} /> {label}
      {count > 0 && (
        <span
          style={{
            marginLeft: 2,
            fontSize: fontSize.xs,
            fontWeight: 700,
            background: active ? "rgba(255,255,255,0.22)" : colors.primarySoft,
            color: active ? colors.white : colors.primary,
            padding: "1px 7px",
            borderRadius: radius.full,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function LoadMore({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: spacing.xxl }}>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          fontWeight: 600,
          fontSize: fontSize.sm,
          color: colors.ink,
          background: colors.card,
          border: `1.5px solid ${colors.line}`,
          borderRadius: radius.full,
          padding: "12px 22px",
        }}
      >
        {loading ? "Loading…" : label}
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, subtitle, action }: { icon: IconName; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "70px 20px", border: `1px dashed ${colors.line}`, borderRadius: radius.lg, background: colors.card }}>
      <span style={{ width: 64, height: 64, borderRadius: "50%", background: colors.primarySoft, color: colors.primary, display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
        <Icon name={icon} size={28} />
      </span>
      <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: colors.muted, marginBottom: spacing.lg, maxWidth: 420, marginInline: "auto" }}>{subtitle}</p>
      {action}
    </div>
  );
}
