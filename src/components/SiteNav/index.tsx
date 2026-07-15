"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, fontSize, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import Brand from "@/components/Brand";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import NavShell from "@/components/NavShell";
import { getAuthToken } from "@/utils/authStorage";

// Only nudge once per browser session — SiteNav is mounted fresh on every
// top-level page (it's not hoisted into a shared layout), so without this
// flag a guest who navigates between pages within their first 5 seconds on
// each would get the popup again and again instead of just once.
const GUEST_PROMPT_SHOWN_KEY = "hd_guest_login_prompt_shown";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

const LINKS: { label: string; href?: string }[] = [
  { label: "Home", href: "/" },
  { label: "Professionals" },
  { label: "Blogs" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Contact" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);

  const onAddProperty = () => {
    if (getAuthToken()) {
      router.push("/property/add");
    } else {
      loginModalRef.current?.open();
    }
  };

  const onFavorites = () => {
    if (getAuthToken()) {
      router.push("/favorites");
    } else {
      loginModalRef.current?.open();
    }
  };

  const favoritesActive = pathname === "/favorites";

  // Nudges signed-out visitors to log in after they've been on the site for
  // 5 seconds, once per session. Re-checks auth right before opening (not
  // just at effect-setup time) in case they logged in during that window.
  useEffect(() => {
    if (getAuthToken()) return;
    if (sessionStorage.getItem(GUEST_PROMPT_SHOWN_KEY)) return;

    const timer = setTimeout(() => {
      sessionStorage.setItem(GUEST_PROMPT_SHOWN_KEY, "1");
      if (!getAuthToken()) {
        loginModalRef.current?.open();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <NavShell className="nav-shell">
      <div
        className="nav-inner"
        style={{
          ...wrap,
          display: "flex",
          alignItems: "center",
          gap: spacing.xxl,
        }}
      >
        <Link href="/">
          <Brand />
        </Link>
        <nav className="hidden md:flex" style={{ gap: 2, marginRight: "auto" }}>
          {LINKS.map((l) => {
            const active = !!l.href && pathname === l.href;
            const style: CSSProperties = {
              fontSize: fontSize.sm + 0.5,
              fontWeight: active ? 700 : 500,
              color: active ? colors.primary : colors.ink2,
              padding: "9px 14px",
              borderRadius: 10,
              cursor: l.href ? "pointer" : "default",
              display: "inline-block",
            };
            return l.href ? (
              <Link key={l.label} href={l.href} style={style}>
                {l.label}
              </Link>
            ) : (
              <span key={l.label} style={style}>
                {l.label}
              </span>
            );
          })}
        </nav>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: spacing.sm + 1,
          }}
        >
          <button
            onClick={onFavorites}
            aria-label="Favorites"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: `1px solid ${favoritesActive ? colors.primary : colors.line}`,
              background: favoritesActive ? colors.primarySoft : colors.card,
              color: favoritesActive ? colors.primary : colors.ink2,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="heart" size={17} filled={favoritesActive} />
          </button>
          <span className="hidden sm:inline-flex">
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="house" size={16} />}
              onClick={onAddProperty}
            >
              Add Property
            </Button>
          </span>
          <LoginModal ref={loginModalRef} />
        </div>
      </div>
    </NavShell>
  );
}
