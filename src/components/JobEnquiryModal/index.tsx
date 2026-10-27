"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import LandingScreenService, {
  toServiceCategoryCard,
  type ServiceCategoryCard,
} from "@/services/LandingScreenService";
import EnquiryService from "@/services/EnquiryService";
import {
  loadGoogleMapsScript,
  type GoogleMapsNamespace,
  type GoogleMapsPlacePrediction,
} from "@/utils/loadGoogleMapsScript";

export interface JobEnquiryModalHandle {
  open: () => void;
}

/** Popup shown from the header's "Submit Enquiry" button — the untargeted
 * "post a requirement" flow (category + location + requirement, no specific
 * professional). Mirrors homedot-mobile-app's HomeScreen "Submit Enquiry"
 * bottom sheet; a professional sees the result as a "Job Enquiry" in their
 * own enquiries list. Only ever opened for a signed-in user — SiteNav gates
 * the trigger behind getAuthToken() the same way it already does for
 * "Add Property"/"Favorites", so this component assumes a token exists. */
const JobEnquiryModal = forwardRef<JobEnquiryModalHandle>(
  function JobEnquiryModal(_props, ref) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [categories, setCategories] = useState<ServiceCategoryCard[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const categoriesFetched = useRef(false);
    const [category, setCategory] = useState<ServiceCategoryCard | null>(null);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const categoryFieldRef = useRef<HTMLDivElement | null>(null);

    const [locationText, setLocationText] = useState("");
    const [appliedLocation, setAppliedLocation] = useState<{
      address: string;
      lat: number;
      long: number;
    } | null>(null);
    const [suggestions, setSuggestions] = useState<GoogleMapsPlacePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [locationError, setLocationError] = useState(false);
    const [locatingMe, setLocatingMe] = useState(false);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const locationFieldRef = useRef<HTMLDivElement | null>(null);
    const googleMapsRef = useRef<GoogleMapsNamespace | null>(null);
    const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [requirement, setRequirement] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
    }));

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-detection guard for the portal target (document.body), which doesn't exist during SSR
      setMounted(true);
    }, []);

    const close = useCallback(() => {
      setOpen(false);
      setCategory(null);
      setShowCategoryMenu(false);
      setLocationText("");
      setAppliedLocation(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setLocationError(false);
      setRequirement("");
      setSubmitError(null);
      setSent(false);
    }, []);

    useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open, close]);

    // Loaded lazily — only once the modal actually opens, not on every page
    // load just because SiteNav mounted. loadGoogleMapsScript is a cached
    // singleton, so this is a no-op if some other screen loaded it already.
    useEffect(() => {
      if (!open) return;
      let cancelled = false;
      loadGoogleMapsScript()
        .then((google) => {
          if (!cancelled) googleMapsRef.current = google;
        })
        .catch(() => {
          // Silently degrade — the location field still accepts free text,
          // but submission requires a resolved suggestion (see submit()).
        });
      return () => {
        cancelled = true;
      };
    }, [open]);

    useEffect(() => {
      if (!open || categoriesFetched.current) return;
      categoriesFetched.current = true;
      setCategoriesLoading(true);
      LandingScreenService.getServiceCategories().then((res) => {
        setCategoriesLoading(false);
        if (res.success && res.data?.status && res.data.data.length > 0) {
          setCategories(res.data.data.map(toServiceCategoryCard));
        }
      });
    }, [open]);

    useEffect(() => {
      if (!showCategoryMenu) return;
      const onDocClick = (e: MouseEvent) => {
        if (!categoryFieldRef.current?.contains(e.target as Node))
          setShowCategoryMenu(false);
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, [showCategoryMenu]);

    useEffect(() => {
      if (!showSuggestions) return;
      const onDocClick = (e: MouseEvent) => {
        if (!locationFieldRef.current?.contains(e.target as Node))
          setShowSuggestions(false);
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, [showSuggestions]);

    const onLocationInputChange = (value: string) => {
      setLocationText(value);
      setAppliedLocation(null);
      setLocationError(false);
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      const q = value.trim();
      if (q.length < 1) {
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
              setLocationError(false);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
              setLocationError(status === "ZERO_RESULTS");
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
      new google.maps.Geocoder().geocode(
        { placeId: prediction.place_id },
        (results, status) => {
          if (status === "OK" && results?.[0]) {
            setLocationError(false);
            setLocationText(results[0].formatted_address);
            setAppliedLocation({
              address: results[0].formatted_address,
              lat: results[0].geometry.location.lat(),
              long: results[0].geometry.location.lng(),
            });
          } else {
            setLocationError(true);
          }
        },
      );
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
              const address =
                status === "OK" && results?.[0] ? results[0].formatted_address : "Current location";
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
      setLocationError(false);
    };

    const submit = async (e: FormEvent) => {
      e.preventDefault();
      if (!category) {
        setSubmitError("Please select a category.");
        return;
      }
      if (!appliedLocation) {
        setSubmitError("Pick your service location from the suggestions.");
        return;
      }
      if (requirement.trim().length < 10) {
        setSubmitError("Tell us a bit more about what you need (at least 10 characters).");
        return;
      }
      setSubmitError(null);
      setSubmitting(true);
      const res = await EnquiryService.submitEnquiry({
        levelOneId: category.id,
        levelOneName: category.name,
        latitude: appliedLocation.lat,
        longitude: appliedLocation.long,
        location: appliedLocation.address,
        requirement: requirement.trim(),
        terms: true,
      });
      setSubmitting(false);
      if (res.success && res.data?.status) {
        setSent(true);
      } else {
        setSubmitError(res.data?.message || res.message || "Something went wrong. Please try again.");
      }
    };

    if (!open || !mounted) return null;

    return createPortal(
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
            width: "min(460px, 100%)",
            background: colors.card,
            borderRadius: 24,
            boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
            padding: "34px 30px",
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

          {sent ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <span
                className="pf-success-pop"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(31,138,91,0.13)",
                  color: "#1F8A5B",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 18px",
                }}
              >
                <Icon name="check" size={28} strokeWidth={2.4} />
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: fontSize.xl,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Enquiry sent!
              </h2>
              <p style={{ color: colors.muted, fontSize: fontSize.base, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 24px" }}>
                We&apos;ve shared your requirement with verified professionals near you — they&apos;ll reach out shortly.
              </p>
              <Button variant="outline" onClick={close}>
                Done
              </Button>
            </div>
          ) : (
            <>
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
                  textAlign: "center",
                }}
              >
                Submit an enquiry
              </h2>
              <p style={{ color: colors.muted, fontSize: fontSize.base, lineHeight: 1.6, maxWidth: 360, margin: "0 auto 26px", textAlign: "center" }}>
                Tell us what you need — we&apos;ll connect you with verified professionals who can help.
              </p>

              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
                <FieldLabel label="Category">
                  <div ref={categoryFieldRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setShowCategoryMenu((v) => !v)}
                      aria-haspopup="listbox"
                      aria-expanded={showCategoryMenu}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        width: "100%",
                        height: 50,
                        border: `1.5px solid ${showCategoryMenu ? colors.primary : colors.line}`,
                        borderRadius: 12,
                        padding: "0 12px 0 14px",
                        background: colors.card,
                        boxShadow: showCategoryMenu ? `0 0 0 4px ${colors.primarySoft}` : "none",
                        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                      }}
                    >
                      {category && <Icon name={category.icon} size={18} color={colors.muted} />}
                      <span
                        style={{
                          flex: 1,
                          textAlign: "left",
                          fontSize: fontSize.base - 0.5,
                          fontWeight: category ? 600 : 400,
                          color: category ? colors.ink : colors.muted,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {category?.name ?? "What do you need help with?"}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          flexShrink: 0,
                          transition: "transform 0.2s ease",
                          transform: showCategoryMenu ? "rotate(180deg)" : "none",
                        }}
                      >
                        <Icon name="chevronDown" size={16} color={colors.muted} />
                      </span>
                    </button>

                    {showCategoryMenu && (
                      <div
                        role="listbox"
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
                          overflow: "hidden",
                          maxHeight: 260,
                          overflowY: "auto",
                          padding: 6,
                        }}
                      >
                        {categoriesLoading ? (
                          <p style={{ padding: "12px 10px", fontSize: fontSize.sm, color: colors.muted }}>
                            Loading categories…
                          </p>
                        ) : categories.length === 0 ? (
                          <p style={{ padding: "12px 10px", fontSize: fontSize.sm, color: colors.muted }}>
                            Couldn&apos;t load categories. Try again shortly.
                          </p>
                        ) : (
                          categories.map((c) => (
                            <CategoryMenuOption
                              key={c.id}
                              category={c}
                              selected={category?.id === c.id}
                              onClick={() => {
                                setCategory(c);
                                setShowCategoryMenu(false);
                              }}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </FieldLabel>

                <FieldLabel label="Location">
                  <div ref={locationFieldRef} style={{ position: "relative" }}>
                    <div
                      className={`pf-field${locationError ? " pf-field--error" : ""}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        height: 50,
                        borderRadius: 12,
                        padding: "0 14px",
                      }}
                    >
                      <Icon name="location" size={17} color={locationError ? "#DC2626" : colors.muted} />
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
                          background: "none",
                          fontSize: fontSize.base - 0.5,
                          color: colors.ink,
                        }}
                      />
                      {appliedLocation ? (
                        <button type="button" onClick={clearLocation} aria-label="Clear location" style={{ display: "flex", flexShrink: 0, color: colors.muted }}>
                          <Icon name="close" size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={locateCurrentPosition}
                          disabled={locatingMe}
                          aria-label="Use my current location"
                          style={{ display: "flex", flexShrink: 0, color: colors.primary, opacity: locatingMe ? 0.5 : 1 }}
                        >
                          <Icon name="compass" size={17} />
                        </button>
                      )}
                    </div>

                    {locationError && !showSuggestions && (
                      <p role="alert" style={{ margin: "6px 2px 0", fontSize: fontSize.xs + 0.5, color: "#C0392B" }}>
                        We couldn&apos;t find that place. Try a city, locality, or landmark near you.
                      </p>
                    )}

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
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {s.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FieldLabel>

                <FieldLabel label="What do you need?">
                  <textarea
                    className="pf-textarea"
                    rows={3}
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder='e.g. "Interior designer for a 3BHK renovation, budget around ₹8L"'
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      padding: "12px 14px",
                      fontSize: fontSize.base - 0.5,
                      color: colors.ink,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </FieldLabel>

                {submitError && (
                  <p style={{ fontSize: fontSize.sm, color: "#C0392B", margin: 0 }}>{submitError}</p>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  full
                  icon={submitting ? <span className="pf-spinner" /> : <Icon name="chat" size={18} />}
                  type="submit"
                >
                  {submitting ? "Sending…" : "Submit Enquiry"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>,
      document.body,
    );
  },
);

export default JobEnquiryModal;

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: spacing.sm - 2 }}>
      <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.ink }}>{label}</span>
      {children}
    </label>
  );
}

// Mirrors MarketplaceScreen's TypeMenuOption — same row styling/hover, plus
// the category's own icon alongside its professional count.
function CategoryMenuOption({
  category,
  selected,
  onClick,
}: {
  category: ServiceCategoryCard;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className="dropdown-option"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 10px",
        borderRadius: radius.sm,
        textAlign: "left",
        fontSize: fontSize.sm + 0.5,
        fontWeight: selected ? 600 : 500,
        color: selected ? colors.primary : colors.ink2,
        background: selected ? colors.primarySoft : "transparent",
      }}
    >
      <Icon name={category.icon} size={16} color={selected ? colors.primary : colors.muted} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {category.name}
      </span>
      <span style={{ fontSize: fontSize.xs, fontWeight: 500, color: colors.muted, flexShrink: 0 }}>
        {category.count.toLocaleString()}
      </span>
      {selected && <Icon name="check" size={14} color={colors.primary} />}
    </button>
  );
}
