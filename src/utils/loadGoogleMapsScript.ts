import { GOOGLE_MAPS_API_KEY } from "@/constants/MapConstants";

// No @types/google.maps dependency — this app only touches a handful of
// Maps/Places APIs, so callers work against this minimal shape instead.
export interface GoogleMapsMarker {
  setPosition: (pos: { lat: number; lng: number }) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null;
  addListener: (event: string, handler: () => void) => void;
}

export interface GoogleMapsAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleMapsGeocodeResult {
  formatted_address: string;
  address_components: GoogleMapsAddressComponent[];
  geometry: { location: { lat: () => number; lng: () => number } };
}

export interface GoogleMapsPlacePrediction {
  place_id: string;
  description: string;
}

export interface GoogleMapsNamespace {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
    Marker: new (opts: Record<string, unknown>) => GoogleMapsMarker;
    Geocoder: new () => {
      geocode: (
        request:
          | { location: { lat: number; lng: number } }
          | { placeId: string }
          | { address: string },
        callback: (
          results: GoogleMapsGeocodeResult[] | null,
          status: string,
        ) => void,
      ) => void;
    };
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        opts?: Record<string, unknown>,
      ) => {
        addListener: (event: string, handler: () => void) => void;
        getPlace: () => {
          formatted_address?: string;
          address_components?: GoogleMapsAddressComponent[];
          geometry?: { location: { lat: () => number; lng: () => number } };
        };
        setBounds: (bounds: unknown) => void;
      };
      // Data-only — no UI, unlike Autocomplete above. Lets callers render
      // their own styled suggestion dropdown instead of Google's own
      // "pac-container" popup (which can't be restyled to match the app).
      AutocompleteService: new () => {
        getPlacePredictions: (
          request: { input: string; componentRestrictions?: { country: string } },
          callback: (predictions: GoogleMapsPlacePrediction[] | null, status: string) => void,
        ) => void;
      };
    };
    LatLngBounds: new (
      sw: { lat: number; lng: number },
      ne: { lat: number; lng: number },
    ) => unknown;
    event: { clearInstanceListeners: (instance: unknown) => void };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
  }
}

let scriptPromise: Promise<GoogleMapsNamespace> | null = null;

export function loadGoogleMapsScript(): Promise<GoogleMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () =>
        window.google?.maps ? resolve(window.google) : reject(new Error("Google Maps failed to load")),
      );
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () =>
      window.google?.maps ? resolve(window.google) : reject(new Error("Google Maps failed to load"));
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}
