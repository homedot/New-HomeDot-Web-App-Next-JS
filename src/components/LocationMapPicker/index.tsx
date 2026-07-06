"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { DEFAULT_MAP_CENTER } from "@/constants/MapConstants";
import { radius, fontSize, spacing } from "@/utils/size";
import Icon from "@/components/Icon";
import {
  loadGoogleMapsScript,
  type GoogleMapsNamespace,
} from "@/utils/loadGoogleMapsScript";

export interface LocationValue {
  address: string;
  lat: number;
  lng: number;
}

/** Search box + draggable-marker map for picking a location. Selecting a
 * place, dragging the marker, or clicking the map all resolve to an
 * address via reverse geocoding. */
export default function LocationMapPicker({
  value,
  onChange,
  height = 220,
}: {
  value?: LocationValue | null;
  onChange: (loc: LocationValue) => void;
  height?: number;
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const googleRef = useRef<GoogleMapsNamespace | null>(null);
  const initialized = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState(value?.address ?? "");

  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript()
      .then((google) => {
        if (cancelled) return;
        googleRef.current = google;
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load Google Maps");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded || initialized.current) return;
    const google = googleRef.current;
    if (!google || !mapDivRef.current) return;
    initialized.current = true;

    const center = value ? { lat: value.lat, lng: value.lng } : DEFAULT_MAP_CENTER;

    const map = new google.maps.Map(mapDivRef.current, {
      center,
      zoom: 13,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
    });

    const marker = new google.maps.Marker({
      position: center,
      map,
      draggable: true,
    });

    const geocoder = new google.maps.Geocoder();

    const applyLocation = (lat: number, lng: number, knownAddress?: string) => {
      marker.setPosition({ lat, lng });
      if (knownAddress) {
        setAddress(knownAddress);
        onChange({ address: knownAddress, lat, lng });
        return;
      }
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        const resolved = status === "OK" && results?.[0]?.formatted_address
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddress(resolved);
        onChange({ address: resolved, lat, lng });
      });
    };

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) applyLocation(pos.lat(), pos.lng());
    });

    const mapEvented = map as unknown as {
      addListener: (event: string, handler: (e: { latLng: { lat: () => number; lng: () => number } }) => void) => void;
    };
    mapEvented.addListener("click", (e) => applyLocation(e.latLng.lat(), e.latLng.lng()));

    if (inputRef.current) {
      const bounds = new google.maps.LatLngBounds(
        { lat: DEFAULT_MAP_CENTER.lat - 0.6, lng: DEFAULT_MAP_CENTER.lng - 0.6 },
        { lat: DEFAULT_MAP_CENTER.lat + 0.6, lng: DEFAULT_MAP_CENTER.lng + 0.6 },
      );
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "in" },
        fields: ["formatted_address", "geometry"],
      });
      autocomplete.setBounds(bounds);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const loc = place.geometry?.location;
        if (!loc) return;
        const lat = loc.lat();
        const lng = loc.lng();
        (map as unknown as { panTo: (pos: { lat: number; lng: number }) => void }).panTo({ lat, lng });
        applyLocation(lat, lng, place.formatted_address);
      });
    }
  }, [loaded, value, onChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm + 2,
          height: 50,
          border: `1.5px solid ${colors.line}`,
          borderRadius: radius.md,
          padding: "0 14px",
          background: colors.white,
        }}
      >
        <Icon name="search" size={17} color={colors.muted} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for your location"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            background: "none",
            width: "100%",
            fontSize: fontSize.base,
            color: colors.ink,
          }}
        />
      </div>
      <div
        ref={mapDivRef}
        style={{
          width: "100%",
          height,
          borderRadius: radius.md,
          overflow: "hidden",
          background: colors.bg,
          border: `1px solid ${colors.line}`,
        }}
      />
      {error && (
        <p style={{ fontSize: fontSize.xs, color: "#C0392B" }}>{error}</p>
      )}
    </div>
  );
}
