"use client";

import { useRef, type CSSProperties } from "react";
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
    const token = getAuthToken();
    console.log("Stored auth token:", token);
    if (token) {
      router.push("/property/add");
    } else {
      loginModalRef.current?.open();
    }
  };

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
