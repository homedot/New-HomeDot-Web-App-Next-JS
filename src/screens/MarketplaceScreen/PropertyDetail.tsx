"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";
import { agent, parsePrice, type MarketplaceProperty } from "./data";

const AMENITY_ICON: Record<string, IconName> = {
  "Covered Parking": "house",
  "24x7 Security": "shield",
  "Power Backup": "bolt",
  Gym: "hardhat",
  "Swimming Pool": "drop",
  Garden: "leaf",
  "Gated Community": "shield",
  Lift: "cube",
  "Clear Title": "check",
  "Road Frontage": "location",
  "Near Highway": "location",
};

// Villas / Flat & Apartment / House share the residential layout (bedrooms,
// bathrooms, furnishing…); Office Space and Plots each have their own field
// set from the API and get a distinct look — accent color, icon and key
// facts — so the page actually reads differently per listing type.
type PropertyKind = "residential" | "office" | "plot";

function getPropertyKind(category: string): PropertyKind {
  const c = category.toLowerCase();
  if (c.includes("plot") || c.includes("land")) return "plot";
  if (c.includes("office") || c.includes("commercial")) return "office";
  return "residential";
}

const KIND_STYLE: Record<PropertyKind, { icon: IconName; accent: string; soft: string }> = {
  residential: { icon: "house", accent: colors.primary, soft: colors.primarySoft },
  office: { icon: "office", accent: colors.price, soft: "rgba(14,124,138,0.12)" },
  plot: { icon: "plot", accent: "#1F8A5B", soft: "rgba(31,138,91,0.12)" },
};

const KIND_HIGHLIGHTS: Record<PropertyKind, { icon: IconName; label: string }[]> = {
  residential: [
    { icon: "shield", label: "RERA registered" },
    { icon: "verified", label: "HomeDot verified" },
    { icon: "location", label: "Prime location" },
    { icon: "sparkle", label: "Move-in ready" },
  ],
  office: [
    { icon: "verified", label: "HomeDot verified" },
    { icon: "office", label: "Business ready" },
    { icon: "location", label: "Prime location" },
    { icon: "shield", label: "Verified listing" },
  ],
  plot: [
    { icon: "verified", label: "HomeDot verified" },
    { icon: "shield", label: "Clear title" },
    { icon: "location", label: "Prime location" },
    { icon: "plot", label: "Ready to build" },
  ],
};

// Rough indicative EMI so a Buy listing feels transactable at a glance —
// 80% LTV, 8.5% p.a., 20-year term. Clearly marked as an estimate in the UI.
function estimateMonthlyEmi(price: number): number {
  const loan = price * 0.8;
  const monthlyRate = 0.085 / 12;
  const months = 240;
  const factor = Math.pow(1 + monthlyRate, months);
  return Math.round((loan * monthlyRate * factor) / (factor - 1));
}

const SECTION_SCROLL_OFFSET = 150;

export default function PropertyDetail({
  prop,
  similar,
  saved,
  onSave,
  onBack,
  onOpen,
}: {
  prop: MarketplaceProperty;
  similar: MarketplaceProperty[];
  saved: string[];
  onSave: (id: string) => void;
  onBack: () => void;
  onOpen: (p: MarketplaceProperty) => void;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  // Reset transient UI state (lightbox, form, scroll-spy…) whenever the
  // visitor jumps to a different listing — this component is reused across
  // navigations rather than remounted. Done during render (React's documented
  // "adjusting state when a prop changes" pattern) rather than in an effect,
  // since it's a pure derived reset with no external system involved.
  const [prevPropId, setPrevPropId] = useState(prop.id);
  if (prop.id !== prevPropId) {
    setPrevPropId(prop.id);
    setLightbox(null);
    setSent(false);
    setMobileIndex(0);
    setCopied(false);
    setActiveSection("overview");
  }

  const overviewRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const contactCardRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);

  const sectionRefs = {
    overview: overviewRef,
    details: detailsRef,
    amenities: amenitiesRef,
    location: locationRef,
  } as const;

  const isSaved = saved.includes(prop.id);
  const isRent = prop.purpose === "Rent";
  const priceVal = parsePrice(prop.price);
  const psf = prop.area > 0 ? Math.round(priceVal / prop.area).toLocaleString() : null;
  const emi = !isRent && priceVal > 0 ? estimateMonthlyEmi(priceVal) : null;

  const kind = getPropertyKind(prop.category);
  const kindStyle = KIND_STYLE[kind];
  const highlights = KIND_HIGHLIGHTS[kind];
  const verifiedHighlight = highlights.find((h) => h.label === "HomeDot verified");
  const otherHighlights = highlights.filter((h) => h.label !== "HomeDot verified");

  useEffect(() => {
    mobileGalleryRef.current?.scrollTo({ left: 0 });
  }, [prop.id]);

  useEffect(() => {
    const targets = Object.entries(sectionRefs)
      .map(([key, ref]) => ({ key, el: ref.current }))
      .filter((t): t is { key: string; el: HTMLDivElement } => !!t.el);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const match = targets.find((t) => t.el === topMost.target);
        if (match) setActiveSection(match.key);
      },
      { rootMargin: "-160px 0px -60% 0px", threshold: [0, 1] }
    );
    targets.forEach((t) => observer.observe(t.el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prop.id, prop.amenities.length]);

  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % prop.gallery.length));
      else if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + prop.gallery.length) % prop.gallery.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prop.gallery.length]);

  function scrollToSection(key: keyof typeof sectionRefs) {
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function focusContactForm() {
    contactCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => nameInputRef.current?.focus(), 450);
  }

  function handleShare() {
    if (typeof window === "undefined") return;
    const shareData = { title: prop.title, url: window.location.href };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(shareData.url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  function handleMobileGalleryScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  const navItems: { key: keyof typeof sectionRefs; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "details", label: "Details" },
    ...(prop.amenities.length > 0 ? [{ key: "amenities" as const, label: "Amenities" }] : []),
    { key: "location", label: "Location" },
  ];

  const keyFacts: { icon: IconName; label: string; value: string }[] =
    kind === "plot"
      ? [
          { icon: "plot", label: "Plot area", value: prop.plotArea ? `${prop.plotArea.toLocaleString()} sqft` : "—" },
          {
            icon: "ruler",
            label: "Dimensions",
            value: prop.length && prop.breadth ? `${prop.length} × ${prop.breadth} ft` : "—",
          },
          { icon: "compass", label: "Road width", value: prop.roadWidth ? `${prop.roadWidth} ft` : "—" },
          { icon: "sparkle", label: "Price / sqft", value: psf ? `₹${psf}` : "On request" },
        ]
      : kind === "office"
        ? [
            { icon: "office", label: "Built-up area", value: prop.area ? `${prop.area.toLocaleString()} sqft` : "—" },
            { icon: "cube", label: "Carpet area", value: prop.carpetArea ? `${prop.carpetArea.toLocaleString()} sqft` : "—" },
            { icon: "ruler", label: "Floors", value: prop.noOfFloors ? String(prop.noOfFloors) : "—" },
            { icon: "sparkle", label: "Price / sqft", value: psf ? `₹${psf}` : "On request" },
          ]
        : [
            { icon: "house", label: "Bedrooms", value: prop.beds > 0 ? `${prop.beds} BHK` : "—" },
            { icon: "drop", label: "Bathrooms", value: prop.baths > 0 ? String(prop.baths) : "—" },
            { icon: "cube", label: "Built-up area", value: prop.area ? `${prop.area.toLocaleString()} sqft` : "—" },
            { icon: "sparkle", label: "Price / sqft", value: psf ? `₹${psf}` : "On request" },
          ];

  const details: [string, string][] = [
    ["Property type", prop.category],
    ["Listing", isRent ? "For Rent" : "For Sale"],
  ];
  if (prop.beds > 0) details.push(["Bedrooms", `${prop.beds} BHK`]);
  if (prop.baths > 0) details.push(["Bathrooms", String(prop.baths)]);
  if (kind !== "plot" && prop.area > 0) details.push(["Built-up area", `${prop.area.toLocaleString()} sqft`]);
  if (prop.carpetArea) details.push(["Carpet area", `${prop.carpetArea.toLocaleString()} sqft`]);
  if (prop.plotArea) details.push(["Plot area", `${prop.plotArea.toLocaleString()} sqft`]);
  if (prop.length && prop.breadth) details.push(["Dimensions", `${prop.length} × ${prop.breadth} ft`]);
  if (prop.noOfFloors) details.push(["No. of floors", String(prop.noOfFloors)]);
  if (prop.roadWidth) details.push(["Road width", `${prop.roadWidth} ft`]);
  if (prop.maintenanceCharge) details.push(["Maintenance charge", `₹${prop.maintenanceCharge.toLocaleString("en-IN")} / month`]);
  if (prop.garage) details.push(["Garage", String(prop.garage)]);
  if (prop.balcony) details.push(["Balcony", String(prop.balcony)]);
  if (prop.furnished) details.push(["Furnishing", prop.furnished]);
  if (prop.listedBy) details.push(["Listed by", prop.listedBy.charAt(0).toUpperCase() + prop.listedBy.slice(1)]);

  const mapQuery = encodeURIComponent(`${prop.location}, ${prop.city}`);

  return (
    <section style={{ padding: `${spacing.xl}px ${spacing.xl}px ${spacing.huge}px` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* back + breadcrumb + actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.lg,
            marginBottom: spacing.lg,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing.lg, flexWrap: "wrap" }}>
            <button
              onClick={onBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: fontSize.sm,
                fontWeight: 600,
                color: colors.ink2,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                padding: "9px 15px",
                borderRadius: radius.full,
                cursor: "pointer",
              }}
            >
              <Icon name="arrowLeft" size={16} /> Back
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.sm, color: colors.muted }}>
              <button onClick={onBack} style={{ color: colors.muted, cursor: "pointer" }}>
                Marketplace
              </button>
              <Icon name="arrow" size={13} />
              <span style={{ color: colors.ink, fontWeight: 600 }}>{prop.category}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: spacing.sm }}>
            <div style={{ position: "relative" }}>
              <button
                onClick={handleShare}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontWeight: 600,
                  fontSize: fontSize.sm,
                  color: colors.ink2,
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  padding: "9px 15px",
                  borderRadius: radius.full,
                  cursor: "pointer",
                }}
              >
                <Icon name="share" size={16} /> Share
              </button>
              {copied && (
                <span
                  className="pd-toast"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: colors.primary,
                    color: colors.white,
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: radius.full,
                    whiteSpace: "nowrap",
                    boxShadow: shadow.sm,
                    zIndex: 3,
                  }}
                >
                  Link copied
                </span>
              )}
            </div>
            <button
              onClick={() => onSave(prop.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 600,
                fontSize: fontSize.sm,
                color: isSaved ? "#E5484D" : colors.ink2,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                padding: "9px 15px",
                borderRadius: radius.full,
                cursor: "pointer",
              }}
            >
              <span key={isSaved ? "saved" : "unsaved"} className={isSaved ? "pd-heart-pop" : undefined} style={{ display: "inline-flex" }}>
                <Icon name="heart" size={17} filled={isSaved} />
              </span>
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* gallery — desktop bento grid */}
        <Reveal
          className={`hidden lg:grid ${prop.gallery.length > 1 ? "lg:grid-cols-[1.55fr_1fr]" : "grid-cols-1"}`}
          style={{ gap: 10, height: "clamp(360px, 40vw, 480px)" }}
        >
          <button
            onClick={() => setLightbox(0)}
            className="card-hover"
            style={{ position: "relative", borderRadius: radius.lg, overflow: "hidden", cursor: "zoom-in", background: colors.primarySoft }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prop.gallery[0]}
              alt={prop.title}
              className="card-hover-img"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, transparent 55%, rgba(10,20,34,0.45) 100%)",
                pointerEvents: "none",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 14,
                bottom: 14,
                background: kindStyle.accent,
                color: colors.white,
                fontSize: fontSize.xs,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: radius.full,
              }}
            >
              {prop.status}
            </span>
            {prop.gallery.length > 1 && (
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  bottom: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(10,20,34,0.55)",
                  color: colors.white,
                  fontSize: fontSize.xs,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: radius.full,
                }}
              >
                <Icon name="grid" size={12} color={colors.white} /> View all {prop.gallery.length} photos
              </span>
            )}
          </button>
          {prop.gallery.length > 1 && (
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10 }}>
              {prop.gallery.slice(1, 4).map((g, i) => {
                const isLastVisible = i === 2 && prop.gallery.length > 4;
                return (
                  <button
                    key={i}
                    onClick={() => setLightbox(i + 1)}
                    className="card-hover"
                    style={{ position: "relative", borderRadius: radius.md, overflow: "hidden", cursor: "zoom-in", background: colors.primarySoft }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g}
                      alt={`View ${i + 2}`}
                      className="card-hover-img"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {isLastVisible && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(10,20,34,0.6)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          color: colors.white,
                          fontWeight: 700,
                          fontSize: fontSize.md,
                        }}
                      >
                        <Icon name="grid" size={18} color={colors.white} />
                        +{prop.gallery.length - 4} photos
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Reveal>

        {/* gallery — mobile swipe carousel */}
        <Reveal className="lg:hidden" style={{ position: "relative" }}>
          <div
            ref={mobileGalleryRef}
            onScroll={handleMobileGalleryScroll}
            className="pd-carousel flex overflow-x-auto"
            style={{ borderRadius: radius.lg, height: "clamp(240px, 66vw, 340px)", background: colors.primarySoft }}
          >
            {prop.gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setLightbox(i)}
                style={{ flex: "0 0 100%", position: "relative", cursor: "zoom-in" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g}
                  alt={`${prop.title} — view ${i + 1}`}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              </button>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: radius.lg,
              background: "linear-gradient(180deg, transparent 60%, rgba(10,20,34,0.4) 100%)",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 14,
              top: 14,
              background: kindStyle.accent,
              color: colors.white,
              fontSize: fontSize.xs,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: radius.full,
            }}
          >
            {prop.status}
          </span>
          {prop.gallery.length > 1 && (
            <span
              style={{
                position: "absolute",
                right: 14,
                top: 14,
                background: "rgba(10,20,34,0.55)",
                color: colors.white,
                fontSize: fontSize.xs,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: radius.full,
              }}
            >
              {mobileIndex + 1} / {prop.gallery.length}
            </span>
          )}
          {prop.gallery.length > 1 && (
            <div style={{ position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)", display: "flex", gap: 5 }}>
              {prop.gallery.map((_, i) => (
                <span key={i} className={`pd-dot ${i === mobileIndex ? "active" : ""}`} />
              ))}
            </div>
          )}
        </Reveal>

        {/* header: title + price — floats over the gallery on desktop */}
        <Reveal
          className="lg:-mt-7"
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: spacing.xxl,
            marginTop: spacing.lg,
            background: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: radius.lg,
            padding: `${spacing.lg}px ${spacing.xl}px`,
            boxShadow: shadow.md,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: fontSize.xs,
                  fontWeight: 600,
                  color: kindStyle.accent,
                  background: kindStyle.soft,
                  padding: "5px 12px",
                  borderRadius: 8,
                }}
              >
                <Icon name={kindStyle.icon} size={13} /> {prop.category}
              </span>
              {verifiedHighlight && (
                <span
                  className="pd-badge-pulse"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: fontSize.xs,
                    fontWeight: 700,
                    color: colors.white,
                    background: colors.accent,
                    padding: "5px 12px",
                    borderRadius: radius.full,
                  }}
                >
                  <Icon name="verified" size={13} filled color={colors.white} /> {verifiedHighlight.label}
                </span>
              )}
              {otherHighlights.slice(0, 1).map((h) => (
                <span
                  key={h.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    color: colors.primary,
                    background: colors.primarySoft,
                    padding: "5px 11px",
                    borderRadius: radius.full,
                  }}
                >
                  <Icon name={h.icon} size={13} /> {h.label}
                </span>
              ))}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(23px, 2.8vw, 34px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                marginBottom: spacing.sm,
              }}
            >
              {prop.title}
            </h1>
            <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: fontSize.base, color: colors.muted }}>
              <Icon name="location" size={16} /> {prop.location}, {prop.city}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 700, color: colors.price, lineHeight: 1 }}>
              {prop.price}
            </div>
            <div style={{ fontSize: fontSize.sm, color: colors.muted, marginTop: 5 }}>
              {prop.priceUnit ? `/ ${prop.priceUnit}` : "onwards*"}
            </div>
            {emi !== null && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 9,
                  fontSize: fontSize.xs,
                  fontWeight: 600,
                  color: colors.ink2,
                  background: colors.primarySoft,
                  padding: "5px 11px",
                  borderRadius: radius.full,
                }}
              >
                <Icon name="sparkle" size={12} color={colors.accent} /> EMI ≈ ₹{emi.toLocaleString("en-IN")}/mo*
              </div>
            )}
          </div>
        </Reveal>

        {/* key facts */}
        <Reveal stagger className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: spacing.md, margin: `${spacing.xl}px 0 4px` }}>
          {keyFacts.map((k) => (
            <div
              key={k.label}
              className="card-hover pd-key-fact"
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.md,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.md,
                padding: "16px 18px",
                boxShadow: shadow.sm,
              }}
            >
              <span
                className="pd-key-fact-icon"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: kindStyle.soft,
                  color: kindStyle.accent,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={k.icon} size={20} />
              </span>
              <div>
                <b style={{ display: "block", fontFamily: "var(--font-display)", fontSize: fontSize.md + 1 }}>{k.value}</b>
                <em style={{ fontStyle: "normal", fontSize: fontSize.xs, color: colors.muted }}>{k.label}</em>
              </div>
            </div>
          ))}
        </Reveal>

        {/* section sub-nav */}
        <div
          className="pd-subnav"
          style={{
            borderRadius: radius.full,
            border: `1px solid ${colors.line}`,
            boxShadow: shadow.sm,
            padding: 6,
            margin: `${spacing.lg}px 0`,
          }}
        >
          <div className="pd-subnav-row" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.key)}
                className="pd-pill"
                style={{
                  flexShrink: 0,
                  fontSize: fontSize.sm,
                  fontWeight: 600,
                  padding: "9px 18px",
                  borderRadius: radius.full,
                  background: activeSection === item.key ? colors.primary : "transparent",
                  color: activeSection === item.key ? colors.white : colors.ink2,
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px]" style={{ gap: spacing.xxl, marginTop: spacing.md, alignItems: "start" }}>
          {/* main column */}
          <div>
            <div ref={overviewRef} data-section="overview" style={{ scrollMarginTop: SECTION_SCROLL_OFFSET }}>
              <Reveal style={{ padding: `${spacing.xl}px 0`, borderBottom: `1px solid ${colors.line}` }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: spacing.sm, fontSize: fontSize.lg + 2, marginBottom: spacing.md }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: kindStyle.accent,
                      display: "inline-block",
                    }}
                  />
                  About this property
                </h2>
                <p style={{ color: colors.ink2, fontSize: fontSize.base, lineHeight: 1.7, marginBottom: spacing.lg }}>{prop.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm + 2 }}>
                  {highlights.map((h) => (
                    <div
                      key={h.label}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: spacing.sm,
                        fontSize: fontSize.sm + 0.5,
                        fontWeight: 600,
                        color: colors.ink2,
                        background: colors.card,
                        border: `1px solid ${colors.line}`,
                        borderRadius: radius.full,
                        padding: "9px 15px",
                      }}
                    >
                      <Icon name={h.icon} size={17} color={colors.accent} /> {h.label}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <div ref={detailsRef} data-section="details" style={{ scrollMarginTop: SECTION_SCROLL_OFFSET }}>
              <Reveal style={{ padding: `${spacing.xl}px 0`, borderBottom: `1px solid ${colors.line}` }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: spacing.sm, fontSize: fontSize.lg + 2, marginBottom: spacing.md }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: kindStyle.accent, display: "inline-block" }} />
                  Property details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ columnGap: spacing.xxl }}>
                  {details.map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: spacing.md,
                        padding: "13px 0",
                        borderBottom: `1px solid ${colors.line}`,
                        fontSize: fontSize.base,
                      }}
                    >
                      <span style={{ color: colors.muted }}>{k}</span>
                      <span style={{ color: colors.ink, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {prop.amenities.length > 0 && (
              <div ref={amenitiesRef} data-section="amenities" style={{ scrollMarginTop: SECTION_SCROLL_OFFSET }}>
                <Reveal style={{ padding: `${spacing.xl}px 0`, borderBottom: `1px solid ${colors.line}` }}>
                  <h2 style={{ display: "flex", alignItems: "center", gap: spacing.sm, fontSize: fontSize.lg + 2, marginBottom: spacing.md }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: kindStyle.accent, display: "inline-block" }} />
                    Amenities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: spacing.md }}>
                    {prop.amenities.map((a) => (
                      <span
                        key={a}
                        className="card-hover"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: spacing.md - 1,
                          fontSize: fontSize.base - 1,
                          color: colors.ink2,
                          background: colors.card,
                          border: `1px solid ${colors.line}`,
                          borderRadius: radius.md,
                          padding: "12px 14px",
                        }}
                      >
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: kindStyle.soft,
                            color: kindStyle.accent,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon name={AMENITY_ICON[a] ?? "check"} size={16} />
                        </span>
                        {a}
                      </span>
                    ))}
                  </div>
                </Reveal>
              </div>
            )}

            <div ref={locationRef} data-section="location" style={{ scrollMarginTop: SECTION_SCROLL_OFFSET }}>
              <Reveal style={{ padding: `${spacing.xl}px 0` }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: spacing.sm, fontSize: fontSize.lg + 2, marginBottom: spacing.md }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: kindStyle.accent, display: "inline-block" }} />
                  Location
                </h2>
                <p style={{ display: "flex", alignItems: "center", gap: 7, fontSize: fontSize.base, color: colors.ink2, marginBottom: spacing.lg }}>
                  <Icon name="location" size={17} color={kindStyle.accent} /> {prop.location}, {prop.city}
                </p>
                <div
                  style={{
                    position: "relative",
                    height: 200,
                    borderRadius: radius.lg,
                    overflow: "hidden",
                    border: `1px solid ${colors.line}`,
                    background:
                      "repeating-linear-gradient(0deg, rgba(16,28,48,0.045) 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, rgba(16,28,48,0.045) 0 1px, transparent 1px 34px), #EEF1F5",
                  }}
                >
                  <span
                    className="pd-map-glow"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 140,
                      height: 140,
                      marginLeft: -70,
                      marginTop: -70,
                      borderRadius: "50%",
                      background: kindStyle.accent,
                      filter: "blur(46px)",
                      opacity: 0.3,
                    }}
                  />
                  <div
                    className="pd-map-pin"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <span
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        background: kindStyle.accent,
                        color: colors.white,
                        display: "grid",
                        placeItems: "center",
                        boxShadow: shadow.md,
                      }}
                    >
                      <Icon name="location" size={22} color={colors.white} filled />
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: "absolute",
                      right: 14,
                      bottom: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: colors.card,
                      color: colors.ink,
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      padding: "8px 14px",
                      borderRadius: radius.full,
                      boxShadow: shadow.sm,
                    }}
                  >
                    <Icon name="compass" size={14} color={kindStyle.accent} /> Get directions
                  </a>
                </div>
              </Reveal>
            </div>
          </div>

          {/* sidebar */}
          <Reveal
            delay={100}
            style={{ display: "flex", flexDirection: "column", gap: spacing.lg, position: "sticky", top: 100 }}
          >
            <div
              ref={contactCardRef}
              style={{
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.lg,
                overflow: "hidden",
                boxShadow: shadow.md,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ height: 5, background: `linear-gradient(90deg, ${kindStyle.accent}, ${colors.accent})` }} />
              <div style={{ padding: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.md }}>
                <div style={{ display: "flex", alignItems: "center", gap: spacing.md, paddingBottom: spacing.md, borderBottom: `1px solid ${colors.line}` }}>
                  <span style={{ position: "relative", flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: `2px solid ${colors.primarySoft}` }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: -1,
                        bottom: -1,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#2AC46A",
                        border: `2px solid ${colors.card}`,
                      }}
                    />
                  </span>
                  <div>
                    <b style={{ display: "block", fontFamily: "var(--font-display)", fontSize: fontSize.md }}>{agent.name}</b>
                    <span style={{ fontSize: fontSize.xs, color: colors.muted }}>{agent.role}</span>
                    <div style={{ fontSize: fontSize.xs, color: colors.ink2, marginTop: 2, fontWeight: 600 }}>
                      <Icon name="star" size={13} filled color={colors.gold} /> {agent.rating} · {agent.deals} deals
                    </div>
                  </div>
                </div>

                {sent ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6, padding: "10px 0" }}>
                    <span
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: colors.primarySoft,
                        color: colors.primary,
                        display: "grid",
                        placeItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Icon name="check" size={24} />
                    </span>
                    <b style={{ fontSize: fontSize.base }}>Request sent!</b>
                    <span style={{ fontSize: fontSize.sm, color: colors.muted }}>The agent will call you shortly.</span>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: spacing.sm + 2 }}
                  >
                    <input
                      ref={nameInputRef}
                      required
                      placeholder="Your name"
                      style={{ border: `1.5px solid ${colors.line}`, borderRadius: radius.sm + 1, padding: "11px 13px", fontSize: fontSize.sm + 1, outline: "none" }}
                    />
                    <input
                      required
                      placeholder="Phone number"
                      style={{ border: `1.5px solid ${colors.line}`, borderRadius: radius.sm + 1, padding: "11px 13px", fontSize: fontSize.sm + 1, outline: "none" }}
                    />
                    <textarea
                      rows={2}
                      defaultValue={`I'm interested in "${prop.title.slice(0, 34)}…"`}
                      style={{ border: `1.5px solid ${colors.line}`, borderRadius: radius.sm + 1, padding: "11px 13px", fontSize: fontSize.sm + 1, outline: "none", resize: "vertical", fontFamily: "inherit" }}
                    />
                    <Button variant="primary" size="lg" full icon={<Icon name="check" size={18} />} type="submit">
                      Schedule a visit
                    </Button>
                  </form>
                )}

                <div style={{ display: "flex", gap: spacing.sm }}>
                  <span style={{ flex: 1 }}>
                    <Button variant="outline" size="md" full icon={<Icon name="phone" size={16} />}>
                      Call
                    </Button>
                  </span>
                  <span style={{ flex: 1 }}>
                    <Button variant="outline" size="md" full icon={<Icon name="chat" size={16} />}>
                      Chat
                    </Button>
                  </span>
                </div>
                <p style={{ display: "flex", alignItems: "center", gap: 7, fontSize: fontSize.xs, color: colors.muted }}>
                  <Icon name="shield" size={14} color={colors.primary} /> Shared only with this verified agent.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: spacing.md,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.lg,
                padding: spacing.lg,
                boxShadow: shadow.sm,
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: colors.primarySoft,
                  color: colors.primary,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="shield" size={18} />
              </span>
              <div>
                <b style={{ display: "block", fontSize: fontSize.sm + 1, marginBottom: 3 }}>The HomeDot promise</b>
                <span style={{ fontSize: fontSize.xs + 0.5, color: colors.muted, lineHeight: 1.5 }}>
                  Every listing &amp; agent is manually verified before it goes live.
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* similar properties */}
        {similar.length > 0 && (
          <div style={{ marginTop: spacing.huge - 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: spacing.xl, gap: spacing.lg }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xxl - 4, fontWeight: 600 }}>Similar properties</h2>
                <p style={{ color: colors.muted, fontSize: fontSize.base, marginTop: spacing.sm }}>
                  More {prop.category.toLowerCase()} options you may like.
                </p>
              </div>
            </div>
            <Reveal stagger className="grid grid-cols-1 md:grid-cols-3" style={{ gap: spacing.xl }}>
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} saved={saved.includes(p.id)} onSave={onSave} onOpen={() => onOpen(p)} />
              ))}
            </Reveal>
          </div>
        )}

        {/* spacer so the fixed mobile CTA bar never covers content */}
        <div className="lg:hidden" style={{ height: 84 }} />
      </div>

      {/* mobile sticky CTA bar */}
      <div
        className="flex lg:hidden pd-mobile-cta"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 55,
          background: colors.card,
          borderTop: `1px solid ${colors.line}`,
          boxShadow: "0 -8px 24px -12px rgba(16,28,48,0.18)",
          padding: "12px 16px",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: fontSize.lg, fontWeight: 700, color: colors.price, lineHeight: 1.1 }}>
            {prop.price}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colors.muted }}>{prop.priceUnit ? `/ ${prop.priceUnit}` : "onwards*"}</div>
        </div>
        <button
          onClick={() => onSave(prop.id)}
          aria-label={isSaved ? "Remove from saved" : "Save property"}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: `1.5px solid ${colors.line}`,
            display: "grid",
            placeItems: "center",
            color: isSaved ? "#E5484D" : colors.ink2,
            flexShrink: 0,
          }}
        >
          <Icon name="heart" size={19} filled={isSaved} />
        </button>
        <span style={{ flexShrink: 0 }}>
          <Button variant="primary" size="md" icon={<Icon name="check" size={16} />} onClick={focusContactForm}>
            {isRent ? "Enquire Now" : "Schedule Visit"}
          </Button>
        </span>
      </div>

      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          className="pd-lightbox-overlay"
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
            className="pd-lightbox-arrow"
            style={{
              position: "absolute",
              zIndex: 2,
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

          {prop.gallery.length > 1 && (
            <span
              style={{
                position: "absolute",
                zIndex: 2,
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
              {lightbox + 1} / {prop.gallery.length}
            </span>
          )}

          {prop.gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i - 1 + prop.gallery.length) % prop.gallery.length));
                }}
                aria-label="Previous photo"
                className="pd-lightbox-arrow"
                style={{
                  position: "absolute",
                  zIndex: 2,
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
                  setLightbox((i) => (i === null ? i : (i + 1) % prop.gallery.length));
                }}
                aria-label="Next photo"
                className="pd-lightbox-arrow"
                style={{
                  position: "absolute",
                  zIndex: 2,
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

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={lightbox}
            src={prop.gallery[lightbox]}
            alt="Property"
            onClick={(e) => e.stopPropagation()}
            className="pd-lightbox-img"
            style={{ position: "relative", zIndex: 1, maxWidth: "90vw", maxHeight: "78vh", borderRadius: radius.md, boxShadow: shadow.lg }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", zIndex: 2, left: "50%", bottom: 24, transform: "translateX(-50%)", display: "flex", gap: 10, maxWidth: "90vw", overflowX: "auto" }}
          >
            {prop.gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setLightbox(i)}
                style={{
                  width: 66,
                  height: 48,
                  borderRadius: 9,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: i === lightbox ? `2px solid ${colors.white}` : "2px solid transparent",
                  opacity: i === lightbox ? 1 : 0.55,
                  transition: "opacity 0.2s ease, border-color 0.2s ease",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g} alt={`View ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
