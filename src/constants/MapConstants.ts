// `||` (not `??`) on purpose — beta's build environment has
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY set to an empty string rather than left
// unset, and `??` only falls back on null/undefined, so it would pass that
// empty string straight through and load the Maps script with no key at all.
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const DEFAULT_MAP_CENTER = { lat: 9.9312, lng: 76.2673 };
