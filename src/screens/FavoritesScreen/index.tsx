"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import PropertyCard from "@/components/PropertyCard";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollProgress from "@/components/ScrollProgress";
import Cursor from "@/components/Cursor";
import Reveal from "@/components/Reveal";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import MarketplaceScreenService, {
  toMarketplaceProperty,
} from "@/services/MarketplaceScreenService";
import { getAuthToken } from "@/utils/authStorage";
import type { MarketplaceProperty } from "@/screens/MarketplaceScreen/data";

const wrap: CSSProperties = { maxWidth, margin: "0 auto", padding: `0 ${spacing.xl}px` };

type LoadState = "signed-out" | "loading" | "ready" | "error";

// Only the property tab is wired up for now — homedot-mobile-app also has
// favorite blogs, portfolio photos and professionals (each their own
// endpoint), added one at a time. This screen is scoped to properties until
// those get their turn.
export default function FavoritesScreen() {
  const router = useRouter();
  // Always starts at "loading" — getAuthToken() reads localStorage, which
  // doesn't exist during SSR, so seeding this from it directly would render
  // "signed-out" on the server but "loading" (or "ready") on the client and
  // trigger a hydration mismatch. This effect corrects it after mount instead,
  // which is a real client-only-system read (not a value derivable from
  // props/state during render), hence the lint suppression below.
  const [state, setState] = useState<LoadState>("loading");
  const [favorites, setFavorites] = useState<MarketplaceProperty[]>([]);
  const [removing, setRemoving] = useState<string[]>([]);
  const loginModalRef = useRef<LoginModalHandle>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above the state declaration
      setState("signed-out");
      return;
    }
    MarketplaceScreenService.getFavoriteProperties().then((res) => {
      if (res.success && res.data?.status) {
        // The favorites endpoint doesn't say which are Buy vs Rent listings
        // (no separate rent-side fetch exists, unlike create/toggle) — same
        // gap homedot-mobile-app has, so this defaults to "Buy" like it does.
        setFavorites((res.data.data ?? []).map((r) => toMarketplaceProperty(r, "Buy")));
        setState("ready");
      } else {
        setState("error");
      }
    });
  }, []);

  // Mirrors MarketplaceScreen's toggleSave: optimistic removal, revert on
  // failure. Every card on this screen is already favorited, so "save" here
  // only ever means "un-favorite and drop it from the list."
  const unfavorite = (id: string) => {
    const target = favorites.find((p) => p.id === id);
    if (!target || removing.includes(id)) return;
    setRemoving((r) => [...r, id]);
    MarketplaceScreenService.toggleFavoriteProperty(id, target.purpose).then((res) => {
      setRemoving((r) => r.filter((x) => x !== id));
      if (res.success && res.data?.status) {
        setFavorites((f) => f.filter((p) => p.id !== id));
      }
    });
  };

  return (
    <div style={{ background: colors.bg, color: colors.ink, position: "relative", zIndex: 0 }}>
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <LoginModal ref={loginModalRef} hideTrigger />

      <section style={{ ...wrap, paddingTop: spacing.xl, paddingBottom: spacing.huge }}>
        {/* header */}
        <Reveal
          style={{
            position: "relative",
            borderRadius: radius.lg,
            overflow: "hidden",
            padding: "clamp(28px, 5vw, 44px)",
            background: `linear-gradient(120deg, ${colors.primary} 0%, #1c3155 60%, ${colors.price} 130%)`,
            boxShadow: shadow.md,
            marginBottom: spacing.xxl,
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
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: spacing.md, color: colors.white }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: "rgba(255,255,255,0.75)" }}>
              <span>Home</span>
              <Icon name="arrow" size={13} />
              <span style={{ color: colors.white }}>Favorites</span>
            </div>
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
            Your favorite properties
          </h1>
          <p style={{ position: "relative", color: "rgba(255,255,255,0.82)", fontSize: fontSize.base, marginTop: 6 }}>
            {state === "ready"
              ? `${favorites.length} ${favorites.length === 1 ? "property" : "properties"} saved for later`
              : "Properties you save show up here for quick access."}
          </p>
        </Reveal>

        {state === "loading" && (
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
              <Icon name="heart" size={26} />
            </span>
            <p style={{ color: colors.muted, fontSize: fontSize.base }}>Loading your favorites…</p>
          </div>
        )}

        {state === "signed-out" && (
          <EmptyState
            icon="heart"
            title="Sign in to see your favorites"
            subtitle="Properties you save while signed in are stored to your account, so they're waiting for you next time."
            action={
              <Button variant="primary" size="lg" icon={<Icon name="check" size={18} />} onClick={() => loginModalRef.current?.open()}>
                Log in
              </Button>
            }
          />
        )}

        {state === "error" && (
          <EmptyState
            icon="close"
            title="Couldn't load your favorites"
            subtitle="Something went wrong on our end. Please try again in a moment."
          />
        )}

        {state === "ready" && favorites.length === 0 && (
          <EmptyState
            icon="heart"
            title="No favorite properties yet"
            subtitle="Tap the heart on any listing to save it here for quick access later."
            action={
              <Button
                variant="primary"
                size="lg"
                icon={<Icon name="search" size={18} />}
                onClick={() => router.push("/marketplace")}
              >
                Browse marketplace
              </Button>
            }
          />
        )}

        {state === "ready" && favorites.length > 0 && (
          <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: spacing.xl }}>
            {favorites.map((p) => (
              <div key={p.id} style={{ opacity: removing.includes(p.id) ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
                <PropertyCard
                  property={p}
                  saved
                  onSave={unfavorite}
                  onOpen={() => router.push(p.propertySlug ? `/marketplace?property=${p.propertySlug}` : "/marketplace")}
                />
              </div>
            ))}
          </Reveal>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: "heart" | "close";
  title: string;
  subtitle: string;
  action?: ReactNode;
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
