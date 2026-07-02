export const colors = {
  primary: "#101C30",
  primaryDeep: "#0A1422",
  primarySoft: "#E9ECF2",
  accent: "#2997FF",
  bg: "#F5F5F7",
  card: "#FFFFFF",
  ink: "#1D1D1F",
  ink2: "#424245",
  muted: "#6E6E73",
  line: "#D7D9DE",
  gold: "#F5A623",
  goldDeep: "#E08E12",
  price: "#0E7C8A",
  white: "#FFFFFF",
  overlay: "rgba(16, 28, 48, 0.55)",
} as const;

export type ColorToken = keyof typeof colors;
