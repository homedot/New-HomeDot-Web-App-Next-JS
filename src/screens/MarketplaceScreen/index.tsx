"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import PropertyDetail from "./PropertyDetail";
import MarketplaceScreenService, {
  toMarketplaceProperty,
  toMarketplacePropertyDetail,
  type PropertiesFilterPayload,
  type PropertyTypeRecord,
} from "@/services/MarketplaceScreenService";
import {
  loadGoogleMapsScript,
  type GoogleMapsNamespace,
  type GoogleMapsAddressComponent,
} from "@/utils/loadGoogleMapsScript";
import {
  properties,
  bedOptions,
  bathOptions,
  priceOptions,
  budgetRanges,
  parsePrice,
  type MarketplaceProperty,
} from "./data";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

// Mirrors homedot-mobile-app's location filter, which only reads the
// "locality" component out of a geocode/place result to drive `cities`.
function cityFromAddressComponents(
  components: GoogleMapsAddressComponent[] | undefined,
): string | null {
  return components?.find((c) => c.types.includes("locality"))?.long_name ?? null;
}

// Office space and plots have no bedroom/bathroom counts server-side, so
// those filters don't apply to them.
const PROPERTY_TYPES_WITHOUT_BED_BATH = new Set(["office-space", "plots"]);

function hidesBedBath(type: PropertyTypeRecord | null): boolean {
  if (!type) return false;
  if (type.propertyTypeSlug && PROPERTY_TYPES_WITHOUT_BED_BATH.has(type.propertyTypeSlug))
    return true;
  return /office|plot/i.test(type.propertyType);
}

export default function MarketplaceScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requestedPropertyTypeId = searchParams.get("propertyType");

  const [purpose, setPurpose] = useState<"Buy" | "Rent">("Buy");
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<
    PropertyTypeRecord[]
  >([]);
  const [selectedPropertyType, setSelectedPropertyType] =
    useState<PropertyTypeRecord | null>(null);
  // `locationText` is purely the input's display value (updates on every
  // keystroke); `appliedLocation` is what actually drives the API filter and
  // is only set when a Places suggestion is picked or "use my current
  // location" resolves — mirrors homedot-mobile-app's searchText/location split.
  const [locationText, setLocationText] = useState("Kochi, Kerala");
  const [appliedLocation, setAppliedLocation] = useState<{
    address: string;
    city: string | null;
  } | null>(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const googleMapsRef = useRef<GoogleMapsNamespace | null>(null);
  const locationAutocompleteInitialized = useRef(false);
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [budget, setBudget] = useState("");
  const [sort, setSort] = useState<"recommended" | "low" | "high" | "area">(
    "recommended",
  );
  const [view, setView] = useState<"grid" | "list">("grid");
  const [saved, setSaved] = useState<string[]>([]);
  const [detail, setDetail] = useState<MarketplaceProperty | null>(null);
  const [detailSimilar, setDetailSimilar] = useState<
    MarketplaceProperty[] | null
  >(null);
  const detailRequestId = useRef(0);
  // Whether a shared "?property=<slug>" link is still being resolved on
  // first load (no `detail` yet to show, but the plain listing shouldn't
  // flash first either). Seeded lazily from the initial URL so it's already
  // correct on the very first render, instead of flipping true inside an effect.
  const [initialSlugLoading, setInitialSlugLoading] = useState(
    () => searchParams.get("property") !== null,
  );
  const initialSlugHandled = useRef(false);

  const [apiProperties, setApiProperties] =
    useState<MarketplaceProperty[]>(properties);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    MarketplaceScreenService.getPropertyTypes().then((res) => {
      if (res.success && res.data?.status)
        setPropertyTypeOptions(res.data.data);
    });
  }, []);

  // Binds Google Places Autocomplete to the hero location input, matching
  // homedot-mobile-app's location search (search box + "use my current
  // location"). The JS Places widget is used instead of the REST Autocomplete
  // API the mobile app calls directly, since that REST endpoint has no CORS
  // headers and can't be called from a browser.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript()
      .then((google) => {
        if (cancelled) return;
        googleMapsRef.current = google;
        if (locationAutocompleteInitialized.current || !locationInputRef.current) return;
        locationAutocompleteInitialized.current = true;

        const autocomplete = new google.maps.places.Autocomplete(locationInputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["formatted_address", "address_components"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.formatted_address) return;
          setLocationText(place.formatted_address);
          setAppliedLocation({
            address: place.formatted_address,
            city: cityFromAddressComponents(place.address_components),
          });
        });
      })
      .catch(() => {
        // Silently degrade to a plain text field — listings still load
        // without location search if Maps fails to load.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const locateCurrentPosition = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const google = googleMapsRef.current;
        if (!google) {
          setLocatingMe(false);
          return;
        }
        new google.maps.Geocoder().geocode(
          { location: { lat: coords.latitude, lng: coords.longitude } },
          (results, status) => {
            setLocatingMe(false);
            if (status === "OK" && results?.[0]) {
              setLocationText(results[0].formatted_address);
              setAppliedLocation({
                address: results[0].formatted_address,
                city: cityFromAddressComponents(results[0].address_components),
              });
            }
          },
        );
      },
      () => setLocatingMe(false),
    );
  };

  const clearLocation = () => {
    setLocationText("");
    setAppliedLocation(null);
  };

  // The Places widget only applies a location when a dropdown suggestion is
  // actually clicked/selected — typing a full address and hitting "Search"
  // (or Enter) without picking a suggestion leaves `appliedLocation` unset,
  // so the location filter silently never reaches the API. This geocodes
  // whatever's currently typed as a fallback so "Search" always works.
  const applyTypedLocation = () => {
    const query = locationText.trim();
    if (!query) {
      clearLocation();
      return;
    }
    if (appliedLocation?.address === query) return;
    const google = googleMapsRef.current;
    if (!google) return;
    new google.maps.Geocoder().geocode({ address: query }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setLocationText(results[0].formatted_address);
        setAppliedLocation({
          address: results[0].formatted_address,
          city: cityFromAddressComponents(results[0].address_components),
        });
      }
    });
  };

  // Sets the property type and clears Bedrooms/Bathrooms whenever the new
  // type hides them (office space, plots) — otherwise a stale "3 BHK"
  // selection silently zeroes out every result for a type that has no beds.
  const selectPropertyType = (next: PropertyTypeRecord | null) => {
    setSelectedPropertyType(next);
    if (hidesBedBath(next)) {
      setBeds("");
      setBaths("");
    }
  };

  // Pre-selects the property type passed in via ?propertyType=<id> (e.g. from
  // LandingScreen's "Browse by property category" cards) once the taxonomy
  // has loaded and a matching option can be resolved.
  useEffect(() => {
    const applyRequestedType = () => {
      if (!requestedPropertyTypeId || propertyTypeOptions.length === 0) return;
      const match = propertyTypeOptions.find(
        (t) => t._id === requestedPropertyTypeId,
      );
      if (match) selectPropertyType(match);
    };
    applyRequestedType();
  }, [requestedPropertyTypeId, propertyTypeOptions]);

  // "5+" has no exact BHK value server-side — the real API's enum tops out
  // at 4_PLUS_BHK (matches the mobile app's filter payload).
  const filterPayload = useMemo((): PropertiesFilterPayload => {
    const range = budget ? budgetRanges[budget] : undefined;
    const max = range?.[1];
    return {
      min: range?.[0] ?? null,
      max: max === undefined || max === Infinity ? null : max,
      address: appliedLocation?.address ?? null,
      featured: false,
      bedrooms: beds ? (beds === "5+" ? "4_PLUS_BHK" : `${beds}_BHK`) : null,
      bathrooms: baths ? parseInt(baths, 10) : null,
      cities: appliedLocation?.city ? [appliedLocation.city] : null,
      propertyType: selectedPropertyType?._id ?? null,
    };
  }, [budget, beds, baths, selectedPropertyType, appliedLocation]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const res = await MarketplaceScreenService.getPropertiesFilter(
        1,
        filterPayload,
        purpose,
      );
      if (cancelled) return;
      setLoading(false);
      // An empty `data` array (no page entry at all) means zero matches for
      // this search — must still clear stale results from a previous search,
      // not just leave them on screen.
      if (res.success && res.data?.status) {
        const result = res.data.data[0];
        setApiProperties(
          result ? result.data.map((r) => toMarketplaceProperty(r, purpose)) : [],
        );
        setPage(result?.currentPage ?? 1);
        setTotalPages(result?.totalPages ?? 1);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [filterPayload, purpose]);

  const loadMore = async () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    const res = await MarketplaceScreenService.getPropertiesFilter(
      page + 1,
      filterPayload,
      purpose,
    );
    setLoading(false);
    const result = res.data?.data?.[0];
    if (res.success && res.data?.status && result) {
      setApiProperties((prev) => [
        ...prev,
        ...result.data.map((r) => toMarketplaceProperty(r, purpose)),
      ]);
      setPage(result.currentPage);
      setTotalPages(result.totalPages);
    }
  };

  const toggleSave = (id: string) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const list = useMemo(() => {
    let out = apiProperties.filter((p) => p.purpose === purpose);
    // propertyType is already applied server-side via filterPayload; this is
    // just a client-side safety net for whatever page(s) are currently loaded.
    if (selectedPropertyType)
      out = out.filter((p) => p.category === selectedPropertyType.propertyType);
    if (beds)
      out = out.filter((p) =>
        beds === "5+" ? p.beds >= 5 : p.beds === parseInt(beds),
      );
    if (baths) out = out.filter((p) => p.baths >= parseInt(baths));
    if (budget && budgetRanges[budget]) {
      const [lo, hi] = budgetRanges[budget];
      out = out.filter((p) => {
        const v = parsePrice(p.price);
        return v >= lo && v < hi;
      });
    }
    if (sort === "low")
      out = [...out].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    if (sort === "high")
      out = [...out].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    if (sort === "area") out = [...out].sort((a, b) => b.area - a.area);
    return out;
  }, [apiProperties, purpose, selectedPropertyType, beds, baths, budget, sort]);

  const activeCount =
    (selectedPropertyType ? 1 : 0) +
    (appliedLocation ? 1 : 0) +
    (beds ? 1 : 0) +
    (baths ? 1 : 0) +
    (budget ? 1 : 0);
  const clearAll = () => {
    setSelectedPropertyType(null);
    clearLocation();
    setBeds("");
    setBaths("");
    setBudget("");
  };

  // Keeps the URL in sync with whichever property is open (or closed) —
  // this is what lets the Share button on the detail screen copy a link
  // that reopens the same property when pasted elsewhere. Only the
  // "property" param changes; any other query params (e.g. ?propertyType=)
  // are preserved. `scroll: false` since we already handle scroll ourselves.
  const setPropertyQueryParam = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("property", slug);
    else params.delete("property");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const openDetail = (p: MarketplaceProperty) => {
    setDetail(p);
    setDetailSimilar(null);
    window.scrollTo(0, 0);

    const slug = p.propertySlug;
    if (!slug) return;
    setPropertyQueryParam(slug);
    const requestId = ++detailRequestId.current;
    MarketplaceScreenService.getPropertyBySlug(slug).then((res) => {
      if (detailRequestId.current !== requestId) return; // superseded by a newer click
      const entry = res.data?.data?.[0];
      const record = entry?.propertyDetails?.[0];
      if (record) setDetail(toMarketplacePropertyDetail(record));
      if (entry?.similarProperties?.length) {
        setDetailSimilar(
          entry.similarProperties.map((r) => toMarketplaceProperty(r, p.purpose)),
        );
      }
    });
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailSimilar(null);
    window.scrollTo(0, 0);
    setPropertyQueryParam(null);
  };

  // Resolves a shared "?property=<slug>" link on first load — the normal
  // openDetail() flow above always starts from an already-known
  // MarketplaceProperty (the clicked card), but a pasted URL has only the
  // slug, so this fetches the detail record directly instead.
  useEffect(() => {
    if (initialSlugHandled.current) return;
    initialSlugHandled.current = true;
    const slug = searchParams.get("property");
    if (!slug) return;

    MarketplaceScreenService.getPropertyBySlug(slug).then((res) => {
      setInitialSlugLoading(false);
      const entry = res.data?.data?.[0];
      const record = entry?.propertyDetails?.[0];
      if (!record) return; // invalid/stale slug — falls through to the normal listing
      const full = toMarketplacePropertyDetail(record);
      setDetail(full);
      if (entry?.similarProperties?.length) {
        setDetailSimilar(
          entry.similarProperties.map((r) => toMarketplaceProperty(r, full.purpose)),
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const similar = useMemo(() => {
    if (!detail) return [];
    if (detailSimilar)
      return detailSimilar.filter((p) => p.id !== detail.id).slice(0, 3);
    const sameCat = apiProperties.filter(
      (p) => p.id !== detail.id && p.category === detail.category,
    );
    const fallback = apiProperties.filter((p) => p.id !== detail.id);
    return (sameCat.length >= 3 ? sameCat : fallback).slice(0, 3);
  }, [detail, detailSimilar, apiProperties]);

  return (
    <div
      style={{
        background: colors.bg,
        color: colors.ink,
        position: "relative",
        zIndex: 0,
      }}
    >
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />

      {detail ? (
        <PropertyDetail
          prop={detail}
          similar={similar}
          saved={saved}
          onSave={toggleSave}
          onBack={closeDetail}
          onOpen={openDetail}
        />
      ) : initialSlugLoading ? (
        <div
          style={{
            minHeight: "70vh",
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
            <Icon name="house" size={26} />
          </span>
          <p style={{ color: colors.muted, fontSize: fontSize.base }}>Loading property…</p>
        </div>
      ) : (
        <>
          {/* compact hero + search */}
          <section style={{ ...wrap, paddingTop: spacing.xl }}>
            <div
              style={{
                position: "relative",
                borderRadius: radius.lg,
                overflow: "hidden",
                height: "clamp(180px, 22vw, 260px)",
                boxShadow: shadow.md,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80"
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(95deg, ${colors.primary} 0%, rgba(16,28,48,0.45) 55%, transparent 80%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "clamp(22px, 3.5vw, 44px)",
                  bottom: "clamp(20px, 3vw, 34px)",
                  color: colors.white,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: fontSize.sm,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  <span>Home</span>
                  <Icon name="arrow" size={13} />
                  <span style={{ color: colors.white }}>Marketplace</span>
                </div>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(24px, 3.4vw, 40px)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    marginTop: spacing.sm + 2,
                  }}
                >
                  Find an exclusive property for you
                </h1>
              </div>
            </div>

            {/* search bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.sm + 2,
                background: colors.card,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.lg,
                padding: spacing.sm + 2,
                margin: "-30px auto 0",
                position: "relative",
                zIndex: 2,
                width: "calc(100% - 40px)",
                boxShadow: shadow.lg,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  background: "#EFEFF2",
                  borderRadius: 12,
                  padding: 4,
                  flexShrink: 0,
                }}
              >
                {(["Buy", "Rent"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setPurpose(o)}
                    style={{
                      fontSize: fontSize.sm + 0.5,
                      fontWeight: 600,
                      padding: "9px 15px",
                      borderRadius: 9,
                      color: purpose === o ? colors.primary : colors.muted,
                      background: purpose === o ? colors.white : "transparent",
                      boxShadow: purpose === o ? shadow.sm : "none",
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  height: 50,
                  border: `1.5px solid ${colors.line}`,
                  borderRadius: 12,
                  padding: "0 14px",
                  color: colors.muted,
                  flex: "1.4 1 200px",
                  minWidth: 200,
                }}
              >
                <Icon name="location" size={18} />
                <input
                  ref={locationInputRef}
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    // Deferred so a Places suggestion the widget itself
                    // resolves on Enter (place_changed) applies first.
                    setTimeout(applyTypedLocation, 0);
                  }}
                  placeholder="Search city, locality or project"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "none",
                    width: "100%",
                    fontSize: fontSize.base - 0.5,
                    color: colors.ink,
                  }}
                />
                {appliedLocation ? (
                  <button
                    type="button"
                    onClick={clearLocation}
                    aria-label="Clear location"
                    style={{ display: "flex", flexShrink: 0, color: colors.muted }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={locateCurrentPosition}
                    disabled={locatingMe}
                    aria-label="Use my current location"
                    style={{
                      display: "flex",
                      flexShrink: 0,
                      color: colors.primary,
                      opacity: locatingMe ? 0.5 : 1,
                    }}
                  >
                    <Icon name="compass" size={17} />
                  </button>
                )}
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  height: 50,
                  border: `1.5px solid ${colors.line}`,
                  borderRadius: 12,
                  padding: "0 14px",
                  color: colors.muted,
                  flexShrink: 0,
                }}
              >
                <Icon name="house" size={18} />
                <select
                  value={selectedPropertyType?._id ?? ""}
                  onChange={(e) =>
                    selectPropertyType(
                      propertyTypeOptions.find(
                        (t) => t._id === e.target.value,
                      ) ?? null,
                    )
                  }
                  style={{
                    border: "none",
                    outline: "none",
                    background: "none",
                    fontSize: fontSize.base - 0.5,
                    color: colors.ink,
                  }}
                >
                  <option value="">All property types</option>
                  {propertyTypeOptions.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.propertyType}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* listings */}
          <section style={{ ...wrap, paddingTop: spacing.xxl + 6 }}>
            <div
              className="grid grid-cols-1 lg:grid-cols-[262px_1fr]"
              style={{ gap: spacing.xxl, alignItems: "start" }}
            >
              {/* filter sidebar */}
              <aside
                className="hidden lg:block"
                style={{
                  position: "sticky",
                  top: 90,
                  background: colors.card,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radius.md,
                  padding: `4px ${spacing.lg}px ${spacing.md}px`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 0 4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: fontSize.sm,
                      fontWeight: 600,
                      color: colors.muted,
                    }}
                  >
                    {activeCount > 0
                      ? `${activeCount} active`
                      : "All properties"}
                  </span>
                  {activeCount > 0 && (
                    <button
                      onClick={clearAll}
                      style={{
                        fontSize: fontSize.sm,
                        fontWeight: 600,
                        color: colors.accent,
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <FilterGroup title="Property type">
                  {propertyTypeOptions.map((t) => (
                    <RadioRow
                      key={t._id}
                      label={
                        t.propertyCount != null
                          ? `${t.propertyType} (${t.propertyCount})`
                          : t.propertyType
                      }
                      checked={selectedPropertyType?._id === t._id}
                      onChange={() =>
                        selectPropertyType(
                          selectedPropertyType?._id === t._id ? null : t,
                        )
                      }
                    />
                  ))}
                </FilterGroup>

                <FilterGroup title="Budget" last={hidesBedBath(selectedPropertyType)}>
                  {priceOptions.map((b) => (
                    <RadioRow
                      key={b}
                      label={b}
                      checked={budget === b}
                      onChange={() => setBudget(budget === b ? "" : b)}
                    />
                  ))}
                </FilterGroup>

                {!hidesBedBath(selectedPropertyType) && (
                  <>
                    <FilterGroup title="Bedrooms">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {bedOptions.map((b) => (
                          <SegPill
                            key={b}
                            label={`${b} BHK`}
                            active={beds === b}
                            onClick={() => setBeds(beds === b ? "" : b)}
                          />
                        ))}
                      </div>
                    </FilterGroup>

                    <FilterGroup title="Bathrooms" last>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {bathOptions.map((b) => (
                          <SegPill
                            key={b}
                            label={`${b}+`}
                            active={baths === b}
                            onClick={() => setBaths(baths === b ? "" : b)}
                          />
                        ))}
                      </div>
                    </FilterGroup>
                  </>
                )}
              </aside>

              {/* results */}
              <main>
                <div style={{ marginBottom: spacing.lg }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(20px, 2.4vw, 28px)",
                      fontWeight: 600,
                    }}
                  >
                    Properties for {purpose === "Rent" ? "rent" : "sale"} in
                    Kochi
                  </h2>
                  <p
                    style={{
                      color: colors.muted,
                      fontSize: fontSize.base,
                      marginTop: 5,
                    }}
                  >
                    {list.length}{" "}
                    {list.length === 1 ? "property" : "properties"} found ·
                    updated today
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing.lg,
                    gap: spacing.md,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className="lg:hidden"
                    style={{
                      fontSize: fontSize.sm,
                      fontWeight: 600,
                      color: colors.muted,
                    }}
                  >
                    {activeCount > 0
                      ? `${activeCount} filters active`
                      : "All properties"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing.md,
                      marginLeft: "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        background: colors.card,
                        border: `1px solid ${colors.line}`,
                        borderRadius: 10,
                        padding: 3,
                      }}
                    >
                      {(["grid", "list"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          aria-label={v}
                          style={{
                            width: 34,
                            height: 30,
                            borderRadius: 7,
                            display: "grid",
                            placeItems: "center",
                            color: view === v ? colors.primary : colors.muted,
                            background:
                              view === v ? colors.primarySoft : "transparent",
                          }}
                        >
                          <Icon
                            name={v === "grid" ? "grid" : "menu"}
                            size={17}
                          />
                        </button>
                      ))}
                    </div>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: fontSize.sm,
                        color: colors.muted,
                        border: `1px solid ${colors.line}`,
                        borderRadius: 10,
                        padding: "9px 12px",
                        background: colors.card,
                      }}
                    >
                      Sort:
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as typeof sort)}
                        style={{
                          border: "none",
                          outline: "none",
                          background: "none",
                          fontWeight: 600,
                          color: colors.ink,
                        }}
                      >
                        <option value="recommended">Recommended</option>
                        <option value="low">Price: low to high</option>
                        <option value="high">Price: high to low</option>
                        <option value="area">Largest area</option>
                      </select>
                    </label>
                  </div>
                </div>

                {activeCount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: spacing.lg,
                    }}
                  >
                    {selectedPropertyType && (
                      <Chip
                        label={selectedPropertyType.propertyType}
                        onRemove={() => setSelectedPropertyType(null)}
                      />
                    )}
                    {appliedLocation && (
                      <Chip
                        label={appliedLocation.city || appliedLocation.address}
                        onRemove={clearLocation}
                      />
                    )}
                    {beds && (
                      <Chip
                        label={`${beds} BHK`}
                        onRemove={() => setBeds("")}
                      />
                    )}
                    {baths && (
                      <Chip
                        label={`${baths}+ Bath`}
                        onRemove={() => setBaths("")}
                      />
                    )}
                    {budget && (
                      <Chip label={budget} onRemove={() => setBudget("")} />
                    )}
                    <button
                      onClick={clearAll}
                      style={{
                        fontSize: fontSize.xs + 0.5,
                        fontWeight: 600,
                        color: colors.accent,
                        textDecoration: "underline",
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {list.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      border: `1px dashed ${colors.line}`,
                      borderRadius: radius.lg,
                      background: colors.card,
                    }}
                  >
                    <span
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: colors.primarySoft,
                        color: colors.primary,
                        display: "grid",
                        placeItems: "center",
                        margin: "0 auto 16px",
                      }}
                    >
                      <Icon name="search" size={26} />
                    </span>
                    <h3 style={{ fontSize: fontSize.lg, marginBottom: 8 }}>
                      No properties match your filters
                    </h3>
                    <p
                      style={{ color: colors.muted, marginBottom: spacing.lg }}
                    >
                      Try widening your budget or removing a filter.
                    </p>
                    <Button variant="outline" onClick={clearAll}>
                      Clear all filters
                    </Button>
                  </div>
                ) : (
                  <>
                    {view === "grid" ? (
                      <Reveal
                        stagger
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                        style={{ gap: spacing.xl }}
                      >
                        {list.map((p) => (
                          <PropertyCard
                            key={p.id}
                            property={p}
                            saved={saved.includes(p.id)}
                            onSave={toggleSave}
                            onOpen={() => openDetail(p)}
                          />
                        ))}
                      </Reveal>
                    ) : (
                      <Reveal
                        stagger
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: spacing.lg,
                        }}
                      >
                        {list.map((p) => (
                          <PropertyRow
                            key={p.id}
                            property={p}
                            saved={saved.includes(p.id)}
                            onSave={toggleSave}
                            onOpen={() => openDetail(p)}
                          />
                        ))}
                      </Reveal>
                    )}

                    {page < totalPages && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginTop: spacing.xxl,
                        }}
                      >
                        <Button variant="outline" size="lg" onClick={loadMore}>
                          {loading ? "Loading…" : "Load more properties"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </main>
            </div>
          </section>
        </>
      )}

      <SiteFooter />
    </div>
  );
}

function FilterGroup({
  title,
  children,
  last,
}: {
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: last ? "none" : `1px solid ${colors.line}`,
      }}
    >
      <h4
        style={{
          fontSize: fontSize.sm + 0.5,
          fontWeight: 700,
          marginBottom: spacing.sm + 2,
        }}
      >
        {title}
      </h4>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm + 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function RadioRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: fontSize.base - 1,
        color: colors.ink2,
        cursor: "pointer",
      }}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      <span
        style={{
          width: 19,
          height: 19,
          borderRadius: "50%",
          border: `${checked ? 5.5 : 1.5}px solid ${checked ? colors.primary : colors.line}`,
          flexShrink: 0,
        }}
      />
      {label}
    </label>
  );
}

function SegPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: fontSize.xs + 1,
        fontWeight: 600,
        color: active ? colors.white : colors.ink2,
        background: active ? colors.primary : colors.card,
        border: `1.5px solid ${active ? colors.primary : colors.line}`,
        padding: "8px 13px",
        borderRadius: 10,
      }}
    >
      {label}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: fontSize.xs + 0.5,
        fontWeight: 600,
        color: colors.ink2,
        background: colors.primarySoft,
        padding: "7px 12px",
        borderRadius: radius.full,
      }}
    >
      {label} <Icon name="close" size={13} />
    </button>
  );
}

function PropertyRow({
  property,
  saved,
  onSave,
  onOpen,
}: {
  property: MarketplaceProperty;
  saved: boolean;
  onSave: (id: string) => void;
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="grid grid-cols-1 sm:grid-cols-[280px_1fr]"
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: shadow.sm,
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 200,
          background: colors.primarySoft,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.img}
          alt={property.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span
          style={{
            position: "absolute",
            left: spacing.md,
            top: spacing.md,
            background: colors.primary,
            color: colors.white,
            fontSize: fontSize.xs,
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: radius.full,
          }}
        >
          {property.status}
        </span>
      </div>
      <div
        style={{
          padding: spacing.lg + 2,
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm + 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <div>
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
              {property.category}
            </span>
            <h3
              style={{
                fontSize: fontSize.lg - 1,
                fontWeight: 700,
                margin: "8px 0 4px",
                lineHeight: 1.3,
              }}
            >
              {property.title}
            </h3>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: fontSize.sm,
                color: colors.muted,
              }}
            >
              <Icon name="location" size={15} /> {property.location},{" "}
              {property.city}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(property.id);
            }}
            aria-label="Save"
            style={{ color: saved ? "#E5484D" : colors.muted, flexShrink: 0 }}
          >
            <Icon name="heart" size={19} filled={saved} />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            color: colors.ink2,
            fontSize: 13.5,
          }}
        >
          {property.beds > 0 && <span>{property.beds} Beds</span>}
          {property.baths > 0 && <span>{property.baths} Baths</span>}
          <span>
            {property.area.toLocaleString()} {property.areaUnit ?? "sqft"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <b
            style={{
              fontFamily: "var(--font-display)",
              fontSize: fontSize.xl,
              fontWeight: 700,
              color: colors.price,
            }}
          >
            {property.price}
          </b>
          <button
            style={{
              background: colors.primary,
              color: colors.white,
              fontWeight: 600,
              fontSize: 13.5,
              padding: "10px 16px",
              borderRadius: 10,
            }}
          >
            View Detail
          </button>
        </div>
      </div>
    </article>
  );
}
