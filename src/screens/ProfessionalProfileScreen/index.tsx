"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import EmptyState from "@/components/EmptyState";
import ProDashboardSidebar from "@/components/ProDashboardSidebar";
import ProDashboardSkeleton from "@/components/ProDashboardSkeleton";
import LocationMapPicker, { type LocationValue } from "@/components/LocationMapPicker";
import ManageSkillsModal from "./ManageSkillsModal";
import { getAuthToken, setActiveRole } from "@/utils/authStorage";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useProfessionalHomeStore } from "@/store/useProfessionalHomeStore";
import { useRoleSwitchStore } from "@/store/useRoleSwitchStore";
import ProfileService, { resolveLatLng } from "@/services/ProfileService";
import ProfessionalDashboardService from "@/services/ProfessionalDashboardService";
import SwitchProfessionalService, { PROFESSIONAL_TYPES, buildSkillsPayload, type ProfessionalSkillRecord } from "@/services/SwitchProfessionalService";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

/** Web counterpart of homedot-mobile-app's ProfessionalEditProfileScreen —
 * the professional's own profile: photo, basic details, about, skills. A
 * single "Edit profile"/"Save changes" toggle over Basic Details + About
 * (mirrors ProfileScreen/index.tsx's snapshot-into-form-state pattern
 * exactly), photo uploads immediately on pick, and skills are managed via
 * their own modal — all matching mobile's own split between one big form
 * and its two independent sub-flows. Category/subCategory are shown but not
 * editable here, matching mobile; phone/email are read-only (OTP-based
 * editing is a separate deferred task). No stats/certifications/completion
 * bar — no real data backs those, so none are shown (see plan). */
export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);
  const profile = useProfileStore((s) => s.profile);
  const home = useProfessionalHomeStore((s) => s.home);
  const loading = useProfessionalHomeStore((s) => s.loading || (!s.loaded && !s.home));

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  // Briefly rings the card that was just saved in green, so a save has a
  // visible effect right where the user's eyes already are — not just a
  // toast at the bottom of the screen that's easy to miss.
  const [savedFlash, setSavedFlash] = useState<"details" | "skills" | null>(null);
  const flashSaved = (which: "details" | "skills") => {
    setSavedFlash(which);
    setTimeout(() => setSavedFlash((cur) => (cur === which ? null : cur)), 1600);
  };

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [professionalType, setProfessionalType] = useState<number | null>(null);
  const [experience, setExperience] = useState("");
  const [squareFeetRate, setSquareFeetRate] = useState("");
  const [workingArea, setWorkingArea] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [managingSkills, setManagingSkills] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);

  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const refreshHome = () => useProfessionalHomeStore.getState().refresh();

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(false);
      return;
    }
    setSignedIn(true);
    useProfileStore.getState().fetch();
    refreshHome();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const info = home?.professionalInfo?.[0];

  const resetForm = () => {
    setName(home?.name || "");
    setProfessionalType(PROFESSIONAL_TYPES.find((t) => t.title === info?.professionalType)?.id ?? null);
    setExperience(info?.experience != null ? String(info.experience) : "");
    setSquareFeetRate(info?.squareFeetRate != null ? String(info.squareFeetRate) : "");
    setWorkingArea(info?.workingArea || "");
    setDescription(info?.description || "");
    setLocation(profile?.location ? { address: profile.location, ...resolveLatLng(profile.locationKey?.coordinates ?? [0, 0]) } : null);
  };

  const startEdit = () => {
    resetForm();
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError(null);
  };

  // The update endpoint requires location on every call, even one that's
  // only changing skills or experience — mobile's own validateProfile()
  // blocks submission without it. Falls back to the profile store's saved
  // location when the Basic Details form isn't open (e.g. saving skills),
  // since `location` state is only populated while `editing`.
  const currentLocation = (): LocationValue | null =>
    location ?? (profile?.location ? { address: profile.location, ...resolveLatLng(profile.locationKey?.coordinates ?? [0, 0]) } : null);

  // Every skill sent to the backend must carry the professional's full
  // category/sub-category hierarchy alongside its own levelThreeId/Name —
  // see buildSkillsPayload's comment.
  const skillCategoryContext = () => ({
    levelOneId: info?.professionalCategory || "",
    levelOneName: info?.professionalCategoryName || "",
    levelTwoId: info?.subCategory || "",
    levelTwoName: info?.subCategoryName || "",
  });

  const saveEdit = async () => {
    if (!name.trim()) {
      setSaveError("Name can't be empty.");
      return;
    }
    const loc = currentLocation();
    if (!loc?.address) {
      setSaveError("Please set your location before saving.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const res = await ProfessionalDashboardService.updateProfile({
      name: name.trim(),
      professionalType: PROFESSIONAL_TYPES.find((t) => t.id === professionalType)?.title ?? info?.professionalType,
      professionalCategory: info?.professionalCategory,
      subCategory: info?.subCategory,
      experience: experience.trim(),
      squareFeetRate: squareFeetRate.trim() || undefined,
      workingArea: workingArea.trim() || undefined,
      description: description.trim(),
      skills: buildSkillsPayload(info?.skills ?? [], skillCategoryContext()),
      location: loc.address,
      google_address_string: loc.address,
      latitude: String(loc.lat),
      longitude: String(loc.lng),
    });
    setSaving(false);
    if (!res.success || res.data?.status === false) {
      // Show both: the inline message (stays up while the form is still
      // open, in case the toast's 3s auto-dismiss is missed) and a toast
      // (impossible to miss even if the user isn't looking at the card) —
      // previously this only set the inline message, so a failed save (e.g.
      // a 500 from the backend) could look like nothing happened at all.
      const message = res.data?.message || res.message || "Couldn't save your changes. Please try again.";
      setSaveError(message);
      setToast({ text: message, tone: "error" });
      return;
    }
    setEditing(false);
    setToast({ text: "Profile updated.", tone: "success" });
    flashSaved("details");
    refreshHome();
  };

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    const res = await ProfessionalDashboardService.updateProfileImage(file);
    setUploadingAvatar(false);
    if (res.success) {
      setToast({ text: "Photo updated.", tone: "success" });
      refreshHome();
    } else {
      setToast({ text: res.data?.message || res.message || "Couldn't update your photo.", tone: "error" });
    }
  };

  const saveSkills = async (skills: ProfessionalSkillRecord[]) => {
    const loc = currentLocation();
    if (!loc?.address) {
      setToast({ text: "Please set your location on this profile before saving skills.", tone: "error" });
      return;
    }
    setSavingSkills(true);
    const res = await ProfessionalDashboardService.updateProfile({
      name: home?.name || "",
      professionalType: info?.professionalType,
      professionalCategory: info?.professionalCategory,
      subCategory: info?.subCategory,
      experience: info?.experience != null ? String(info.experience) : "",
      squareFeetRate: info?.squareFeetRate != null ? String(info.squareFeetRate) : undefined,
      workingArea: info?.workingArea,
      description: info?.description || "",
      skills: buildSkillsPayload(skills, skillCategoryContext()),
      location: loc.address,
      google_address_string: loc.address,
      latitude: String(loc.lat),
      longitude: String(loc.lng),
    });
    setSavingSkills(false);
    if (res.success && res.data?.status !== false) {
      setManagingSkills(false);
      setToast({ text: "Skills updated.", tone: "success" });
      flashSaved("skills");
      refreshHome();
    } else {
      setToast({ text: res.data?.message || res.message || "Couldn't update your skills.", tone: "error" });
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    await ProfileService.logout().catch(() => null);
    useAuthStore.getState().clearTokens();
    useProfileStore.getState().clear();
    useProfessionalHomeStore.getState().clear();
    router.push("/");
  };

  // Mirrors ProfessionalDashboardScreen's switchToUser exactly — same
  // "SWITCH TO USER"/"BECOME A USER" action mobile's ProfessionalProfileScreen
  // puts front-and-center on its profile hub card.
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

  const title = [info?.professionalCategoryName, info?.subCategoryName].filter(Boolean).join(" · ");

  const flashShadow = (key: "details" | "skills"): string =>
    savedFlash === key ? `0 0 0 3px rgba(34,197,94,0.45), ${shadow.sm}` : shadow.sm;

  // Exact 3-state copy from homedot-mobile-app's ProfessionalProfileScreen.js.
  const isFeatured = info?.featured === true;
  const isPending = info?.verified === false;
  const status = isFeatured
    ? { label: "Featured Professional", color: colors.goldDeep, bg: "rgba(245,166,35,0.14)", icon: "star" as const, filled: true, text: "A featured professional is a standout expert highlighted for their exceptional skills, achievements, or contributions." }
    : isPending
      ? { label: "Verification Pending", color: colors.goldDeep, bg: "rgba(245,166,35,0.14)", icon: "clock" as const, filled: false, text: "Your verification is currently being processed by the HomeDot team." }
      : { label: "Verified Professional", color: "#059669", bg: "#F0FDF4", icon: "verified" as const, filled: true, text: "A verified professional whose credentials have been confirmed, ensuring they meet the standards of expertise and reliability." };

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      {/* No SiteNav/SiteFooter — same self-contained professional area as
          ProfessionalDashboardScreen (see its own comment on this). */}
      <LoginModal ref={loginModalRef} hideTrigger />

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false ? (
          <EmptyState
            icon="hardhat"
            title="Sign in to see your professional profile"
            subtitle="Your category, skills and business details show up here once you're signed in."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
                Log in
              </Button>
            }
          />
        ) : loading ? (
          <ProDashboardSkeleton />
        ) : !home ? (
          <EmptyState
            icon="hardhat"
            title="No professional profile found"
            subtitle="Become a professional from your profile page to unlock this."
            action={
              <Button
                variant="primary"
                size="lg"
                icon={<Icon name="hardhat" size={18} />}
                onClick={() => {
                  setActiveRole("user");
                  router.push("/profile");
                }}
              >
                Go to profile
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[264px_1fr]" style={{ gap: spacing.xl, alignItems: "start" }}>
            <ProDashboardSidebar onLogout={logout} loggingOut={loggingOut} />

            <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: spacing.xl }}>
              <Reveal
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: radius.lg,
                  padding: "clamp(24px, 3.4vw, 36px)",
                  background: `linear-gradient(120deg, ${colors.primary} 0%, #1c3155 60%, ${colors.price} 130%)`,
                  boxShadow: shadow.md,
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
                  <span>Dashboard</span>
                  <Icon name="arrow" size={13} />
                  <span style={{ color: colors.white }}>Profile</span>
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
                  Professional Profile
                </h1>
                <p style={{ position: "relative", color: "rgba(255,255,255,0.82)", fontSize: fontSize.base, marginTop: 6 }}>
                  How home owners see you across HomeDot.
                </p>
              </Reveal>

              <Reveal style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, boxShadow: shadow.sm, overflow: "hidden" }}>
                <div style={{ height: 96, background: colors.primary }} />
                {/* Only the avatar (absolutely positioned) overlaps the dark
                    cover above — the name/category text sits in normal flow
                    starting well below it (paddingTop: 56 on the relative
                    wrapper), so it's always on the card's white background.
                    A flexbox negative-margin-on-one-sibling approach was
                    tried here first but is fragile (cross-axis sizing with
                    negative margins varies by content height) — this is
                    unambiguous regardless of how tall the text block gets. */}
                <div style={{ padding: "0 clamp(20px, 3vw, 32px) 24px" }}>
                  <div style={{ position: "relative", paddingTop: 56 }}>
                    <span style={{ position: "absolute", top: -48, left: 0 }}>
                      <span
                        style={{
                          width: 96,
                          height: 96,
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: `4px solid ${colors.card}`,
                          background: colors.primarySoft,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        {home.profileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={home.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Icon name="user" size={38} color={colors.primary} />
                        )}
                      </span>
                      <button
                        aria-label="Change profile photo"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        style={{
                          position: "absolute",
                          right: -2,
                          bottom: -2,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: colors.card,
                          color: colors.primary,
                          border: `2px solid ${colors.primary}`,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Icon name="camera" size={14} />
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarSelected} style={{ display: "none" }} />
                    </span>

                    <div style={{ paddingLeft: 96 + spacing.lg, minHeight: 40 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <h2 style={{ fontSize: fontSize.lg, fontWeight: 700, color: colors.ink }}>{uploadingAvatar ? "Uploading…" : home.name}</h2>
                        {info?.verified && <Icon name="verified" size={17} filled color={colors.primary} />}
                      </div>
                      {title && <p style={{ fontSize: fontSize.sm, color: colors.muted, marginTop: 2 }}>{title}</p>}
                      {info?.rating != null && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: fontSize.xs, fontWeight: 700, color: colors.ink2, marginTop: 6 }}>
                          <Icon name="star" size={13} filled color={colors.gold} /> {info.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: `1px solid ${colors.line}`,
                    margin: "0 clamp(20px, 3vw, 32px)",
                    padding: "clamp(16px, 2.4vw, 22px) 0 clamp(20px, 2.8vw, 28px)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.lg,
                  }}
                >
                  <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: status.color,
                        background: status.bg,
                        padding: "5px 12px",
                        borderRadius: radius.full,
                      }}
                    >
                      <Icon name={status.icon} size={12} filled={status.filled} color={status.color} /> {status.label}
                    </span>
                    <p style={{ fontSize: fontSize.xs, color: colors.muted, marginTop: 8, lineHeight: 1.5, maxWidth: 460 }}>{status.text}</p>
                    {profile?.location && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: fontSize.xs, color: colors.ink2, marginTop: 8 }}>
                        <Icon name="location" size={13} color={colors.muted} /> {profile.location}
                      </span>
                    )}
                    {roleError && <p style={{ color: "#C0392B", fontSize: fontSize.xs, marginTop: 8 }}>{roleError}</p>}
                  </div>

                  <button
                    onClick={switchToUser}
                    disabled={switchingRole}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      height: 44,
                      padding: "0 20px",
                      borderRadius: radius.full,
                      background: colors.primarySoft,
                      color: colors.primary,
                      fontSize: fontSize.sm,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {switchingRole ? "Switching…" : home.userType && home.userType.length === 1 ? "Become a Home Owner" : "Switch to Home Owner"}
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              </Reveal>

              <Reveal
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.lg,
                  padding: "clamp(20px, 2.8vw, 28px)",
                  boxShadow: flashShadow("details"),
                  transition: "box-shadow 0.3s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
                  <h3 style={{ fontSize: fontSize.md, fontWeight: 700 }}>Basic details</h3>
                  {!editing ? (
                    <button onClick={startEdit} style={ghostBtnStyle}>
                      <Icon name="edit" size={14} /> Edit profile
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={cancelEdit} style={ghostBtnStyle}>
                        Cancel
                      </button>
                      <button onClick={saveEdit} disabled={saving} style={primaryBtnStyle}>
                        <Icon name="check" size={14} color="#fff" /> {saving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  )}
                </div>

                {saveError && <p style={{ color: "#C0392B", fontSize: fontSize.sm, marginBottom: spacing.md }}>{saveError}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: spacing.lg }}>
                  <Field label="Full name">
                    {editing ? <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} /> : <FieldValue>{home.name}</FieldValue>}
                  </Field>
                  <Field label="Professional type">
                    {editing ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        {PROFESSIONAL_TYPES.map((t) => {
                          const active = t.id === professionalType;
                          return (
                            <button
                              key={t.id}
                              onClick={() => setProfessionalType(t.id)}
                              style={{
                                flex: 1,
                                height: 44,
                                borderRadius: radius.md,
                                border: `1.5px solid ${active ? colors.primary : colors.line}`,
                                background: active ? colors.primarySoft : colors.bg,
                                color: active ? colors.primary : colors.ink2,
                                fontSize: fontSize.sm,
                                fontWeight: 600,
                              }}
                            >
                              {t.title}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <FieldValue>{info?.professionalType || "—"}</FieldValue>
                    )}
                  </Field>
                  <Field label="Phone">
                    <FieldValue muted>{profile?.mobile || "—"}</FieldValue>
                  </Field>
                  <Field label="Email">
                    <FieldValue muted>{profile?.email || "—"}</FieldValue>
                  </Field>
                  <Field label="Experience (years)">
                    {editing ? (
                      <input type="number" min={0} max={70} value={experience} onChange={(e) => setExperience(e.target.value)} style={inputStyle} />
                    ) : (
                      <FieldValue>{info?.experience != null ? `${info.experience} years` : "—"}</FieldValue>
                    )}
                  </Field>
                  <Field label="Rate per sq.ft">
                    {editing ? (
                      <input type="number" min={0} value={squareFeetRate} onChange={(e) => setSquareFeetRate(e.target.value)} style={inputStyle} />
                    ) : (
                      <FieldValue>{info?.squareFeetRate != null ? info.squareFeetRate : "—"}</FieldValue>
                    )}
                  </Field>
                  <Field label="Working area (sq km)">
                    {editing ? (
                      <input value={workingArea} onChange={(e) => setWorkingArea(e.target.value)} style={inputStyle} />
                    ) : (
                      <FieldValue>{info?.workingArea || "—"}</FieldValue>
                    )}
                  </Field>
                  <Field label="Category">
                    <FieldValue muted>{title || "—"}</FieldValue>
                  </Field>
                </div>

                <div style={{ marginTop: spacing.lg }}>
                  <Field label="Location">
                    {editing ? (
                      <LocationMapPicker value={location} onChange={setLocation} height={200} />
                    ) : (
                      <FieldValue>{profile?.location || "—"}</FieldValue>
                    )}
                  </Field>
                </div>
              </Reveal>

              <Reveal
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.lg,
                  padding: "clamp(20px, 2.8vw, 28px)",
                  boxShadow: flashShadow("details"),
                  transition: "box-shadow 0.3s ease",
                }}
              >
                <h3 style={{ fontSize: fontSize.md, fontWeight: 700, marginBottom: spacing.md }}>About</h3>
                {editing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Tell home owners about your experience and how you work…"
                    style={{ ...inputStyle, height: "auto", padding: 12, resize: "vertical" as const }}
                  />
                ) : (
                  <p style={{ fontSize: fontSize.sm, color: colors.ink2, lineHeight: 1.6 }}>{info?.description || "No description added yet."}</p>
                )}
              </Reveal>

              <Reveal
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.lg,
                  padding: "clamp(20px, 2.8vw, 28px)",
                  boxShadow: flashShadow("skills"),
                  transition: "box-shadow 0.3s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
                  <h3 style={{ fontSize: fontSize.md, fontWeight: 700 }}>Skills</h3>
                  <button onClick={() => setManagingSkills(true)} style={ghostBtnStyle}>
                    <Icon name="edit" size={14} /> Manage skills
                  </button>
                </div>
                {info?.skills && info.skills.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {info.skills.map((s) => (
                      <span
                        key={s.levelThreeId}
                        style={{ fontSize: fontSize.xs, fontWeight: 600, color: colors.primary, background: colors.primarySoft, padding: "6px 12px", borderRadius: radius.full }}
                      >
                        {s.levelThreeName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: fontSize.sm, color: colors.muted }}>No skills added yet.</p>
                )}
              </Reveal>
            </main>
          </div>
        )}
      </section>

      {managingSkills && info && (
        <ManageSkillsModal
          categoryId={info.professionalCategory || ""}
          subCategoryId={info.subCategory || ""}
          currentSkills={info.skills || []}
          loading={savingSkills}
          onClose={() => setManagingSkills(false)}
          onSubmit={saveSkills}
        />
      )}

      {toast && (
        <div
          className="pd-toast"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      {children}
    </div>
  );
}

function FieldValue({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: muted ? colors.muted : colors.ink }}>{children}</span>;
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: 44,
  border: `1.5px solid ${colors.line}`,
  background: colors.bg,
  borderRadius: radius.md,
  padding: "0 14px",
  fontSize: fontSize.sm,
  color: colors.ink,
  outline: "none",
};

const ghostBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 38,
  padding: "0 14px",
  borderRadius: radius.full,
  border: `1.5px solid ${colors.line}`,
  background: colors.bg,
  color: colors.ink2,
  fontSize: fontSize.xs,
  fontWeight: 600,
};

const primaryBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 38,
  padding: "0 16px",
  borderRadius: radius.full,
  background: colors.primary,
  color: "#fff",
  fontSize: fontSize.xs,
  fontWeight: 700,
};
