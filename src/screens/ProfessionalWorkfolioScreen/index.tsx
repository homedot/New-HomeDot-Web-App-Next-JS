"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import AmbientBackground from "@/components/AmbientBackground";
import ProDashboardHero from "@/components/ProDashboardHero";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import EmptyState from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import ProDashboardSidebar from "@/components/ProDashboardSidebar";
import ProDashboardSkeleton from "@/components/ProDashboardSkeleton";
import AddWorkModal from "./AddWorkModal";
import WorkfolioLightbox from "./WorkfolioLightbox";
import { getAuthToken } from "@/utils/authStorage";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";
import ProfileService from "@/services/ProfileService";
import ProfessionalGalleryService, { flattenGallery, type GalleryImage } from "@/services/ProfessionalGalleryService";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

/** Web counterpart of homedot-mobile-app's ProfessionalGalleryScreen.js —
 * a flat masonry grid of work photos pulled from the professional's own
 * active + past projects (no categories/filters/search, matching mobile
 * exactly — see ProfessionalGalleryService's comments for the exact data
 * shape). CSS `columns` gives the masonry effect without a JS library. */
export default function ProfessionalWorkfolioScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);
  const home = useProfessionalHomeStore((s) => s.home);
  const homeLoading = useProfessionalHomeStore((s) => s.loading || (!s.loaded && !s.home));

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [addingWork, setAddingWork] = useState(false);
  const [savingWork, setSavingWork] = useState(false);

  const userId = home?.professionalInfo?.[0]?.userId;

  const refreshGallery = async (uid: string) => {
    setGalleryLoading(true);
    const res = await ProfessionalGalleryService.getGallery(uid);
    setGalleryLoading(false);
    setGalleryLoaded(true);
    if (res.success && res.data?.status && res.data.data?.[0]) {
      setGallery(flattenGallery(res.data.data[0]));
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      return;
    }
    setSignedIn(true);
    useProfileStore.getState().fetch();
    useProfessionalHomeStore.getState().refresh();
  }, []);

  // Gallery depends on the professional's userId, which only arrives once
  // `home` has loaded — fetch as soon as it's available, not on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gallery state necessarily lags the shared home store's userId by one render; this is the fetch trigger, not a render-loop
    if (userId) refreshGallery(userId);
  }, [userId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const logout = async () => {
    setLoggingOut(true);
    await ProfileService.logout().catch(() => null);
    useAuthStore.getState().clearTokens();
    useProfileStore.getState().clear();
    useProfessionalHomeStore.getState().clear();
    router.push("/");
  };

  const submitAddWork = async (payload: { projectName: string; projectImages: string[] }) => {
    setSavingWork(true);
    const res = await ProfessionalGalleryService.addProject(payload);
    setSavingWork(false);
    if (res.success && res.data?.status !== false) {
      setAddingWork(false);
      setToast({ text: "Added to your Workfolio.", tone: "success" });
      if (userId) refreshGallery(userId);
    } else {
      setToast({ text: res.data?.message || res.message || "Couldn't add those photos.", tone: "error" });
    }
  };

  const confirmDeleteImage = async () => {
    if (!deletingId) return;
    const image = gallery.find((g) => g._id === deletingId);
    if (!image) return;
    setDeleting(true);
    const res = await ProfessionalGalleryService.deleteImage(image._id, image.historyType);
    setDeleting(false);
    setDeletingId(null);
    setLightboxIndex(null);
    if (res.success && res.data?.status !== false) {
      setToast({ text: "Photo removed.", tone: "success" });
      if (userId) refreshGallery(userId);
    } else {
      setToast({ text: res.data?.message || res.message || "Couldn't remove that photo.", tone: "error" });
    }
  };

  const loading = homeLoading || (!!userId && galleryLoading && !galleryLoaded);

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
            <span style={{ color: colors.white }}>Workfolio</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4.2vw, 44px)", fontWeight: 600, color: colors.white, letterSpacing: "-0.02em" }}>
            Workfolio
          </h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: fontSize.md, maxWidth: 480 }}>
            {gallery.length > 0 ? `${gallery.length} photo${gallery.length === 1 ? "" : "s"} across your projects.` : "Showcase your completed work to home owners."}
          </p>
        </ProDashboardHero>
      )}

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in to see your Workfolio"
            subtitle="Your project photos show up here once you're signed in."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
                Log in
              </Button>
            }
          />
        ) : loading ? (
          <ProDashboardSkeleton />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[264px_1fr]" style={{ gap: spacing.xl, alignItems: "start" }}>
            <ProDashboardSidebar onLogout={logout} loggingOut={loggingOut} />

            <main style={{ minWidth: 0 }}>
              <Reveal style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, padding: "clamp(20px, 2.8vw, 28px)", boxShadow: shadow.sm }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg, flexWrap: "wrap", gap: spacing.sm }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ fontSize: fontSize.md, fontWeight: 700 }}>Work photos</h3>
                    {gallery.length > 0 && (
                      <span style={{ fontSize: fontSize.xs, fontWeight: 700, color: colors.muted, background: colors.bg, border: `1px solid ${colors.line}`, padding: "3px 10px", borderRadius: radius.full }}>
                        {gallery.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setAddingWork(true)}
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
                    }}
                  >
                    <Icon name="camera" size={15} color="#fff" /> Add work
                  </button>
                </div>

                {gallery.length === 0 ? (
                  <EmptyState
                    icon="briefcase"
                    title="Your Workfolio is empty"
                    subtitle="Add project photos to showcase your work to home owners."
                    action={
                      <Button variant="primary" size="lg" icon={<Icon name="camera" size={18} />} onClick={() => setAddingWork(true)}>
                        Add work
                      </Button>
                    }
                  />
                ) : (
                  <div style={{ columnCount: 2, columnGap: 12 }} className="wf-masonry">
                    {gallery.map((img, i) => (
                      <button
                        key={img._id}
                        onClick={() => setLightboxIndex(i)}
                        style={{
                          display: "block",
                          width: "100%",
                          marginBottom: 12,
                          breakInside: "avoid",
                          position: "relative",
                          borderRadius: radius.md,
                          overflow: "hidden",
                          border: `1px solid ${colors.line}`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.projectImage} alt="" style={{ width: "100%", display: "block", objectFit: "cover" }} />
                        {img.historyType && (
                          <span
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: "#fff",
                              background: "rgba(16,28,48,0.65)",
                              padding: "3px 8px",
                              borderRadius: radius.full,
                            }}
                          >
                            <Icon name="clock" size={9} color="#fff" /> Past
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </Reveal>
            </main>
          </div>
        )}
      </section>

      {addingWork && <AddWorkModal loading={savingWork} onClose={() => setAddingWork(false)} onSubmit={submitAddWork} />}

      {lightboxIndex !== null && gallery.length > 0 && (
        <WorkfolioLightbox
          images={gallery}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={(image) => setDeletingId(image._id)}
          deleting={deleting}
        />
      )}

      {deletingId && (
        <ConfirmModal
          icon="trash"
          title="Remove this photo?"
          message="This photo will be removed from your Workfolio. This can't be undone."
          confirmLabel="Yes, remove it"
          loading={deleting}
          onClose={() => setDeletingId(null)}
          onConfirm={confirmDeleteImage}
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
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: toast.tone === "success" ? "#0B3B2E" : colors.ink,
            color: colors.white,
            padding: "12px 20px",
            borderRadius: radius.full,
            fontSize: fontSize.sm,
            fontWeight: 600,
            boxShadow: "0 20px 40px -14px rgba(0,0,0,0.35)",
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: toast.tone === "success" ? "#22C55E" : "#F87171",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={toast.tone === "success" ? "check" : "close"} size={11} color="#0B1F17" />
          </span>
          {toast.text}
        </div>
      )}
    </div>
  );
}
