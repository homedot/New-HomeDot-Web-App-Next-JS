import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";

export type UserRole = "user" | "professional";

const OPTIONS: {
  role: UserRole;
  icon: "house" | "hardhat";
  title: string;
  subtitle: string;
}[] = [
  {
    role: "user",
    icon: "house",
    title: "I'm a Homeowner",
    subtitle: "Browse properties & hire professionals",
  },
  {
    role: "professional",
    icon: "hardhat",
    title: "I'm a Professional",
    subtitle: "List your services & get leads",
  },
];

export default function RoleStep({
  onSelect,
}: {
  onSelect: (role: UserRole) => void;
}) {
  return (
    <div className="login-step">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          letterSpacing: "-0.02em",
          marginBottom: spacing.sm,
        }}
      >
        Welcome to HomeDot
      </h1>
      <p
        style={{
          fontSize: fontSize.base,
          color: colors.muted,
          lineHeight: 1.5,
          marginBottom: spacing.xl - 2,
        }}
      >
        Tell us how you&apos;d like to use HomeDot.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.md,
        }}
      >
        {OPTIONS.map((o) => (
          <button
            key={o.role}
            onClick={() => onSelect(o.role)}
            className="card-hover"
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.lg - 1,
              border: `1.5px solid ${colors.line}`,
              borderRadius: radius.md,
              padding: "18px 20px",
              textAlign: "left",
              background: colors.white,
              boxShadow: shadow.sm,
            }}
          >
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: colors.primarySoft,
                color: colors.primary,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={o.icon} size={26} strokeWidth={2} />
            </span>
            <span style={{ flex: 1 }}>
              <b
                style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontSize: fontSize.lg,
                  fontWeight: 700,
                }}
              >
                {o.title}
              </b>
              <em
                style={{
                  fontStyle: "normal",
                  fontSize: fontSize.sm,
                  color: colors.muted,
                }}
              >
                {o.subtitle}
              </em>
            </span>
            <Icon name="arrow" size={18} color={colors.muted} />
          </button>
        ))}
      </div>
    </div>
  );
}
