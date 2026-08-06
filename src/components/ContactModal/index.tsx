"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  type CSSProperties,
} from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";

// Same support number/email as ProfileScreen's HelpPanel (mirrors
// homedot-mobile-app's HelpScreen).
const PHONE = "7012303017";
const EMAIL = "mail@homedotapp.com";

export interface ContactModalHandle {
  open: () => void;
}

/** Popup shown when a visitor clicks "Contact" in the nav — a quick way to
 * reach HomeDot by phone or email without leaving the page. */
const ContactModal = forwardRef<ContactModalHandle>(function ContactModal(
  _props,
  ref,
) {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }));

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: colors.overlay,
        backdropFilter: "blur(7px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflowY: "auto",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          background: colors.card,
          borderRadius: 24,
          boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
          padding: "34px 30px",
          textAlign: "center",
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(16,28,48,0.08)",
            color: colors.ink,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="close" size={20} color={colors.ink} />
        </button>

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
          <Icon name="chat" size={26} />
        </span>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: fontSize.xl,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Get in touch
        </h2>
        <p
          style={{
            color: colors.muted,
            fontSize: fontSize.base,
            lineHeight: 1.6,
            maxWidth: 320,
            margin: "0 auto",
          }}
        >
          Questions about a property or professional? We&apos;re happy to
          help.
        </p>

        <div
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: 14, marginTop: 26, marginBottom: 20 }}
        >
          <ContactTile
            icon="phone"
            label="Call us"
            value={`+91 ${PHONE.slice(0, 5)} ${PHONE.slice(5)}`}
            href={`tel:${PHONE}`}
          />
          <ContactTile
            icon="mail"
            label="Email us"
            value={EMAIL}
            href={`mailto:${EMAIL}`}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: colors.primarySoft,
            borderRadius: radius.md,
            padding: 14,
            textAlign: "left",
            boxShadow: shadow.sm,
          }}
        >
          <Icon name="clock" size={16} color={colors.primary} />
          <p
            style={{
              fontSize: fontSize.sm - 0.5,
              color: colors.ink2,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Our support team typically responds within 24 hours on business
            days.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ContactModal;

function ContactTile({
  icon,
  label,
  value,
  href,
}: {
  icon: "phone" | "mail";
  label: string;
  value: string;
  href: string;
}) {
  const style: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    padding: "20px 12px",
    color: "inherit",
    textDecoration: "none",
    minWidth: 0,
  };
  return (
    <a href={href} style={style}>
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: colors.primarySoft,
          color: colors.primary,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name={icon} size={20} />
      </span>
      <span
        style={{ fontSize: fontSize.sm, fontWeight: 700, color: colors.ink }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: fontSize.xs,
          color: colors.muted,
          fontWeight: 500,
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </a>
  );
}
