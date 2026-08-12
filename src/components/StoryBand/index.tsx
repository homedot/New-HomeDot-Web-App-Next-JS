"use client";

import type { ReactNode } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon, { type IconName } from "@/components/Icon";
import Button from "@/components/Button";
import Reveal from "@/components/Reveal";

export default function StoryBand({
  image,
  eyebrow,
  eyebrowIcon = "sparkle",
  heading,
  description,
  promiseHeading,
  promiseDescription,
  checklist,
  stats,
  ctaLabel,
  onCta,
}: {
  image: string;
  eyebrow: string;
  eyebrowIcon?: IconName;
  heading: ReactNode;
  description: string;
  promiseHeading: string;
  promiseDescription: string;
  checklist: string[];
  stats: { value: string; label: string }[];
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: colors.primary,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(10,20,34,0.34) 0%, rgba(10,20,34,0.58) 26%, ${colors.primary} 56%, ${colors.primary} 100%), radial-gradient(65% 40% at 50% 12%, rgba(41,151,255,0.2), transparent 68%)`,
        }}
      />
      {/* Feathers the hard seam where the page's light background (colors.bg)
          meets this section's photo — without it the cut from the listing
          grid straight into a photo reads as a jarring stop rather than a
          continued scroll. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "clamp(70px, 9vw, 130px)",
          background: `linear-gradient(180deg, ${colors.bg} 0%, rgba(245,245,247,0) 100%)`,
        }}
      />
      <div
        className="animate-glow-pulse"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "46%",
          right: "-10%",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(41,151,255,0.3), transparent 65%)",
          filter: "blur(30px)",
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          padding: `${spacing.huge + 20}px ${spacing.xl}px ${spacing.huge}px`,
        }}
      >
        <Reveal
          style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}
        >
          <Badge icon={eyebrowIcon} label={eyebrow} />
          <h2
            style={{
              color: colors.white,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px, 5vw, 56px)",
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              margin: `${spacing.lg}px 0 ${spacing.md}px`,
            }}
          >
            {heading}
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: fontSize.md + 1,
              lineHeight: 1.6,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            {description}
          </p>
        </Reveal>

        <Reveal
          className="grid grid-cols-1 lg:grid-cols-2"
          style={{
            marginTop: "clamp(56px, 9vw, 112px)",
            gap: spacing.xxl,
            alignItems: "center",
          }}
        >
          <div>
            <Badge icon="shield" label="The HomeDot promise" />
            <h2
              style={{
                color: colors.white,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 3vw, 34px)",
                fontWeight: 600,
                margin: `${spacing.lg}px 0 ${spacing.md}px`,
              }}
            >
              {promiseHeading}
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.82)",
                fontSize: fontSize.md,
                lineHeight: 1.6,
                maxWidth: 460,
              }}
            >
              {promiseDescription}
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.sm + 2,
                margin: `${spacing.xxl}px 0`,
              }}
            >
              {checklist.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: spacing.sm + 2,
                    color: colors.white,
                    fontWeight: 500,
                    fontSize: fontSize.md - 1,
                  }}
                >
                  <Icon name="check" size={18} color={colors.accent} /> {t}
                </span>
              ))}
            </div>
            <Button
              variant="light"
              size="lg"
              icon={<Icon name="arrow" size={18} />}
              onClick={onCta}
            >
              {ctaLabel}
            </Button>
          </div>

          <div
            style={{
              borderRadius: radius.md,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              padding: "clamp(28px, 4vw, 40px)",
              display: "flex",
              flexDirection: "column",
              gap: spacing.xl,
            }}
          >
            {stats.map((stat, i, arr) => (
              <div
                key={stat.value + stat.label}
                style={{
                  paddingBottom: i < arr.length - 1 ? spacing.xl : 0,
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "none",
                }}
              >
                <b
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(30px, 4vw, 40px)",
                    fontWeight: 600,
                    color: colors.white,
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </b>
                <span
                  style={{
                    display: "block",
                    marginTop: spacing.sm,
                    color: "rgba(255,255,255,0.72)",
                    fontSize: fontSize.md - 1,
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Badge({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: fontSize.sm,
        fontWeight: 600,
        color: colors.white,
        background: "rgba(255,255,255,0.16)",
        padding: "6px 13px",
        borderRadius: radius.full,
      }}
    >
      <Icon
        name={icon}
        size={15}
        filled={icon === "sparkle"}
        color={colors.white}
      />{" "}
      {label}
    </span>
  );
}
