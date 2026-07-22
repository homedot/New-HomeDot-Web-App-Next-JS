"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import ProfessionalEnquiryCard from "@/components/ProfessionalEnquiry/Card";
import RespondModal from "@/components/ProfessionalEnquiry/RespondModal";
import InitiateProjectModal from "@/components/ProfessionalEnquiry/InitiateProjectModal";
import { useProfessionalEnquiries, type EnquiryKind } from "@/components/ProfessionalEnquiry/useProfessionalEnquiries";
import { getAuthToken } from "@/utils/authStorage";
import ProfileService from "@/services/ProfileService";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

const TABS: { key: EnquiryKind; label: string; icon: IconName }[] = [
  { key: "job", label: "Job Enquiries", icon: "mail" },
  { key: "direct", label: "Direct Enquiries", icon: "chat" },
];

/** Full, paginated Job/Direct Enquiry list — the counterpart of
 * homedot-mobile-app's JobEnquiryScreen/DirectEnquiryScreen (reached there
 * from the professional's Notifications tab). ProfessionalDashboardScreen
 * only shows a 3-item preview per kind with a "View all" link into this
 * screen; both share the same data/actions via useProfessionalEnquiries()
 * and the same ProfessionalEnquiryCard/RespondModal/ConfirmModal. */
export default function ProfessionalEnquiriesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const initialTab = searchParams.get("tab") === "direct" ? "direct" : "job";
  const [tab, setTab] = useState<EnquiryKind>(initialTab);

  const enq = useProfessionalEnquiries();

  const tabRefs = useRef<Partial<Record<EnquiryKind, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[tab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // `signedIn` matters too, not just `tab` — the tab bar doesn't exist yet
    // while the sign-in check is pending (a loading skeleton renders in its
    // place, same as ProfessionalDashboardScreen's identical `[tab, loadingHome]`
    // dependency), so the very first measurement finds no ref to measure and
    // the pill never appears behind "Job Enquiries" until some other state
    // change happens to re-run this effect.
  }, [tab, signedIn]);

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

  const activeEnquiries = enq.enquiries[tab];
  const initiatingEnquiry = enq.initiatingId
    ? enq.enquiries.job.find((e) => e._id === enq.initiatingId) || enq.enquiries.direct.find((e) => e._id === enq.initiatingId)
    : null;

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
            <span style={{ color: colors.white }}>Enquiries</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4.2vw, 44px)", fontWeight: 600, color: colors.white, letterSpacing: "-0.02em" }}>
            Job &amp; Direct Enquiries
          </h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: fontSize.md, maxWidth: 480 }}>
            Every enquiry from home owners, in one place — respond, pin or decline.
          </p>
        </ProDashboardHero>
      )}

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in to see your enquiries"
            subtitle="Job and direct enquiries from clients show up here once you're signed in."
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
                  {TABS.map((t) => (
                    <TabButton
                      key={t.key}
                      ref={(el) => {
                        tabRefs.current[t.key] = el;
                      }}
                      active={tab === t.key}
                      icon={t.icon}
                      label={t.label}
                      count={enq.enquiryCounts[t.key]}
                      onClick={() => setTab(t.key)}
                    />
                  ))}
                </div>

                {enq.loading ? (
                  <SkeletonGrid />
                ) : activeEnquiries.length === 0 ? (
                  <EmptyState
                    icon={tab === "job" ? "mail" : "chat"}
                    title={tab === "job" ? "No Job Enquiries" : "No Direct Enquiries"}
                    subtitle={tab === "job" ? "Job enquiries from clients will show up here." : "Enquiries sent to you directly will show up here."}
                  />
                ) : (
                  <>
                    <Reveal stagger className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: spacing.lg }}>
                      {activeEnquiries.map((e) => (
                        <ProfessionalEnquiryCard
                          key={e._id}
                          enquiry={e}
                          kind={tab}
                          onPin={() => enq.pin(e._id)}
                          onRespond={() => enq.setRespondingId(e._id)}
                          onDecline={() => enq.openDecline(e._id, tab)}
                          onInitiateProject={() => enq.setInitiatingId(e._id)}
                        />
                      ))}
                    </Reveal>
                    <LoadMoreButton onClick={() => enq.loadMore(tab)} loading={enq.loadingMore} label="Show more enquiries" />
                  </>
                )}
              </Reveal>
            </main>
          </div>
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
