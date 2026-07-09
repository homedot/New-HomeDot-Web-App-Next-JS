"use client";

import { useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import PropertyCard from "@/components/PropertyCard";
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
  const isSaved = saved.includes(prop.id);
  const isRent = prop.purpose === "Rent";
  const priceVal = parsePrice(prop.price);
  const psf = prop.area && prop.beds > 0 ? Math.round(priceVal / prop.area).toLocaleString() : null;

  const keyFacts: { icon: IconName; label: string; value: string }[] = [
    { icon: "house", label: "Bedrooms", value: prop.beds > 0 ? `${prop.beds} BHK` : "—" },
    { icon: "drop", label: "Bathrooms", value: prop.baths > 0 ? String(prop.baths) : "—" },
    { icon: "cube", label: prop.areaUnit ? "Plot area" : "Built-up area", value: `${prop.area.toLocaleString()} sqft` },
    { icon: "sparkle", label: "Price / sqft", value: psf ? `₹${psf}` : "On request" },
  ];

  const details: [string, string][] = [
    ["Property type", prop.category],
    ["Listing", isRent ? "For Rent" : "For Sale"],
  ];
  if (prop.beds > 0) details.push(["Bedrooms", `${prop.beds} BHK`]);
  if (prop.baths > 0) details.push(["Bathrooms", String(prop.baths)]);
  if (prop.area > 0) details.push([prop.areaUnit ? "Plot area" : "Built-up area", `${prop.area.toLocaleString()} sqft`]);
  if (prop.carpetArea) details.push(["Carpet area", `${prop.carpetArea.toLocaleString()} sqft`]);
  if (prop.noOfFloors) details.push(["No. of floors", String(prop.noOfFloors)]);
  if (prop.roadWidth) details.push(["Road width", `${prop.roadWidth} ft`]);
  if (prop.maintenanceCharge) details.push(["Maintenance charge", `₹${prop.maintenanceCharge.toLocaleString("en-IN")} / month`]);
  if (prop.garage) details.push(["Garage", String(prop.garage)]);
  if (prop.balcony) details.push(["Balcony", String(prop.balcony)]);
  if (prop.furnished) details.push(["Furnishing", prop.furnished]);
  if (prop.listedBy) details.push(["Listed by", prop.listedBy.charAt(0).toUpperCase() + prop.listedBy.slice(1)]);

  const highlights: { icon: IconName; label: string }[] = [
    { icon: "shield", label: "RERA registered" },
    { icon: "verified", label: "HomeDot verified" },
    { icon: "location", label: "Prime location" },
    { icon: "sparkle", label: "Move-in ready" },
  ];

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
              }}
            >
              <Icon name="heart" size={17} filled={isSaved} /> {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* gallery */}
        <div
          className={prop.gallery.length > 1 ? "grid grid-cols-1 lg:grid-cols-[1.55fr_1fr]" : "grid grid-cols-1"}
          style={{ gap: 10, height: "clamp(320px, 42vw, 470px)" }}
        >
          <button
            onClick={() => setLightbox(0)}
            style={{ position: "relative", borderRadius: radius.lg, overflow: "hidden", cursor: "zoom-in", background: colors.primarySoft }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={prop.gallery[0]} alt={prop.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <span
              style={{
                position: "absolute",
                left: 14,
                bottom: 14,
                background: colors.primary,
                color: colors.white,
                fontSize: fontSize.xs,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: radius.full,
              }}
            >
              {prop.status}
            </span>
          </button>
          {prop.gallery.length > 1 && (
            <div className="hidden lg:grid" style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10 }}>
              {prop.gallery.slice(1, 4).map((g, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i + 1)}
                  style={{ position: "relative", borderRadius: radius.md, overflow: "hidden", cursor: "zoom-in", background: colors.primarySoft }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt={`View ${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* header: title + price */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: spacing.xxl,
            marginTop: spacing.xl,
            paddingBottom: spacing.xl,
            borderBottom: `1px solid ${colors.line}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>
              <span
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: 600,
                  color: colors.accent,
                  background: "rgba(41,151,255,0.12)",
                  padding: "5px 12px",
                  borderRadius: 8,
                }}
              >
                {prop.category}
              </span>
              {highlights.slice(0, 2).map((h) => (
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
          </div>
        </div>

        {/* key facts */}
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: spacing.md, margin: `${spacing.xl}px 0 4px` }}>
          {keyFacts.map((k) => (
            <div
              key={k.label}
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
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: colors.primarySoft,
                  color: colors.primary,
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px]" style={{ gap: spacing.xxl, marginTop: spacing.md, alignItems: "start" }}>
          {/* main column */}
          <div>
            <div style={{ padding: `${spacing.xl}px 0`, borderBottom: `1px solid ${colors.line}` }}>
              <h2 style={{ fontSize: fontSize.lg + 2, marginBottom: spacing.md }}>About this property</h2>
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
            </div>

            <div style={{ padding: `${spacing.xl}px 0`, borderBottom: `1px solid ${colors.line}` }}>
              <h2 style={{ fontSize: fontSize.lg + 2, marginBottom: spacing.md }}>Property details</h2>
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
            </div>

            <div style={{ padding: `${spacing.xl}px 0` }}>
              <h2 style={{ fontSize: fontSize.lg + 2, marginBottom: spacing.md }}>Amenities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: spacing.md }}>
                {prop.amenities.map((a) => (
                  <span
                    key={a}
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
                        background: colors.primarySoft,
                        color: colors.primary,
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
            </div>
          </div>

          {/* sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: spacing.lg, position: "sticky", top: 100 }}>
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.lg,
                padding: spacing.xl,
                boxShadow: shadow.md,
                display: "flex",
                flexDirection: "column",
                gap: spacing.md,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: spacing.md, paddingBottom: spacing.md, borderBottom: `1px solid ${colors.line}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={agent.avatar} alt={agent.name} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }} />
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
          </aside>
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
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: spacing.xl }}>
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} saved={saved.includes(p.id)} onSave={onSave} onOpen={() => onOpen(p)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
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
            style={{
              position: "absolute",
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={prop.gallery[lightbox]}
            alt="Property"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "78vh", borderRadius: radius.md, boxShadow: shadow.lg }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", left: "50%", bottom: 24, transform: "translateX(-50%)", display: "flex", gap: 10 }}
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
                  border: i === lightbox ? `2px solid ${colors.white}` : "2px solid transparent",
                  opacity: i === lightbox ? 1 : 0.55,
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
