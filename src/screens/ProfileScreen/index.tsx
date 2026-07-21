"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import StoreButtons from "@/components/StoreButtons";
import LocationMapPicker, { type LocationValue } from "@/components/LocationMapPicker";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import ContactUpdateModal from "./ContactUpdateModal";
import BecomeProfessionalModal from "./BecomeProfessionalModal";
import InviteFriendPanel from "./InviteFriendPanel";
import HelpPanel from "./HelpPanel";
import ProfileService, { resolveLatLng } from "@/services/ProfileService";
import SwitchProfessionalService from "@/services/SwitchProfessionalService";
import { useProfileStore } from "@/store/useProfileStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getAuthToken, getActiveRole, setActiveRole, type AccountRole } from "@/utils/authStorage";
import { loadGoogleMapsScript } from "@/utils/loadGoogleMapsScript";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

type MainTab = "profile" | "invite" | "help";

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

  const [tab, setTab] = useState<MainTab>("profile");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [contactModal, setContactModal] = useState<"phone" | "email" | null>(null);
  const [showBecomeProfessional, setShowBecomeProfessional] = useState(false);
  const [activeRole, setActiveRoleState] = useState<AccountRole>("user");
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    if (getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, a client-only system; see LoginModal's identical pattern
      setSignedIn(true);
      setActiveRoleState(getActiveRole());
      useProfileStore.getState().fetch();
    } else {
      setSignedIn(false);
    }
  }, []);

  const hasProfessionalRole = (profile?.userType?.length ?? 0) >= 2;

  // Toggles the active role for an account that already has both — mirrors
  // homedot-mobile-app's ProfileScreen switcButton (userType.length === 2
  // branch), which calls this same endpoint with no form.
  const switchRole = async () => {
    setSwitchingRole(true);
    setRoleError(null);
    const res = await SwitchProfessionalService.switchRole();
    setSwitchingRole(false);
    if (!res.success || res.data?.status === false) {
      setRoleError(res.data?.message || res.message || "Couldn't switch modes. Please try again.");
      return;
    }
    const pair = res.data?.data?.[0];
    if (pair) useAuthStore.getState().setTokens({ token: pair.token, refreshToken: pair.reToken });
    const next: AccountRole = activeRole === "professional" ? "user" : "professional";
    setActiveRole(next);
    setActiveRoleState(next);
    if (next === "professional") router.push("/professional/dashboard");
  };

  // Populates the edit form from the current profile — called on demand
  // (entering/cancelling edit mode) rather than synced via effect, so an
  // in-progress edit isn't clobbered if the store profile changes elsewhere.
  const resetFormFromProfile = () => {
    setName(profile?.name || "");
    setLocation(
      profile?.location
        ? { address: profile.location, ...resolveLatLng(profile.locationKey?.coordinates ?? [0, 0]) }
        : null,
    );
  };

  const goToTab = (t: MainTab) => {
    setEditing(false);
    setTab(t);
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
    setActiveRoleState("user");
    router.push("/");
  };

  // [0, 0] means the location was never actually geocoded (a placeholder,
  // not a real spot on Earth) — showing a map centered there would just be
  // a confusing patch of Atlantic ocean, so skip the map section entirely.
  const mapLatLng = profile?.locationKey?.coordinates ? resolveLatLng(profile.locationKey.coordinates) : null;
  const hasRealMapLocation = !!mapLatLng && (mapLatLng.lat !== 0 || mapLatLng.lng !== 0);

  const showLoading = signedIn && !loaded;

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <LoginModal ref={loginModalRef} hideTrigger />
      {contactModal && (
        <ContactUpdateModal
          mode={contactModal}
          currentCountryCode={profile?.countryCode}
          onClose={() => setContactModal(null)}
          onSuccess={(value, cc) => {
            if (profile) {
              useProfileStore.getState().setProfile(
                contactModal === "phone" ? { ...profile, mobile: value, countryCode: cc } : { ...profile, email: value },
              );
            }
            setContactModal(null);
          }}
        />
      )}
      {showBecomeProfessional && (
        <BecomeProfessionalModal
          onClose={() => setShowBecomeProfessional(false)}
          onSuccess={(tokens) => {
            if (tokens) useAuthStore.getState().setTokens({ token: tokens.token, refreshToken: tokens.reToken });
            setActiveRole("professional");
            setShowBecomeProfessional(false);
            useProfileStore.getState().clear();
            router.push("/professional/dashboard");
          }}
        />
      )}

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
          <div className="grid grid-cols-1 xl:grid-cols-[264px_1fr_280px]" style={{ gap: spacing.xl, alignItems: "start" }}>
            {/* sidebar */}
            <Reveal
              className="relative xl:sticky xl:top-24"
              style={{
                overflow: "hidden",
                background: `linear-gradient(165deg, ${colors.primary} 0%, ${colors.primaryDeep} 100%)`,
                borderRadius: radius.lg,
                padding: "24px 20px",
                boxShadow: shadow.md,
                display: "flex",
                flexDirection: "column",
                gap: spacing.lg,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: -50,
                  top: -60,
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: colors.accent,
                  filter: "blur(60px)",
                  opacity: 0.3,
                }}
              />
              <button
                onClick={() => router.push("/")}
                aria-label="Back home"
                style={{
                  position: "relative",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="arrowLeft" size={17} />
              </button>

              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 4 }}>
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <span
                    style={{
                      display: "block",
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "3px solid rgba(255,255,255,0.9)",
                      background: "rgba(255,255,255,0.14)",
                    }}
                  >
                    {profile?.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: colors.white }}>
                        <Icon name="user" size={40} />
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      inset: -4,
                      borderRadius: "50%",
                      border: "1.5px solid rgba(255,255,255,0.25)",
                      pointerEvents: "none",
                    }}
                  />
                  <button
                    aria-label="Change profile photo"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: colors.white,
                      color: colors.primary,
                      border: `2px solid ${colors.primary}`,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="camera" size={14} />
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarSelected} style={{ display: "none" }} />
                </div>
                <h3 style={{ color: colors.white, fontSize: fontSize.lg, fontWeight: 700 }}>
                  {uploadingAvatar ? "Uploading…" : profile?.name || "Your account"}
                </h3>
                {profile?.location && (
                  <span style={{ fontSize: fontSize.xs, color: "rgba(255,255,255,0.65)" }}>{profile.location}</span>
                )}
              </div>

              <div
                style={{
                  position: "relative",
                  borderTop: "1px solid rgba(255,255,255,0.14)",
                  paddingTop: spacing.md,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <SidebarNavItem icon="user" label="Profile" active={tab === "profile"} onClick={() => goToTab("profile")} />
                <SidebarNavItem icon="briefcase" label="My Project" active={false} onClick={() => router.push("/projects")} />
                <SidebarNavItem icon="house" label="My Property" active={false} onClick={() => router.push("/property/my")} />
                <SidebarNavItem icon="mail" label="Enquiries" active={false} onClick={() => router.push("/enquiries")} />
              </div>
            </Reveal>

            {/* profile information card */}
            <Reveal
              style={{
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.lg,
                boxShadow: shadow.sm,
                padding: "clamp(20px, 3vw, 30px)",
              }}
            >
              {tab === "profile" ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: spacing.md,
                      paddingBottom: spacing.lg,
                      marginBottom: spacing.lg,
                      borderBottom: `1px solid ${colors.line}`,
                    }}
                  >
                    <div>
                      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(21px, 2.4vw, 26px)", fontWeight: 600 }}>
                        Profile Information
                      </h1>
                      <p style={{ color: colors.muted, fontSize: fontSize.sm, marginTop: 6 }}>Manage your personal details and address.</p>
                    </div>
                    {!editing && (
                      <button
                        onClick={startEdit}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          fontSize: fontSize.sm - 0.5,
                          fontWeight: 600,
                          color: colors.primary,
                          background: colors.primarySoft,
                          padding: "10px 16px",
                          borderRadius: radius.full,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Icon name="edit" size={15} /> Edit profile
                      </button>
                    )}
                  </div>

                  {!editing ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: spacing.md }}>
                        <InfoField icon="user" label="Name" value={profile?.name || "—"} />
                        <InfoField icon="mail" label="Email" value={profile?.email || "—"} onChangeClick={() => setContactModal("email")} />
                        <InfoField icon="phone" label="Contact" value={profile?.mobile || "—"} onChangeClick={() => setContactModal("phone")} />
                        <InfoField icon="location" label="Location" value={profile?.location || "—"} />
                      </div>
                      {profile?.location && hasRealMapLocation && mapLatLng && (
                        <div style={{ marginTop: spacing.lg, display: "flex", flexDirection: "column", gap: spacing.sm }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: fontSize.sm, fontWeight: 600, color: colors.ink2 }}>
                            <Icon name="location" size={16} /> Location on map
                          </span>
                          <LocationMapView {...mapLatLng} address={profile.location} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
                      {/* Email/phone go through their own OTP-verified update flow
                          (see ContactUpdateModal), not the name/location save below —
                          shown here too so they're not hidden while editing. */}
                      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: spacing.md }}>
                        <InfoField icon="mail" label="Email" value={profile?.email || "—"} onChangeClick={() => setContactModal("email")} />
                        <InfoField icon="phone" label="Contact" value={profile?.mobile || "—"} onChangeClick={() => setContactModal("phone")} />
                      </div>
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
                </>
              ) : tab === "invite" ? (
                <InviteFriendPanel />
              ) : (
                <HelpPanel />
              )}
            </Reveal>

            {/* quick links rail */}
            <Reveal className="relative xl:sticky xl:top-24" style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.lg,
                  boxShadow: shadow.sm,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <RailItem icon="heart" label="Favorites" active={false} onClick={() => router.push("/favorites")} />
                <RailItem icon="user" label="Invite a Friend" active={tab === "invite"} onClick={() => goToTab("invite")} />
                <RailItem icon="shield" label="Help" active={tab === "help"} onClick={() => goToTab("help")} />
                <RailItem
                  icon="logout"
                  label={loggingOut ? "Logging out…" : "Log out"}
                  danger
                  active={false}
                  onClick={logout}
                  disabled={loggingOut}
                />
              </div>

              {hasProfessionalRole ? (
                <div
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.line}`,
                    borderRadius: radius.lg,
                    boxShadow: shadow.sm,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background: colors.primarySoft,
                        color: colors.primary,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="hardhat" size={16} />
                    </span>
                    <div>
                      <b style={{ fontSize: fontSize.sm, display: "block" }}>
                        {activeRole === "professional" ? "Professional mode" : "User mode"}
                      </b>
                      <span style={{ fontSize: fontSize.xs, color: colors.muted }}>You have both roles on this account.</span>
                    </div>
                  </div>
                  {roleError && <p style={{ color: "#C0392B", fontSize: fontSize.xs, margin: 0 }}>{roleError}</p>}
                  {activeRole === "professional" && (
                    <button
                      onClick={() => router.push("/professional/dashboard")}
                      style={{
                        height: 40,
                        borderRadius: radius.md,
                        background: colors.primary,
                        color: colors.white,
                        fontSize: fontSize.xs,
                        fontWeight: 700,
                      }}
                    >
                      Go to Dashboard
                    </button>
                  )}
                  <button
                    onClick={switchRole}
                    disabled={switchingRole}
                    style={{
                      height: 40,
                      borderRadius: radius.md,
                      background: colors.primarySoft,
                      color: colors.primary,
                      fontSize: fontSize.xs,
                      fontWeight: 700,
                    }}
                  >
                    {switchingRole ? "Switching…" : activeRole === "professional" ? "Switch to User" : "Switch to Professional"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowBecomeProfessional(true)}
                  style={{
                    background: `linear-gradient(150deg, ${colors.primaryDeep}, ${colors.primary})`,
                    borderRadius: radius.lg,
                    padding: 20,
                    color: colors.white,
                    textAlign: "center",
                    boxShadow: shadow.sm,
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.14)",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <Icon name="hardhat" size={18} />
                  </span>
                  <b style={{ fontSize: fontSize.sm + 1, display: "block", marginBottom: 5 }}>Become a Professional</b>
                  <p style={{ fontSize: fontSize.xs, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>
                    List your trade and start getting enquiries.
                  </p>
                </button>
              )}

              <div
                style={{
                  background: `linear-gradient(150deg, ${colors.primaryDeep}, ${colors.primary})`,
                  borderRadius: radius.lg,
                  padding: 20,
                  color: colors.white,
                  textAlign: "center",
                  boxShadow: shadow.sm,
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.14)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Icon name="sparkle" size={18} />
                </span>
                <b style={{ fontSize: fontSize.sm + 1, display: "block", marginBottom: 5 }}>Get the HomeDot app</b>
                <p style={{ fontSize: fontSize.xs, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, marginBottom: 14 }}>
                  Track projects &amp; chat on the go.
                </p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <StoreButtons size="sm" />
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function RailItem({
  icon,
  label,
  onClick,
  danger,
  active,
  disabled,
}: {
  icon: "heart" | "logout" | "user" | "shield";
  label: string;
  onClick?: () => void;
  danger?: boolean;
  active: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="pr-railitem"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 12px",
        borderRadius: 11,
        textAlign: "left",
        background: active ? colors.primarySoft : undefined,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: danger ? "rgba(229,72,77,0.1)" : active ? colors.card : colors.bg,
          color: danger ? "#E5484D" : active ? colors.primary : colors.ink2,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={17} />
      </span>
      <span style={{ flex: 1, fontSize: fontSize.sm, fontWeight: 500, color: danger ? "#E5484D" : active ? colors.primary : colors.ink }}>
        {label}
      </span>
      <Icon name="chevronDown" size={14} className="pr-railchev" color={colors.muted} />
    </button>
  );
}

function SidebarNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={active ? undefined : "pr-navitem"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 14px",
        borderRadius: 12,
        background: active ? colors.white : "transparent",
        color: active ? colors.primary : "rgba(255,255,255,0.82)",
        fontSize: fontSize.sm,
        fontWeight: active ? 600 : 500,
        textAlign: "left",
      }}
    >
      <Icon name={icon} size={18} />
      <span style={{ flex: 1 }}>{label}</span>
      {active && <Icon name="arrow" size={14} />}
    </button>
  );
}

function LocationMapView({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript()
      .then((google) => {
        if (cancelled || !mapDivRef.current) return;
        const map = new google.maps.Map(mapDivRef.current, {
          center: { lat, lng },
          zoom: 14,
          disableDefaultUI: true,
          gestureHandling: "none",
          keyboardShortcuts: false,
        });
        new google.maps.Marker({ position: { lat, lng }, map });
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <div style={{ position: "relative", borderRadius: radius.md, overflow: "hidden", border: `1px solid ${colors.line}`, height: 220 }}>
      <div ref={mapDivRef} style={{ width: "100%", height: "100%", background: colors.bg }} />
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: colors.card,
          padding: "11px 15px",
          borderRadius: 11,
          boxShadow: shadow.md,
          fontSize: fontSize.sm - 0.5,
          fontWeight: 500,
          color: colors.ink2,
        }}
      >
        <Icon name="location" size={15} color={colors.primary} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{address}</span>
      </div>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
  onChangeClick,
}: {
  icon: "user" | "mail" | "phone" | "location";
  label: string;
  value: string;
  onChangeClick?: () => void;
}) {
  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.md,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: fontSize.xs, fontWeight: 600, color: colors.muted }}>
          <Icon name={icon} size={15} /> {label}
        </span>
        {onChangeClick && (
          <button onClick={onChangeClick} style={{ fontSize: fontSize.xs, fontWeight: 700, color: colors.primary }}>
            Change
          </button>
        )}
      </div>
      <span style={{ fontSize: fontSize.md, fontWeight: 600, color: colors.ink, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}
