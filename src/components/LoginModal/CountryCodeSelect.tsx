"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { radius, spacing, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import { COUNTRIES } from "./shared";

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === "IN") ?? COUNTRIES[0];

/** Dial-code picker for the login/registration phone fields: current flag +
 * code as the trigger, a searchable dropdown (by country name, ISO code, or
 * dial code) listing every country from src/utils/CountryCode.ts. */
export default function CountryCodeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (dialCode: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const selected = COUNTRIES.find((c) => c.dial_code === value) ?? DEFAULT_COUNTRY;

  useEffect(() => {
    if (!open) return;
    const focusTimer = setTimeout(() => searchRef.current?.focus(), 0);
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.dial_code.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
      )
    : COUNTRIES;

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (!open) setQuery("");
          setOpen((o) => !o);
        }}
        disabled={disabled}
        aria-label="Select country code"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: "none",
          background: "none",
          fontSize: fontSize.md,
          fontWeight: 600,
          color: colors.ink,
          paddingRight: 10,
          borderRight: `1px solid ${colors.line}`,
          marginRight: 2,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }}>{selected.flag_emoji}</span>
        {selected.dial_code}
        {!disabled && <Icon name="chevronDown" size={14} color={colors.muted} />}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 20,
            width: 290,
            maxHeight: 320,
            display: "flex",
            flexDirection: "column",
            background: colors.white,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.md,
            boxShadow: shadow.lg,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: spacing.sm + 2, borderBottom: `1px solid ${colors.line}` }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm,
                height: 38,
                border: `1.5px solid ${colors.line}`,
                borderRadius: radius.sm,
                padding: "0 10px",
                background: colors.bg,
              }}
            >
              <Icon name="search" size={15} color={colors.muted} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country or code"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "none",
                  width: "100%",
                  fontSize: fontSize.sm + 0.5,
                  color: colors.ink,
                }}
              />
            </div>
          </div>

          <div style={{ overflowY: "auto" }}>
            {filtered.length === 0 && (
              <p style={{ padding: spacing.md, fontSize: fontSize.sm, color: colors.muted, textAlign: "center" }}>
                No countries found
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.dial_code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm + 2,
                  width: "100%",
                  padding: "9px 12px",
                  textAlign: "left",
                  background: c.code === selected.code ? colors.primarySoft : "transparent",
                }}
              >
                <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{c.flag_emoji}</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: fontSize.sm + 0.5,
                    color: colors.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.name}
                </span>
                <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.muted, flexShrink: 0 }}>
                  {c.dial_code}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
