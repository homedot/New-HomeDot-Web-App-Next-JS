"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import LocationMapPicker, { type LocationValue } from "@/components/LocationMapPicker";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import ProfileService from "@/services/ProfileService";
import { useProfileStore } from "@/store/useProfileStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getAuthToken } from "@/utils/authStorage";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

const fieldStyle: CSSProperties = {
  height: 46,
  border: `1.5px solid ${colors.line}`,
  borderRadius: radius.md,
  padding: "0 14px",
  fontSize: fontSize.base,
  color: colors.ink,
  outline: "none",
  width: "100%",
};

export default function ProfileScreen() {
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const profile = useProfileStore((s) => s.profile);
  const loaded = useProfileStore((s) => s.loaded);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(true);
      useProfileStore.getState().fetch();
    } else {
      setSignedIn(false);
    }
  }, []);

  // Populates the edit form from the current profile — called on demand
  // (entering/cancelling edit mode) rather than synced via effect, so an
  // in-progress edit isn't clobbered if the store profile changes elsewhere.
  const resetFormFromProfile = () => {
    setName(profile?.name || "");
    setLocation(
      profile?.location
        ? { address: profile.location, lat: profile.locationKey?.coordinates?.[0] ?? 0, lng: profile.locationKey?.coordinates?.[1] ?? 0 }
        : null,
    );
  };

  const startEdit = () => {
    resetFormFromProfile();
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError(null);
  };

  const saveEdit = async () => {
    if (!name.trim()) {
      setSaveError("Name can't be empty.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const res = await ProfileService.updateProfile({
      name: name.trim(),
      location: location?.address ?? "",
      latitude: location?.lat ?? 0,
      longitude: location?.lng ?? 0,
      google_address_string: location?.address ?? "",
    });
    setSaving(false);
    if (!res.success) {
      setSaveError(res.message || "Couldn't save your changes. Please try again.");
      return;
    }
    if (profile) {
      useProfileStore.getState().setProfile({
        ...profile,
        name: name.trim(),
        location: location?.address ?? profile.location,
      });
    }
    setEditing(false);
  };

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    const res = await ProfileService.updateProfileImage(file);
    setUploadingAvatar(false);
    if (res.success && res.data?.data?.profileImage && profile) {
      useProfileStore.getState().setProfile({ ...profile, profileImage: res.data.data.profileImage });
    } else if (res.success) {
      // Response didn't echo the new URL back — re-fetch to pick it up.
      useProfileStore.getState().clear();
      useProfileStore.getState().fetch();
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    await ProfileService.logout().catch(() => null);
    useAuthStore.getState().clearTokens();
    useProfileStore.getState().clear();
    router.push("/");
  };

  const showLoading = signedIn && !loaded;

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <LoginModal ref={loginModalRef} hideTrigger />

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {signedIn === false && (
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
              <Icon name="user" size={28} />
            </span>
            <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>Sign in to see your profile</h3>
            <p style={{ color: colors.muted, marginBottom: spacing.lg, maxWidth: 420, marginInline: "auto" }}>
              Your name, contact details and saved location live here once you&apos;re signed in.
            </p>
            <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
              Log in
            </Button>
          </div>
        )}

        {showLoading && (
          <div
            style={{
              minHeight: "40vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.md,
            }}
          >
            <span
              className="animate-glow-pulse"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: colors.primarySoft,
                color: colors.primary,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="user" size={26} />
            </span>
            <p style={{ color: colors.muted, fontSize: fontSize.base }}>Loading your profile…</p>
          </div>
        )}

        {signedIn && loaded && (
          <>
            {/* hero */}
            <Reveal
              style={{
                position: "relative",
                borderRadius: radius.lg,
                overflow: "hidden",
                padding: "clamp(28px, 5vw, 44px)",
                background: `linear-gradient(120deg, ${colors.primary} 0%, #1c3155 60%, ${colors.price} 130%)`,
                boxShadow: shadow.md,
                marginBottom: spacing.xl,
              }}
            >
              <span
                className="pd-map-glow"
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
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: spacing.lg, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "block",
                      width: 92,
                      height: 92,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "3px solid rgba(255,255,255,0.85)",
                      background: "rgba(255,255,255,0.14)",
                      boxShadow: shadow.md,
                    }}
                  >
                    {profile?.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: colors.white }}>
                        <Icon name="user" size={38} />
                      </span>
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
                      background: colors.white,
                      color: colors.primary,
                      border: `2px solid ${colors.primary}`,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="camera" size={15} />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onAvatarSelected}
                    style={{ display: "none" }}
                  />
                </div>
                <div style={{ color: colors.white }}>
                  <h1
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(22px, 3vw, 30px)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {uploadingAvatar ? "Uploading photo…" : profile?.name || "Your account"}
                  </h1>
                  {profile?.location && (
                    <p style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.82)", marginTop: 6, fontSize: fontSize.sm }}>
                      <Icon name="location" size={15} /> {profile.location}
                    </p>
                  )}
                </div>
                <button
                  onClick={logout}
                  disabled={loggingOut}
                  style={{
                    marginLeft: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: fontSize.sm,
                    fontWeight: 600,
                    color: colors.white,
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "10px 18px",
                    borderRadius: radius.full,
                  }}
                >
                  <Icon name="logout" size={16} /> {loggingOut ? "Logging out…" : "Log out"}
                </button>
              </div>
            </Reveal>

            {/* profile information card */}
            <Reveal
              style={{
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.lg,
                boxShadow: shadow.sm,
                padding: "clamp(20px, 3vw, 32px)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.lg }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xl, fontWeight: 600 }}>Profile information</h2>
                  <p style={{ color: colors.muted, fontSize: fontSize.sm, marginTop: 4 }}>Manage your personal details and location.</p>
                </div>
                {!editing && (
                  <Button variant="outline" size="sm" icon={<Icon name="edit" size={15} />} onClick={startEdit}>
                    Edit profile
                  </Button>
                )}
              </div>

              {!editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
                  <InfoRow icon="user" label="Name" value={profile?.name || "—"} />
                  <InfoRow icon="mail" label="Email" value={profile?.email || "—"} />
                  <InfoRow icon="phone" label="Contact" value={profile?.mobile || "—"} />
                  <InfoRow icon="location" label="Location" value={profile?.location || "—"} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: fontSize.xs, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Name
                    </span>
                    <input value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: fontSize.xs, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Location
                    </span>
                    <LocationMapPicker value={location} onChange={setLocation} height={200} />
                  </div>
                  {saveError && <p style={{ color: "#C0392B", fontSize: fontSize.sm }}>{saveError}</p>}
                  <div style={{ display: "flex", gap: spacing.sm }}>
                    <Button variant="primary" size="md" onClick={saveEdit} icon={saving ? undefined : <Icon name="check" size={16} />}>
                      {saving ? "Saving…" : "Save changes"}
                    </Button>
                    <Button variant="outline" size="md" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Reveal>
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: "user" | "mail" | "phone" | "location"; label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.md,
        paddingBottom: spacing.md,
        borderBottom: `1px solid ${colors.line}`,
        flexWrap: "wrap",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: fontSize.sm, color: colors.muted }}>
        <Icon name={icon} size={16} /> {label}
      </span>
      <span style={{ fontSize: fontSize.base, fontWeight: 600, color: colors.ink }}>{value}</span>
    </div>
  );
}
