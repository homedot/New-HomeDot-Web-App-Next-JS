"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { colors } from "@/constants/colors";
import { spacing, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import Brand from "@/components/Brand";
import LoginModal, { type LoginModalHandle } from "@/components/LoginModal";
import ContactModal, {
  type ContactModalHandle,
} from "@/components/ContactModal";
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
  { label: "Professionals", href: "/professionals" },
  { label: "Blogs", href: "/blog" },
  { label: "Reality", href: "/marketplace" },
  { label: "Contact" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const loginModalRef = useRef<LoginModalHandle>(null);
  const contactModalRef = useRef<ContactModalHandle>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape-to-close, matching the modals elsewhere in the header.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

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

  // Clicking the logo or "Home" link while already on the landing page
  // doesn't trigger a Next.js navigation (same route), so it would
  // otherwise do nothing. Scroll back to the top instead.
  const onHomeClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
        <Link
          href="/"
          className="nav-brand"
          onClick={(e) => {
            setMenuOpen(false);
            onHomeClick(e);
          }}
        >
          <Brand />
        </Link>
        <nav className="hidden md:flex" style={{ gap: 2, marginRight: "auto" }}>
          {LINKS.map((l) => {
            const active = !!l.href && pathname === l.href;
            const style = {
              "--nav-color": active ? colors.primary : colors.ink2,
            } as CSSProperties;
            const className = `nav-link${active ? " nav-link-active" : ""}`;
            if (l.href) {
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className={className}
                  style={style}
                  onClick={l.href === "/" ? onHomeClick : undefined}
                >
                  {l.label}
                </Link>
              );
            }
            return (
              <button
                key={l.label}
                onClick={() => contactModalRef.current?.open()}
                className={className}
                style={{
                  font: "inherit",
                  ...style,
                  background: "none",
                  border: "none",
                }}
              >
                {l.label}
              </button>
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
          <button
            className="nav-burger flex md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>
      <div
        className={`nav-mobile-menu${menuOpen ? " nav-mobile-menu-open" : ""}`}
      >
        <nav className="nav-mobile-links">
          {LINKS.map((l, i) => {
            const active = !!l.href && pathname === l.href;
            const style = {
              "--nav-color": active ? colors.primary : colors.ink2,
              "--nav-delay": `${i * 30}ms`,
            } as CSSProperties;
            const className = `nav-mobile-link${active ? " nav-link-active" : ""}`;
            if (l.href) {
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className={className}
                  style={style}
                  onClick={(e) => {
                    setMenuOpen(false);
                    if (l.href === "/") onHomeClick(e);
                  }}
                >
                  {l.label}
                </Link>
              );
            }
            return (
              <button
                key={l.label}
                onClick={() => {
                  setMenuOpen(false);
                  contactModalRef.current?.open();
                }}
                className={className}
                style={style}
              >
                {l.label}
              </button>
            );
          })}
        </nav>
      </div>
      <ContactModal ref={contactModalRef} />
    </NavShell>
  );
}
