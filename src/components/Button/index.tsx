import { CSSProperties, ReactNode } from "react";
import { colors } from "@/constants/colors";
import { radius, fontSize } from "@/utils/size";

type Variant = "primary" | "outline" | "ghost" | "dark" | "light";
type Size = "sm" | "md" | "lg";

const VARIANT_STYLE: Record<Variant, CSSProperties> = {
  primary: { background: colors.primary, color: colors.white },
  dark: { background: colors.ink, color: colors.white },
  light: { background: colors.white, color: colors.primary },
  outline: { background: colors.white, color: colors.ink, boxShadow: `inset 0 0 0 1.5px ${colors.line}` },
  ghost: { background: "transparent", color: colors.ink2 },
};

const SIZE_STYLE: Record<Size, CSSProperties> = {
  sm: { padding: "9px 16px", fontSize: fontSize.xs },
  md: { padding: "12px 20px", fontSize: fontSize.sm },
  lg: { padding: "15px 26px", fontSize: fontSize.md },
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  full,
  onClick,
  type = "button",
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  full?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontWeight: 600,
        borderRadius: radius.full,
        whiteSpace: "nowrap",
        width: full ? "100%" : undefined,
        transition: "transform .12s ease, filter .15s ease",
        ...VARIANT_STYLE[variant],
        ...SIZE_STYLE[size],
      }}
    >
      {icon}
      {children}
    </button>
  );
}
