"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import ProjectsService, { type ProjectDetailRecord } from "@/services/ProjectsService";

// marginInline (not the margin shorthand) so spreading `wrap` alongside an
// explicit marginBottom elsewhere doesn't trip React's shorthand/longhand
// conflict warning.
const wrap: CSSProperties = { maxWidth: 780, marginInline: "auto", padding: `0 ${spacing.xl}px` };

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLE: Record<string, string> = {
  ongoing: "linear-gradient(90deg, #10B981, #059669)",
  active: "linear-gradient(90deg, #10B981, #059669)",
  completed: "linear-gradient(90deg, #3B82F6, #1D4ED8)",
  pending: "linear-gradient(90deg, #F59E0B, #D97706)",
  cancelled: "linear-gradient(90deg, #EF4444, #DC2626)",
};

export default function ProjectDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showProRating, setShowProRating] = useState(false);
  const [showAppRating, setShowAppRating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const res = await ProjectsService.getProjectDetail(slug);
      if (cancelled) return;
      setLoading(false);
      if (res.success && res.data?.status && res.data.data?.[0]) {
        setProject(res.data.data[0]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const images = project?.projectImageList ?? [];

  const confirmComplete = async () => {
    if (!project) return;
    setCompleting(true);
    const today = new Date().toISOString().slice(0, 10);
    const res = await ProjectsService.completeProject(project._id, today);
    setCompleting(false);
    if (!res.success || !res.data?.status) {
      setToast(res.data?.message || res.message || "Couldn't mark the project complete. Please try again.");
      return;
    }
    setProject({ ...project, projectStatus: "Completed" });
    setShowConfirm(false);
    setShowProRating(true);
  };

  const submitProRating = async (rating: number, review: string) => {
    if (!project) return;
    const res = await ProjectsService.addProjectRating(project._id, rating, review);
    if (!res.success || !res.data?.status) {
      setToast(res.data?.message || res.message || "Couldn't submit your review. Please try again.");
      return;
    }
    setShowProRating(false);
    setShowAppRating(true);
  };

  const submitAppRating = async (rating: number, review: string) => {
    const res = await ProjectsService.addAppReview(rating, review);
    setShowAppRating(false);
    setToast(res.success && res.data?.status ? "Thanks for the feedback!" : "Couldn't submit your review. Please try again.");
  };

  return (
    <div style={{ paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
      <div style={{ ...wrap, marginBottom: spacing.lg }}>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: fontSize.sm,
            fontWeight: 600,
            color: colors.ink2,
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.full,
            padding: "9px 16px",
            boxShadow: shadow.sm,
          }}
        >
          <Icon name="arrowLeft" size={16} />
          Back to My Projects
        </button>
      </div>

      {loading || !project ? (
        <div style={wrap}>
          <div className="skeleton-shimmer" style={{ height: 220, borderRadius: radius.lg }} />
          <div style={{ marginTop: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.md }}>
            <div className="skeleton-shimmer" style={{ height: 16, width: "60%", borderRadius: 6 }} />
            <div className="skeleton-shimmer" style={{ height: 16, width: "40%", borderRadius: 6 }} />
          </div>
        </div>
      ) : (
        <div style={wrap}>
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.lg,
              boxShadow: shadow.sm,
              marginBottom: spacing.xl,
              overflow: "hidden",
            }}
          >
            <DetailRow icon="user" label="Client" value={project.professionalUser?.[0]?.name || "—"} />
            <Divider />
            <DetailRow icon="briefcase" label="Project" value={project.projectName} />
            <Divider />
            <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", gap: spacing.md }}>
              <IconBadge icon="clock" />
              <span style={{ flex: 1, fontSize: fontSize.base, color: colors.muted, fontWeight: 500 }}>Status</span>
              <span
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: 700,
                  color: colors.white,
                  background: STATUS_STYLE[project.projectStatus?.toLowerCase?.() ?? ""] ?? "linear-gradient(90deg, #6B7280, #4B5563)",
                  padding: "6px 14px",
                  borderRadius: radius.full,
                  textTransform: "capitalize",
                }}
              >
                {project.projectStatus}
              </span>
            </div>
            <Divider />
            <DetailRow icon="location" label="Location" value={project.location || "—"} />
            <Divider />
            <DetailRow icon="calendar" label="Start Date" value={formatDate(project.startDate)} />
            <Divider />
            <DetailRow icon="calendar" label="End Date" value={formatDate(project.endDate)} />
          </div>

          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.lg,
              boxShadow: shadow.sm,
              padding: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: spacing.md }}>
              <span style={{ width: 4, height: 18, borderRadius: 2, background: colors.primary }} />
              <h2 style={{ fontSize: fontSize.md, fontWeight: 700 }}>Project Images</h2>
            </div>
            {images.length > 0 ? (
              <div className="no-scrollbar" style={{ display: "flex", gap: spacing.sm, overflowX: "auto", paddingBottom: 4 }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(i)}
                    style={{ position: "relative", flexShrink: 0, width: 140, height: 140, borderRadius: radius.md, overflow: "hidden" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.projectImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.45)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Icon name="share" size={12} color={colors.white} />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div
                style={{
                  height: 160,
                  borderRadius: radius.md,
                  border: `1px dashed ${colors.line}`,
                  background: colors.bg,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: colors.muted,
                }}
              >
                <Icon name="camera" size={28} />
                <span style={{ fontSize: fontSize.sm }}>No images yet</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {project.projectStatus?.toLowerCase() === "ongoing" && (
              <Button variant="primary" size="lg" full onClick={() => setShowConfirm(true)}>
                Project Completed?
              </Button>
            )}
            <Button variant="outline" size="lg" full onClick={() => router.push("/profile")}>
              Facing any issue about this project?
            </Button>
          </div>
        </div>
      )}

      {lightbox !== null && images.length > 0 && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10,20,34,0.92)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: 40,
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 24,
              right: 28,
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.14)",
              color: colors.white,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="close" size={22} color={colors.white} />
          </button>
          {images.length > 1 && (
            <span
              style={{
                position: "absolute",
                top: 30,
                left: 28,
                color: colors.white,
                fontWeight: 600,
                fontSize: fontSize.sm,
                background: "rgba(255,255,255,0.14)",
                padding: "7px 14px",
                borderRadius: radius.full,
              }}
            >
              {lightbox + 1} / {images.length}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox].projectImage}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: radius.md }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i - 1 + images.length) % images.length));
                }}
                aria-label="Previous photo"
                style={{
                  position: "absolute",
                  left: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.14)",
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="arrowLeft" size={22} color={colors.white} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i + 1) % images.length));
                }}
                aria-label="Next photo"
                style={{
                  position: "absolute",
                  right: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.14)",
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="arrow" size={22} color={colors.white} />
              </button>
            </>
          )}
        </div>
      )}

      {showConfirm && (
        <ConfirmModal
          loading={completing}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmComplete}
        />
      )}

      {showProRating && project && (
        <RatingModal
          title={`What about your experience with ${project.professionalUser?.[0]?.name || "your professional"}?`}
          onClose={() => setShowProRating(false)}
          onSubmit={submitProRating}
        />
      )}

      {showAppRating && (
        <RatingModal
          title="What about your experience with the HomeDot app?"
          onClose={() => setShowAppRating(false)}
          onSubmit={submitAppRating}
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
            boxShadow: shadow.lg,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: colors.line, margin: "0 18px" }} />;
}

function IconBadge({ icon }: { icon: "user" | "briefcase" | "clock" | "location" | "calendar" }) {
  return (
    <span
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: colors.primarySoft,
        color: colors.primary,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={17} />
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: "user" | "briefcase" | "clock" | "location" | "calendar";
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", gap: spacing.md }}>
      <IconBadge icon={icon} />
      <span style={{ flex: 1, fontSize: fontSize.base, color: colors.muted, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: fontSize.base, fontWeight: 600, color: colors.ink, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function ConfirmModal({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: colors.overlay,
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(420px, 100%)",
          background: colors.card,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
          textAlign: "center",
          padding: "0 0 30px",
        }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg, #10B981, #059669)" }} />
        <div style={{ padding: "34px 28px 0" }}>
          <span
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: colors.white,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
            }}
          >
            <Icon name="check" size={34} strokeWidth={2.6} />
          </span>
          <h2 style={{ fontSize: fontSize.lg + 1, fontWeight: 700, marginBottom: 10 }}>Mark as Complete?</h2>
          <p style={{ color: colors.muted, fontSize: fontSize.sm, lineHeight: 1.55, marginBottom: spacing.lg }}>
            Confirm that this project has been successfully finished. You&apos;ll be asked to share your experience with the professional.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, padding: "0 6px" }}>
            <Button variant="primary" size="lg" full onClick={onConfirm} icon={loading ? undefined : <Icon name="check" size={18} />}>
              {loading ? "Saving…" : "Yes, Mark as Complete"}
            </Button>
            <Button variant="outline" size="lg" full onClick={onClose}>
              Not Yet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Icon name="star" size={32} filled={n <= (hover || value)} color={n <= (hover || value) ? colors.gold : colors.line} />
        </button>
      ))}
    </div>
  );
}

function RatingModal({
  title,
  onClose,
  onSubmit,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!review.trim()) {
      setError("Please share a few words about your experience.");
      return;
    }
    setError(null);
    setSubmitting(true);
    await onSubmit(rating, review.trim());
    setSubmitting(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: colors.overlay,
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px, 100%)",
          background: colors.card,
          borderRadius: 24,
          boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
          padding: "34px 32px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(16,28,48,0.06)",
            color: colors.ink,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="close" size={18} />
        </button>
        <h2 style={{ fontSize: fontSize.lg, fontWeight: 700, textAlign: "center", marginBottom: spacing.lg, paddingRight: 20 }}>{title}</h2>
        <StarInput value={rating} onChange={setRating} />
        <p style={{ textAlign: "center", color: colors.muted, fontSize: fontSize.sm, margin: `${spacing.sm}px 0 ${spacing.lg}px` }}>
          {rating > 0 ? `${rating}/5` : "Tap a star to rate"}
        </p>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Your review"
          rows={4}
          style={{
            width: "100%",
            border: `1.5px solid ${error ? "#C0392B" : colors.line}`,
            borderRadius: radius.md,
            padding: "12px 14px",
            fontSize: fontSize.sm,
            color: colors.ink,
            outline: "none",
            resize: "vertical",
            marginBottom: spacing.md,
          }}
        />
        {error && <p style={{ color: "#C0392B", fontSize: fontSize.sm, marginBottom: spacing.sm }}>{error}</p>}
        <Button variant="primary" size="lg" full onClick={submit}>
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
