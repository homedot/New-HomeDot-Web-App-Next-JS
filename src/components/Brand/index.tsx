import { colors } from "@/constants/colors";
import { fontSize } from "@/utils/size";

export default function Brand({ light }: { light?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-logo)",
        // fontWeight: 700,
        fontSize: 40,
        letterSpacing: "-0.03em",
        color: "#00BFFF",
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      HOME.
    </span>
  );
}
