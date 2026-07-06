import { colors } from "@/constants/colors";
import { fontSize } from "@/utils/size";

export default function Brand({ light }: { light?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: fontSize.xl,
        letterSpacing: "-0.03em",
        color: light ? colors.white : colors.ink,
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: colors.accent,
          marginRight: 8,
          boxShadow: "0 0 0 4px rgba(41,151,255,0.22)",
        }}
      />
      Home
      <span style={{ color: light ? colors.white : colors.primary }}>Dot</span>
    </span>
  );
}
