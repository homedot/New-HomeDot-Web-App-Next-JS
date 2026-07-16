"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import ProCard from "@/components/ProCard";
import Reveal from "@/components/Reveal";
import {
  loadGoogleMapsScript,
  type GoogleMapsNamespace,
  type GoogleMapsPlacePrediction,
} from "@/utils/loadGoogleMapsScript";
import ProfessionalsScreenService from "@/services/ProfessionalsScreenService";
import { reviews, type ProfessionalRecord } from "./data";

type Tab = "portfolio" | "about" | "services" | "reviews";
const TABS: { key: Tab; label: string }[] = [
  { key: "portfolio", label: "Portfolio" },
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "reviews", label: "Reviews" },
];

export default function ProfessionalDetail({
  pro,
  similar,
  saved,
  onSave,
  onBack,
  onOpen,
}: {
  pro: ProfessionalRecord;
  similar: ProfessionalRecord[];
  saved: string[];
  onSave: (id: string) => void;
  onBack: () => void;
  onOpen: (p: ProfessionalRecord) => void;
}) {
  const [tab, setTab] = useState<Tab>("portfolio");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const contactCardRef = useRef<HTMLDivElement>(null);

  // Sliding pill behind the active tab — measured from the actual button
  // layout (widths vary per label) rather than assumed, so it lines up
  // exactly regardless of label length or viewport.
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[tab];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [tab]);

  // Enquiry form — mirrors homedot-mobile-app's directEnquiry, which needs
  // a service location (address + lat/long, resolved via Places) and a
  // requirement description; the professional themselves is identified by
  // pro.userId and the requester by their auth token, so there's no
  // name/phone field here.
  const [locationText, setLocationText] = useState("");
  const [appliedLocation, setAppliedLocation] = useState<{ address: string; lat: number; long: number } | null>(null);
  const [requirement, setRequirement] = useState("");
  const [suggestions, setSuggestions] = useState<GoogleMapsPlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locatingMe, setLocatingMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationFieldRef = useRef<HTMLDivElement>(null);
  const googleMapsRef = useRef<GoogleMapsNamespace | null>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset transient state whenever a different professional is opened —
  // this component is reused across navigations rather than remounted.
  const [prevProId, setPrevProId] = useState(pro.id);
  if (pro.id !== prevProId) {
    setPrevProId(pro.id);
    setTab("portfolio");
    setLightbox(null);
    setSent(false);
    setCopied(false);
    setLocationText("");
    setAppliedLocation(null);
    setRequirement("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSubmitError(null);
  }

  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript()
      .then((google) => {
        if (!cancelled) googleMapsRef.current = google;
      })
      .catch(() => {
        // Silently degrade — the location field still accepts free text,
        // which submitDirectEnquiry sends as-is without lat/long.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showSuggestions) return;
    const onDocClick = (e: MouseEvent) => {
      if (!locationFieldRef.current?.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showSuggestions]);

  const onLocationInputChange = (value: string) => {
    setLocationText(value);
    setAppliedLocation(null);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimer.current = setTimeout(() => {
      const google = googleMapsRef.current;
      if (!google) return;
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: q, componentRestrictions: { country: "in" } },
        (predictions, status) => {
          if (status === "OK" && predictions?.length) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        },
      );
    }, 300);
  };

  const selectSuggestion = (prediction: GoogleMapsPlacePrediction) => {
    setShowSuggestions(false);
    setSuggestions([]);
    const google = googleMapsRef.current;
    if (!google) return;
    new google.maps.Geocoder().geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setLocationText(results[0].formatted_address);
        setAppliedLocation({
          address: results[0].formatted_address,
          lat: results[0].geometry.location.lat(),
          long: results[0].geometry.location.lng(),
        });
      }
    });
  };

  const locateCurrentPosition = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setShowSuggestions(false);
    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const google = googleMapsRef.current;
        if (!google) {
          setLocatingMe(false);
          setLocationText("Current location");
          setAppliedLocation({ address: "Current location", lat: latitude, long: longitude });
          return;
        }
        new google.maps.Geocoder().geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            setLocatingMe(false);
            const address = status === "OK" && results?.[0] ? results[0].formatted_address : "Current location";
            setLocationText(address);
            setAppliedLocation({ address, lat: latitude, long: longitude });
          },
        );
      },
      () => setLocatingMe(false),
    );
  };

  const clearLocation = () => {
    setLocationText("");
    setAppliedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const submitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pro.userId) {
      setSubmitError("This professional isn't available for enquiries right now.");
      return;
    }
    if (!appliedLocation) {
      setSubmitError("Pick your service location from the suggestions.");
      return;
    }
    if (!requirement.trim()) {
      setSubmitError("Tell the pro a bit about what you need.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    const res = await ProfessionalsScreenService.submitDirectEnquiry({
      professional: pro.userId,
      latitude: appliedLocation.lat,
      longitude: appliedLocation.long,
      location: appliedLocation.address,
      requirement: requirement.trim(),
      terms: true,
    });
    setSubmitting(false);
    if (res.success && res.data?.status) {
      setSuccessMessage(res.data.message || "");
      setSent(true);
    } else {
      setSubmitError(res.data?.message || res.message || "Something went wrong. Please try again.");
    }
  };

  // `saved` holds userIds (seeded from favorites-list), not the inviteId
  // used as `pro.id` elsewhere on this screen — see ProfessionalsScreen's
  // toggleSave for the same distinction.
  const isSaved = !!pro.userId && saved.includes(pro.userId);

  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % pro.gallery.length));
      else if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + pro.gallery.length) % pro.gallery.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, pro.gallery.length]);

  function handleShare() {
    if (typeof window === "undefined") return;
    const shareData = { title: pro.name, url: window.location.href };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(shareData.url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  function focusContactForm() {
    contactCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => locationInputRef.current?.focus(), 450);
  }

  const ratingPct = Math.max(0, Math.min(100, (pro.rating / 5) * 100));

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
                Professionals
              </button>
              <Icon name="arrow" size={13} />
              <span style={{ color: colors.ink, fontWeight: 600 }}>{pro.categoryName}</span>
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
              onClick={() => onSave(pro.id)}
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

        {/* hero: cover photo with the avatar overlapping its bottom edge */}
        <Reveal style={{ position: "relative" }}>
          <div
            style={{
              position: "relative",
              borderRadius: radius.lg,
              overflow: "hidden",
              height: "clamp(200px, 32vw, 340px)",
              background: colors.primarySoft,
            }}
          >
            {pro.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pro.cover} alt={pro.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(10,20,34,0.05) 0%, rgba(10,20,34,0.1) 55%, rgba(10,20,34,0.55) 100%)",
              }}
            />
          </div>
          <div style={{ position: "absolute", left: "clamp(20px, 4vw, 40px)", bottom: -48, zIndex: 3 }}>
            <div className="pf-avatar" style={{ position: "relative", width: "clamp(96px, 12vw, 128px)", height: "clamp(96px, 12vw, 128px)" }}>
              <span
                className="pf-avatar-glow"
                style={{
                  position: "absolute",
                  inset: -10,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${colors.accent}55, transparent 70%)`,
                  filter: "blur(10px)",
                  zIndex: -1,
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pro.avatar}
                alt={pro.name}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `5px solid ${colors.card}`,
                  boxShadow: shadow.lg,
                  display: "block",
                }}
              />
            </div>
          </div>
        </Reveal>

        {/* identity block */}
        <Reveal
          delay={80}
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: spacing.xl,
            marginTop: 64,
            paddingLeft: "clamp(4px, 1vw, 8px)",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: spacing.sm }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.02em" }}>{pro.name}</h1>
              {pro.verified && (
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
                  <Icon name="verified" size={13} filled color={colors.white} /> Verified
                </span>
              )}
            </div>
            <p style={{ fontSize: fontSize.md - 1, color: colors.ink2, marginTop: 6, fontWeight: 500 }}>
              {pro.profession} · {pro.categoryName}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: spacing.md, marginTop: spacing.sm + 2, fontSize: fontSize.sm, color: colors.muted }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: colors.ink }}>
                <Icon name="star" size={15} filled color={colors.gold} /> {pro.rating.toFixed(1)}
              </span>
              <span>({pro.reviews} reviews)</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="location" size={15} /> {pro.location}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="clock" size={15} /> Responds {pro.responds}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: spacing.md }}>
              {pro.tags.map((t) => (
                <span
                  key={t}
                  style={{ fontSize: fontSize.xs, fontWeight: 600, color: colors.primary, background: colors.primarySoft, padding: "6px 12px", borderRadius: 8 }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, minWidth: 200 }}>
            <Button variant="primary" size="lg" icon={<Icon name="chat" size={18} />} onClick={focusContactForm}>
              Send Your Inquiry
            </Button>
            <div style={{ display: "flex", gap: spacing.sm }}>
              <span style={{ flex: 1 }}>
                <Button variant="outline" size="md" full icon={<Icon name="phone" size={16} />}>
                  Call
                </Button>
              </span>
            </div>
          </div>
        </Reveal>

        {/* stat strip */}
        <Reveal stagger className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: spacing.md, margin: `${spacing.xl}px 0 4px` }}>
          {[
            { icon: "calendar" as const, label: "Experience", value: `${pro.experience} yrs`, tint: colors.primarySoft, ink: colors.primary },
            ...(pro.projects > 0
              ? [{ icon: "briefcase" as const, label: "Projects completed", value: `${pro.projects}+`, tint: "rgba(41,151,255,0.12)", ink: colors.accent }]
              : []),
            { icon: "star" as const, label: "Average rating", value: pro.rating > 0 ? pro.rating.toFixed(1) : "New", tint: "rgba(245,166,35,0.14)", ink: colors.gold },
            { icon: "sparkle" as const, label: pro.priceUnit || "Pricing", value: pro.price === "₹0" ? "Free" : pro.price, tint: "rgba(31,138,91,0.13)", ink: "#1F8A5B" },
          ].map((k) => (
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
                style={{ width: 44, height: 44, borderRadius: 12, background: k.tint, color: k.ink, display: "grid", placeItems: "center", flexShrink: 0 }}
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

        {/* tabs — sliding pill indicator behind the active label */}
        <div className="pd-subnav" style={{ borderRadius: radius.full, border: `1px solid ${colors.line}`, boxShadow: shadow.sm, padding: 6, margin: `${spacing.lg}px 0` }}>
          <div className="pd-subnav-row" style={{ position: "relative", display: "flex", gap: 6, overflowX: "auto" }}>
            <span
              className="pf-tab-thumb"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: indicator.left,
                width: indicator.width,
                background: colors.primary,
                borderRadius: radius.full,
                zIndex: 0,
              }}
            />
            {TABS.map((t) => (
              <button
                key={t.key}
                ref={(el) => {
                  tabRefs.current[t.key] = el;
                }}
                onClick={() => setTab(t.key)}
                className="pd-pill pf-tab-btn"
                style={{
                  position: "relative",
                  zIndex: 1,
                  flexShrink: 0,
                  fontSize: fontSize.sm,
                  fontWeight: 600,
                  padding: "9px 18px",
                  borderRadius: radius.full,
                  background: "transparent",
                  color: tab === t.key ? colors.white : colors.ink2,
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px]" style={{ gap: spacing.xxl, marginTop: spacing.md, alignItems: "start" }}>
          {/* main column */}
          <div>
            {tab === "portfolio" && (
              <Reveal className="grid grid-cols-2 sm:grid-cols-2" style={{ gap: 10 }}>
                {pro.gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(i)}
                    className="card-hover pf-portfolio-item"
                    style={{
                      position: "relative",
                      borderRadius: radius.md,
                      overflow: "hidden",
                      cursor: "zoom-in",
                      background: colors.primarySoft,
                      aspectRatio: i === 0 ? "16/10" : "4/3",
                      gridColumn: i === 0 ? "1 / -1" : undefined,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g}
                      alt={`${pro.name} — project ${i + 1}`}
                      className="card-hover-img"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      className="pf-portfolio-overlay"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, transparent 55%, rgba(10,20,34,0.55) 100%)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "flex-end",
                        padding: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.92)",
                          color: colors.ink,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Icon name="search" size={15} />
                      </span>
                    </div>
                  </button>
                ))}
              </Reveal>
            )}

            {tab === "about" && (
              <Reveal style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
                <p style={{ fontSize: fontSize.md - 1, lineHeight: 1.75, color: colors.ink2 }}>{pro.about}</p>
                <div>
                  <h3 style={{ fontSize: fontSize.md, fontWeight: 700, marginBottom: spacing.md }}>Why clients choose us</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm + 2 }}>
                    {[
                      "Transparent, itemised quotes with no hidden costs",
                      "Weekly progress updates with photos",
                      "Local craft and climate-appropriate materials",
                      "Dedicated point of contact through handover",
                    ].map((c) => (
                      <div key={c} style={{ display: "flex", alignItems: "flex-start", gap: spacing.md - 1, fontSize: fontSize.base - 1, color: colors.ink2 }}>
                        <span
                          style={{ width: 24, height: 24, borderRadius: "50%", background: colors.primarySoft, color: colors.primary, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}
                        >
                          <Icon name="check" size={14} />
                        </span>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: fontSize.md, fontWeight: 700, marginBottom: spacing.md }}>Verified credentials</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: spacing.md }}>
                    {["Government ID verified", "Trade license on file", "Background checked", "Insurance covered"].map((c) => (
                      <div key={c} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: fontSize.base - 1, color: colors.ink2 }}>
                        <span
                          style={{ width: 24, height: 24, borderRadius: "50%", background: colors.primarySoft, color: colors.primary, display: "grid", placeItems: "center", flexShrink: 0 }}
                        >
                          <Icon name="check" size={14} />
                        </span>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {tab === "services" && (
              <Reveal stagger style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
                {pro.services.map((s, i) => (
                  <div
                    key={s}
                    className="card-hover"
                    style={{
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: spacing.lg,
                      background: colors.card,
                      border: `1px solid ${colors.line}`,
                      borderRadius: radius.md,
                      boxShadow: shadow.sm,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
                      <span
                        style={{ width: 38, height: 38, borderRadius: 10, background: colors.primarySoft, color: colors.primary, display: "grid", placeItems: "center", flexShrink: 0 }}
                      >
                        <Icon name="briefcase" size={17} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: fontSize.base + 1 }}>{s}</div>
                        <div style={{ fontSize: fontSize.sm, color: colors.muted, marginTop: 2 }}>
                          {["Inspection & quote included", "Materials billed separately", "Backed by HomeDot guarantee"][i % 3]}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={focusContactForm}>
                      Enquire
                    </Button>
                  </div>
                ))}
              </Reveal>
            )}

            {tab === "reviews" && (
              <Reveal style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
                <div style={{ display: "flex", gap: spacing.xxl - 6, alignItems: "center", background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.md, padding: spacing.xl }}>
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      background: `conic-gradient(${colors.gold} ${ratingPct}%, ${colors.line} 0)`,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ width: 70, height: 70, borderRadius: "50%", background: colors.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                      <b style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: colors.primary, lineHeight: 1 }}>{pro.rating.toFixed(1)}</b>
                      <Icon name="star" size={11} filled color={colors.gold} />
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: fontSize.xs, color: colors.muted, marginBottom: 2 }}>{pro.reviews} reviews</span>
                    {[5, 4, 3, 2, 1].map((n) => {
                      const pct = n === 5 ? 78 : n === 4 ? 16 : n === 3 ? 4 : n === 2 ? 1 : 1;
                      return (
                        <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                          <span style={{ width: 10, color: colors.muted }}>{n}</span>
                          <span style={{ flex: 1, height: 7, background: "#EFEFF2", borderRadius: radius.full, overflow: "hidden" }}>
                            <span style={{ display: "block", width: `${pct}%`, height: "100%", background: colors.gold }} />
                          </span>
                          <span style={{ width: 32, color: colors.muted, textAlign: "right" }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {reviews.map((r, i) => (
                  <div key={i} className="card-hover" style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.md, padding: spacing.lg + 2, boxShadow: shadow.sm }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.avatar} alt={r.by} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: fontSize.base - 1 }}>{r.by}</div>
                          <div style={{ fontSize: fontSize.xs, color: colors.muted }}>{r.when}</div>
                        </div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: fontSize.sm, fontWeight: 700 }}>
                        <Icon name="star" size={13} filled color={colors.gold} /> {r.stars}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: fontSize.base - 1, lineHeight: 1.6, color: colors.ink2 }}>{r.text}</p>
                  </div>
                ))}
              </Reveal>
            )}
          </div>

          {/* sidebar */}
          <Reveal delay={100} style={{ display: "flex", flexDirection: "column", gap: spacing.lg, position: "sticky", top: 100 }}>
            <div ref={contactCardRef} style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.md }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
              <div style={{ padding: spacing.xl, display: "flex", flexDirection: "column", gap: spacing.md }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontSize: fontSize.xs, color: colors.muted }}>Starting at</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: fontSize.xs, fontWeight: 700, color: colors.primary, background: colors.primarySoft, padding: "5px 11px", borderRadius: radius.full }}>
                    <Icon name="clock" size={13} /> {pro.responds}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xxl - 2, fontWeight: 700 }}>
                  {pro.price === "₹0" ? "Free" : pro.price}
                </div>

                {sent ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6, padding: "14px 0" }}>
                    <span className="pf-success-pop" style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(31,138,91,0.13)", color: "#1F8A5B", display: "grid", placeItems: "center", marginBottom: 4 }}>
                      <Icon name="check" size={26} strokeWidth={2.4} />
                    </span>
                    <b style={{ fontSize: fontSize.base }}>Inquiry sent!</b>
                    <span style={{ fontSize: fontSize.sm, color: colors.muted }}>
                      {successMessage || `${pro.name} will get back to you shortly.`}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={submitEnquiry} style={{ display: "flex", flexDirection: "column", gap: spacing.sm + 2 }}>
                    <h3 style={{ fontSize: fontSize.base + 1, fontWeight: 700, margin: 0 }}>Send Your Inquiry</h3>

                    <div ref={locationFieldRef} style={{ position: "relative" }}>
                      <div
                        className="pf-field"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          borderRadius: radius.sm + 1,
                          padding: "0 13px",
                        }}
                      >
                        <Icon name="location" size={16} color={colors.muted} />
                        <input
                          ref={locationInputRef}
                          value={locationText}
                          onChange={(e) => onLocationInputChange(e.target.value)}
                          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                          placeholder="Where do you need this service?"
                          autoComplete="off"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            border: "none",
                            outline: "none",
                            padding: "11px 0",
                            fontSize: fontSize.sm + 1,
                            color: colors.ink,
                          }}
                        />
                        {appliedLocation ? (
                          <button type="button" onClick={clearLocation} aria-label="Clear location" style={{ display: "flex", flexShrink: 0, color: colors.muted }}>
                            <Icon name="close" size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={locateCurrentPosition}
                            disabled={locatingMe}
                            aria-label="Use my current location"
                            style={{ display: "flex", flexShrink: 0, color: colors.primary, opacity: locatingMe ? 0.5 : 1 }}
                          >
                            <Icon name="compass" size={16} />
                          </button>
                        )}
                      </div>

                      {showSuggestions && suggestions.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            left: 0,
                            right: 0,
                            background: colors.card,
                            border: `1px solid ${colors.line}`,
                            borderRadius: radius.md,
                            boxShadow: shadow.lg,
                            zIndex: 20,
                            maxHeight: 220,
                            overflowY: "auto",
                          }}
                        >
                          {suggestions.map((s, i) => (
                            <button
                              key={s.place_id}
                              type="button"
                              onClick={() => selectSuggestion(s)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                                width: "100%",
                                padding: "10px 13px",
                                textAlign: "left",
                                fontSize: fontSize.sm,
                                color: colors.ink2,
                                borderBottom: i < suggestions.length - 1 ? `1px solid ${colors.line}` : "none",
                              }}
                            >
                              <Icon name="location" size={15} color={colors.accent} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.description}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <textarea
                      className="pf-textarea"
                      rows={3}
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      placeholder={`Tell ${pro.name} what you need — e.g. "${pro.tags[0] ?? pro.profession} for a 3BHK renovation"…`}
                      style={{ borderRadius: radius.sm + 1, padding: "11px 13px", fontSize: fontSize.sm + 1, resize: "vertical", fontFamily: "inherit" }}
                    />

                    {submitError && (
                      <p style={{ fontSize: fontSize.xs + 0.5, color: "#C0392B", margin: 0 }}>{submitError}</p>
                    )}

                    <Button variant="primary" size="lg" full icon={submitting ? <span className="pf-spinner" /> : <Icon name="chat" size={18} />} type="submit">
                      {submitting ? "Sending…" : "Send Your Inquiry"}
                    </Button>
                  </form>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: spacing.sm, paddingTop: spacing.md, borderTop: `1px solid ${colors.line}` }}>
                  {[
                    { icon: "shield" as const, label: "HomeDot service guarantee" },
                    { icon: "verified" as const, label: "ID & license verified" },
                    { icon: "briefcase" as const, label: `${pro.projects}+ projects on HomeDot` },
                  ].map((t) => (
                    <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: fontSize.sm - 1, color: colors.ink2 }}>
                      <Icon name={t.icon} size={17} color={colors.primary} /> {t.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: spacing.md, background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadow.sm }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: colors.primarySoft, color: colors.primary, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name="shield" size={18} />
              </span>
              <div>
                <b style={{ display: "block", fontSize: fontSize.sm + 1, marginBottom: 3 }}>The HomeDot promise</b>
                <span style={{ fontSize: fontSize.xs + 0.5, color: colors.muted, lineHeight: 1.5 }}>
                  Every professional is manually checked for credentials and past work before they go live.
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* similar professionals */}
        {similar.length > 0 && (
          <div style={{ marginTop: spacing.huge - 20 }}>
            <div style={{ marginBottom: spacing.xl, display: "flex", alignItems: "center", gap: spacing.md }}>
              <span style={{ width: 4, height: 26, borderRadius: 4, background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})` }} />
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: fontSize.xxl - 4, fontWeight: 600 }}>Similar pros nearby</h2>
                <p style={{ color: colors.muted, fontSize: fontSize.base, marginTop: 4 }}>
                  More {pro.categoryName.toLowerCase()} you may like.
                </p>
              </div>
            </div>
            <Reveal stagger className="grid grid-cols-1 md:grid-cols-3" style={{ gap: spacing.xl }}>
              {similar.map((p) => (
                <ProCard key={p.id} pro={p} saved={!!p.userId && saved.includes(p.userId)} onSave={onSave} onOpen={() => onOpen(p)} />
              ))}
            </Reveal>
          </div>
        )}

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
          <div style={{ fontFamily: "var(--font-display)", fontSize: fontSize.lg, fontWeight: 700, lineHeight: 1.1 }}>
            {pro.price === "₹0" ? "Free" : pro.price}
          </div>
          {pro.priceUnit && <div style={{ fontSize: fontSize.xs, color: colors.muted }}>/ {pro.priceUnit}</div>}
        </div>
        <button
          onClick={() => onSave(pro.id)}
          aria-label={isSaved ? "Remove from saved" : "Save professional"}
          style={{ width: 46, height: 46, borderRadius: "50%", border: `1.5px solid ${colors.line}`, display: "grid", placeItems: "center", color: isSaved ? "#E5484D" : colors.ink2, flexShrink: 0 }}
        >
          <Icon name="heart" size={19} filled={isSaved} />
        </button>
        <span style={{ flexShrink: 0 }}>
          <Button variant="primary" size="md" icon={<Icon name="chat" size={16} />} onClick={focusContactForm}>
            Send Inquiry
          </Button>
        </span>
      </div>

      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          className="pd-lightbox-overlay"
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,20,34,0.92)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 40, cursor: "zoom-out" }}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="pd-lightbox-arrow"
            style={{ position: "absolute", zIndex: 2, top: 24, right: 28, width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.14)", color: colors.white, display: "grid", placeItems: "center" }}
          >
            <Icon name="close" size={22} color={colors.white} />
          </button>

          {pro.gallery.length > 1 && (
            <span
              style={{ position: "absolute", zIndex: 2, top: 30, left: 28, color: colors.white, fontWeight: 600, fontSize: fontSize.sm, background: "rgba(255,255,255,0.14)", padding: "7px 14px", borderRadius: radius.full }}
            >
              {lightbox + 1} / {pro.gallery.length}
            </span>
          )}

          {pro.gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i - 1 + pro.gallery.length) % pro.gallery.length));
                }}
                aria-label="Previous photo"
                className="pd-lightbox-arrow"
                style={{ position: "absolute", zIndex: 2, left: 18, top: "50%", transform: "translateY(-50%)", width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.14)", color: colors.white, display: "grid", placeItems: "center" }}
              >
                <Icon name="arrowLeft" size={22} color={colors.white} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i + 1) % pro.gallery.length));
                }}
                aria-label="Next photo"
                className="pd-lightbox-arrow"
                style={{ position: "absolute", zIndex: 2, right: 18, top: "50%", transform: "translateY(-50%)", width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.14)", color: colors.white, display: "grid", placeItems: "center" }}
              >
                <Icon name="arrow" size={22} color={colors.white} />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={lightbox}
            src={pro.gallery[lightbox]}
            alt="Project"
            onClick={(e) => e.stopPropagation()}
            className="pd-lightbox-img"
            style={{ position: "relative", zIndex: 1, maxWidth: "90vw", maxHeight: "78vh", borderRadius: radius.md, boxShadow: shadow.lg }}
          />
        </div>
      )}
    </section>
  );
}
