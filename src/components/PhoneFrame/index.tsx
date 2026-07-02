import Image, { StaticImageData } from "next/image";
import { colors } from "@/constants/colors";

export default function PhoneFrame({
  src,
  alt,
  width = 300,
  className,
}: {
  src: StaticImageData;
  alt: string;
  width?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width,
        background: "#0b0f17",
        borderRadius: 42,
        padding: 8,
        overflow: "hidden",
        boxShadow: `0 0 0 2px rgba(255,255,255,0.05), 0 0 0 7px rgba(11,15,23,0.55), ${"0 30px 60px -22px rgba(16,28,48,0.26), 0 10px 24px -12px rgba(16,28,48,0.12)"}`,
      }}
    >
      <Image
        src={src}
        alt={alt}
        style={{ width: "100%", height: "auto", display: "block", borderRadius: 34 }}
        placeholder="blur"
      />
    </div>
  );
}

export function PhoneChip({
  icon,
  title,
  subtitle,
  tone = "accent",
  style,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone?: "accent" | "green";
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px)",
        borderRadius: 14,
        padding: "10px 13px",
        color: colors.white,
        boxShadow: "0 30px 60px -22px rgba(16,28,48,0.26), 0 10px 24px -12px rgba(16,28,48,0.12)",
        whiteSpace: "nowrap",
        zIndex: 4,
        ...style,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          background: tone === "accent" ? colors.accent : "linear-gradient(135deg, #34A853, #1f8a5b)",
        }}
      >
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column" }}>
        <b style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.15 }}>{title}</b>
        <em style={{ fontStyle: "normal", fontSize: 11, color: "rgba(255,255,255,0.72)" }}>{subtitle}</em>
      </span>
    </div>
  );
}
