import { colors } from "@/constants/colors";

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.04c-.03-3.09 2.52-4.57 2.64-4.64-1.44-2.11-3.68-2.4-4.48-2.43-1.91-.19-3.72 1.12-4.69 1.12-.96 0-2.45-1.09-4.03-1.06-2.07.03-3.98 1.2-5.05 3.06-2.15 3.73-.55 9.25 1.55 12.28 1.03 1.48 2.25 3.14 3.86 3.08 1.55-.06 2.13-1 4-1 1.86 0 2.4 1 4.03.97 1.66-.03 2.72-1.51 3.74-3 1.18-1.72 1.66-3.38 1.69-3.47-.04-.02-3.24-1.25-3.27-4.91M14.13 3.5c.85-1.04 1.43-2.48 1.27-3.92-1.23.05-2.72.82-3.6 1.85-.79.92-1.49 2.39-1.3 3.8 1.37.11 2.78-.7 3.63-1.73" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <polygon points="4,2.5 4,21.5 13,12" fill="#00C3FF" />
      <polygon points="4,2.5 13,12 17.6,9.35" fill="#00E676" />
      <polygon points="4,21.5 13,12 17.6,14.65" fill="#FF3D5A" />
      <polygon points="13,12 17.6,9.35 20.6,12 17.6,14.65" fill="#FFC500" />
    </svg>
  );
}

export default function StoreButtons({ size = "md" }: { size?: "sm" | "md" }) {
  const small = size === "sm";
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <button
        aria-label="Download on the App Store"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: small ? 9 : 11,
          background: "#000",
          color: colors.white,
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: small ? 11 : 13,
          padding: small ? "7px 14px" : "9px 18px 9px 16px",
        }}
      >
        <span style={{ display: "grid", placeItems: "center", width: small ? 20 : 24, flexShrink: 0 }}>
          <AppleGlyph />
        </span>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.12, textAlign: "left" }}>
          <em style={{ fontStyle: "normal", fontSize: 10.5, letterSpacing: "0.02em", opacity: 0.85, textTransform: "uppercase" }}>Download on the</em>
          <b style={{ fontFamily: "var(--font-display)", fontSize: small ? 15 : 17, fontWeight: 600, letterSpacing: "-0.02em" }}>App Store</b>
        </span>
      </button>
      <button
        aria-label="Get it on Google Play"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: small ? 9 : 11,
          background: "#000",
          color: colors.white,
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: small ? 11 : 13,
          padding: small ? "7px 14px" : "9px 18px 9px 16px",
        }}
      >
        <span style={{ display: "grid", placeItems: "center", width: small ? 20 : 24, flexShrink: 0 }}>
          <PlayGlyph />
        </span>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.12, textAlign: "left" }}>
          <em style={{ fontStyle: "normal", fontSize: 10.5, letterSpacing: "0.02em", opacity: 0.85, textTransform: "uppercase" }}>Get it on</em>
          <b style={{ fontFamily: "var(--font-display)", fontSize: small ? 15 : 17, fontWeight: 600, letterSpacing: "-0.02em" }}>Google Play</b>
        </span>
      </button>
    </div>
  );
}
