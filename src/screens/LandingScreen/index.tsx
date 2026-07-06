import type { CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow, maxWidth } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import PropertyCard from "@/components/PropertyCard";
import ProCard from "@/components/ProCard";
import PhoneFrame, { PhoneChip } from "@/components/PhoneFrame";
import StoreButtons from "@/components/StoreButtons";
import Cursor from "@/components/Cursor";
import AmbientBackground from "@/components/AmbientBackground";
import HeroScene from "@/components/HeroScene";
import Reveal from "@/components/Reveal";
import ScrollProgress from "@/components/ScrollProgress";
import ScrollScrub from "@/components/ScrollScrub";
import ScrollPin from "@/components/ScrollPin";
import Parallax from "@/components/Parallax";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import appHomeImg from "@/assets/images/app-home.png";
import {
  categories,
  homeServices,
  properties,
  professionals,
  steps,
  trustImage,
  exploreImage,
  blogPosts,
  testimonials,
} from "./data";

const wrap: CSSProperties = {
  maxWidth,
  margin: "0 auto",
  padding: `0 ${spacing.xl}px`,
};

export default function LandingScreen() {
  return (
    <div
      style={{
        background: colors.bg,
        color: colors.ink,
        position: "relative",
        zIndex: 0,
      }}
    >
      <AmbientBackground />
      <ScrollProgress />
      <Cursor />
      <SiteNav />
      <Hero />
      <MarqueeStrip />
      <FeaturedProperties />
      <Categories />
      <HouseholdServices />
      <TopProfessionals />
      <HowItWorks />
      <ExploreScroll />
      <TrustBanner />
      <AppPromo />
      <ProCta />
      <LatestInsights />
      <Testimonials />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: colors.primary,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 90% at 85% 10%, ${colors.primaryDeep} 0%, transparent 55%), radial-gradient(80% 70% at 10% 100%, rgba(41,151,255,0.3) 0%, transparent 50%)`,
        }}
      />
      <HeroScene />
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_340px]"
        style={{
          ...wrap,
          position: "relative",
          padding: `${spacing.huge + 20}px ${spacing.xl}px ${spacing.huge}px`,
          alignItems: "center",
          gap: spacing.xxl,
        }}
      >
        <div>
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
            <Icon name="shield" size={15} /> Verified homes, villas &amp; plots
            across Kerala
          </span>

          <h1
            style={{
              color: colors.white,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 6vw, 68px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              margin: `${spacing.lg}px 0 0`,
              maxWidth: 720,
            }}
          >
            Find a place to call{" "}
            <span style={{ color: colors.accent }}>home</span>.
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: "clamp(16px, 1.6vw, 20px)",
              marginTop: spacing.lg,
              maxWidth: 600,
              lineHeight: 1.55,
            }}
          >
            Browse verified properties, then design, build and furnish them with
            trusted professionals — your entire home journey, all in one place.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.md,
              marginTop: spacing.xxl,
              maxWidth: 560,
            }}
          >
            <HeroSegment
              icon="house"
              title="Browse properties"
              subtitle="240+ verified homes, villas & plots"
            />
            <HeroSegment
              icon="hardhat"
              title="Hire professionals"
              subtitle="180+ architects, designers & experts"
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.xxl,
              marginTop: spacing.xxl,
              color: colors.white,
              flexWrap: "wrap",
            }}
          >
            <TrustStat value="240+" label="Properties listed" />
            <span
              style={{
                width: 1,
                height: 34,
                background: "rgba(255,255,255,0.2)",
              }}
            />
            <TrustStat value="180+" label="Verified pros" />
            <span
              style={{
                width: 1,
                height: 34,
                background: "rgba(255,255,255,0.2)",
              }}
            />
            <TrustStat value="4.8★" label="Avg rating" />
          </div>
        </div>

        <div
          className="hidden lg:flex"
          style={{ position: "relative", justifyContent: "center" }}
        >
          <div
            className="animate-glow-pulse"
            style={{
              position: "absolute",
              width: 380,
              height: 380,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(41,151,255,0.55), transparent 64%)",
              filter: "blur(22px)",
              zIndex: 0,
            }}
          />
          <Parallax
            speed={0.1}
            className="animate-floaty"
            style={{ position: "relative", zIndex: 1 }}
          >
            <PhoneFrame
              src={appHomeImg}
              alt="HomeDot mobile app home screen"
              width={300}
            />
          </Parallax>
          <PhoneChip
            icon={
              <Icon
                name="house"
                size={16}
                strokeWidth={2}
                color={colors.white}
              />
            }
            title="240+ homes"
            subtitle="near you"
            tone="accent"
            style={{ left: -44, top: 128 }}
          />
          <PhoneChip
            icon={<Icon name="sparkle" size={16} filled color={colors.white} />}
            title="Get the app"
            subtitle="iOS & Android"
            tone="green"
            style={{ right: -26, bottom: 158 }}
          />
        </div>
      </div>

      <button
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          margin: "0 auto",
          paddingBottom: spacing.lg,
          color: "rgba(255,255,255,0.58)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 22,
            height: 34,
            border: "1.6px solid rgba(255,255,255,0.4)",
            borderRadius: 12,
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
          }}
        >
          <span
            className="animate-scroll-dot"
            style={{
              width: 4,
              height: 7,
              borderRadius: 3,
              background: "rgba(255,255,255,0.85)",
            }}
          />
        </span>
        Scroll to explore
      </button>
    </section>
  );
}

const marqueeItems = [
  "Browse verified properties",
  "Hire architects",
  "Find interior designers",
  "Book contractors",
  "Explore homes across Kerala",
  "Verified professionals only",
];

function MarqueeStrip() {
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <div
      style={{
        background: colors.ink,
        padding: `${spacing.md + 2}px 0`,
        overflow: "hidden",
      }}
    >
      <div className="marquee-row">
        <div className="marquee-track">
          {items.map((t, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: spacing.lg,
                color: "rgba(255,255,255,0.85)",
                fontFamily: "var(--font-display)",
                fontSize: fontSize.md + 1,
                fontWeight: 600,
                whiteSpace: "nowrap",
                padding: `0 ${spacing.lg}px`,
              }}
            >
              <Icon name="sparkle" size={14} filled color={colors.accent} />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroSegment({
  icon,
  title,
  subtitle,
}: {
  icon: "house" | "hardhat";
  title: string;
  subtitle: string;
}) {
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.lg - 1,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 16,
        padding: "15px 17px",
        textAlign: "left",
        color: colors.white,
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: 13,
          background: icon === "house" ? colors.accent : "#34A853",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={24} strokeWidth={2} />
      </span>
      <span
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}
      >
        <b
          style={{
            fontFamily: "var(--font-display)",
            fontSize: fontSize.lg - 1,
            fontWeight: 600,
          }}
        >
          {title}
        </b>
        <em
          style={{
            fontStyle: "normal",
            fontSize: fontSize.sm,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {subtitle}
        </em>
      </span>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="arrow" size={18} />
      </span>
    </button>
  );
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <b
        style={{
          fontFamily: "var(--font-display)",
          fontSize: fontSize.xxl - 4,
          display: "block",
          lineHeight: 1,
        }}
      >
        {value}
      </b>
      <span style={{ fontSize: fontSize.xs, color: "rgba(255,255,255,0.7)" }}>
        {label}
      </span>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: center ? "center" : "flex-start",
        textAlign: center ? "center" : "left",
        marginBottom: spacing.xxl - 2,
        gap: spacing.sm,
      }}
    >
      {eyebrow && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: fontSize.sm,
            fontWeight: 600,
            color: colors.primary,
            background: colors.primarySoft,
            padding: "6px 13px",
            borderRadius: radius.full,
          }}
        >
          <Icon name="sparkle" size={15} filled color={colors.primary} />{" "}
          {eyebrow}
        </span>
      )}
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(24px, 3vw, 34px)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{ color: colors.muted, fontSize: fontSize.md, maxWidth: 560 }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function FeaturedProperties() {
  return (
    <section style={{ ...wrap, padding: `${spacing.huge}px ${spacing.xl}px` }}>
      <ScrollScrub
        className="scrub-rise"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 34px)",
              fontWeight: 600,
            }}
          >
            Featured properties in Kochi
          </h2>
          <p
            style={{
              color: colors.muted,
              fontSize: fontSize.md,
              marginTop: spacing.sm,
            }}
          >
            Handpicked homes, villas and plots — updated today.
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            fontSize: fontSize.sm + 0.5,
            color: colors.primary,
            whiteSpace: "nowrap",
          }}
        >
          Explore all <Icon name="arrow" size={16} />
        </span>
      </ScrollScrub>
      <Reveal
        stagger
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: spacing.xl }}
      >
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </Reveal>
    </section>
  );
}

function Categories() {
  return (
    <section style={{ ...wrap, padding: `${spacing.xxl}px ${spacing.xl}px` }}>
      <ScrollScrub className="scrub-rise">
        <SectionHead
          title="Design & build professionals"
          subtitle="Plan and construct your dream home with verified experts."
        />
      </ScrollScrub>
      <Reveal
        stagger
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        style={{ gap: spacing.lg }}
      >
        {categories.map((c) => (
          <button
            key={c.id}
            className="card-hover"
            style={{
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.md,
              padding: "22px 20px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              boxShadow: shadow.sm,
            }}
          >
            <span
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: colors.primarySoft,
                color: colors.primary,
                display: "grid",
                placeItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Icon name={c.icon} size={26} />
            </span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                fontSize: fontSize.md,
              }}
            >
              {c.name}
            </span>
            <span style={{ fontSize: fontSize.xs, color: colors.muted }}>
              {c.count.toLocaleString()} pros
            </span>
          </button>
        ))}
      </Reveal>
    </section>
  );
}

function HouseholdServices() {
  return (
    <section
      style={{
        ...wrap,
        padding: `${spacing.md}px ${spacing.xl}px ${spacing.xxl}px`,
      }}
    >
      <ScrollScrub className="scrub-rise">
        <SectionHead
          title="Household & maintenance services"
          subtitle="Quick, reliable help for everyday home needs."
        />
      </ScrollScrub>
      <Reveal
        stagger
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{ gap: spacing.md }}
      >
        {homeServices.map((s) => (
          <button
            key={s.id}
            className="card-hover"
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.md + 1,
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.md,
              padding: "14px 16px",
              textAlign: "left",
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "rgba(41,151,255,0.14)",
                color: colors.accent,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={s.icon} size={20} />
            </span>
            <span>
              <b
                style={{
                  display: "block",
                  fontSize: fontSize.md - 1.5,
                  fontWeight: 600,
                }}
              >
                {s.name}
              </b>
              <em
                style={{
                  fontStyle: "normal",
                  fontSize: fontSize.xs,
                  color: colors.muted,
                }}
              >
                {s.count.toLocaleString()} pros
              </em>
            </span>
          </button>
        ))}
      </Reveal>
    </section>
  );
}

function TopProfessionals() {
  return (
    <section
      style={{
        background: colors.card,
        borderTop: `1px solid ${colors.line}`,
        borderBottom: `1px solid ${colors.line}`,
      }}
    >
      <div style={{ ...wrap, padding: `${spacing.huge}px ${spacing.xl}px` }}>
        <ScrollScrub
          className="scrub-rise"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: spacing.lg,
            marginBottom: spacing.xxl,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 3vw, 34px)",
                fontWeight: 600,
              }}
            >
              Top rated near you
            </h2>
            <p
              style={{
                color: colors.muted,
                fontSize: fontSize.md,
                marginTop: spacing.sm,
              }}
            >
              Hand-picked professionals in Kochi this week.
            </p>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              fontSize: fontSize.sm + 0.5,
              color: colors.primary,
              whiteSpace: "nowrap",
            }}
          >
            See all <Icon name="arrow" size={16} />
          </span>
        </ScrollScrub>
        <Reveal
          stagger
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: spacing.xl }}
        >
          {professionals.map((p) => (
            <ProCard key={p.id} pro={p} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section style={{ ...wrap, padding: `${spacing.huge}px ${spacing.xl}px` }}>
      <ScrollScrub className="scrub-rise">
        <SectionHead
          center
          eyebrow="How HomeDot works"
          title="Three steps from idea to handover"
        />
      </ScrollScrub>
      <Reveal
        stagger
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: spacing.xl }}
      >
        {steps.map((s) => (
          <div key={s.n} style={{ textAlign: "center", padding: "0 10px" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: fontSize.sm,
                fontWeight: 700,
                color: colors.accent,
                background: "rgba(41,151,255,0.12)",
                width: 54,
                height: 54,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 18px",
              }}
            >
              {s.n}
            </span>
            <h3
              style={{
                fontSize: fontSize.lg + 1,
                fontWeight: 700,
                marginBottom: spacing.sm,
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                color: colors.muted,
                fontSize: fontSize.md - 1.5,
                lineHeight: 1.55,
                maxWidth: 280,
                margin: "0 auto",
              }}
            >
              {s.text}
            </p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

function ExploreScroll() {
  return (
    <ScrollPin heightVh={230} navOffset={72}>
      <div className="pin-scale" style={{ position: "absolute", inset: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exploreImage}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(10,20,34,0.5), rgba(10,20,34,0.78))`,
        }}
      />
      <div
        className="pin-rise"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: `0 ${spacing.xl}px`,
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
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
          <Icon name="sparkle" size={15} filled color={colors.white} /> Keep
          exploring
        </span>
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
          Every home has a story.
          <br />
          Scroll to find yours.
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
          From a first walkthrough to move-in day, HomeDot keeps you moving
          forward — one scroll at a time.
        </p>
      </div>
      <div
        className="pin-fade-out"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: colors.bg,
          pointerEvents: "none",
        }}
      />
    </ScrollPin>
  );
}

function TrustBanner() {
  return (
    <section
      style={{
        ...wrap,
        padding: `${spacing.xxl}px ${spacing.xl}px ${spacing.huge}px`,
      }}
    >
      <Reveal
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{
          background: colors.primary,
          borderRadius: radius.lg,
          padding: "clamp(28px, 4vw, 52px)",
          gap: spacing.xxl,
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div>
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
            <Icon name="shield" size={15} /> The HomeDot promise
          </span>
          <h2
            style={{
              color: colors.white,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 34px)",
              fontWeight: 600,
              margin: `${spacing.lg}px 0 ${spacing.md}px`,
            }}
          >
            Verified people. Real reviews. Zero guesswork.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: fontSize.md,
              lineHeight: 1.6,
              maxWidth: 460,
            }}
          >
            Every professional is manually checked for credentials and past work
            before they appear. You see genuine reviews from real projects —
            never paid placements.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm + 2,
              margin: `${spacing.xxl}px 0`,
            }}
          >
            {[
              "ID & license verified",
              "Portfolio reviewed",
              "Reviews from real clients",
            ].map((t) => (
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
          >
            Start your search
          </Button>
        </div>
        <ScrollScrub
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: radius.md,
          }}
        >
          <Parallax speed={0.06}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trustImage}
              alt="Beautiful home interior"
              className="scrub-zoom"
              style={{
                width: "100%",
                borderRadius: radius.md,
                objectFit: "cover",
                aspectRatio: "4/3",
                boxShadow: shadow.lg,
              }}
            />
          </Parallax>
        </ScrollScrub>
      </Reveal>
    </section>
  );
}

function AppPromo() {
  const features = [
    "Browse 240+ verified properties",
    "Hire 180+ trusted professionals",
    "Real-time chat & instant booking",
  ];
  return (
    <section
      style={{ ...wrap, padding: `0 ${spacing.xl}px ${spacing.huge}px` }}
    >
      <Reveal
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${colors.primaryDeep}, ${colors.primary})`,
          borderRadius: radius.lg,
          padding: "clamp(32px, 5vw, 60px)",
          gap: spacing.xxl,
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <ScrollScrub className="scrub-rise">
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
              <Icon name="sparkle" size={15} filled color={colors.white} />{" "}
              HomeDot mobile
            </span>
            <h2
              style={{
                color: colors.white,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3.4vw, 42px)",
                fontWeight: 600,
                lineHeight: 1.08,
                margin: `${spacing.lg}px 0 ${spacing.md}px`,
              }}
            >
              Your whole home journey,
              <br />
              right in your pocket.
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: fontSize.md,
                lineHeight: 1.6,
                maxWidth: 440,
              }}
            >
              Search verified pros, browse listings, chat and book — wherever
              you are. Track every project and get instant updates from one
              beautiful app.
            </p>
          </ScrollScrub>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm + 3,
              margin: `${spacing.xxl}px 0 ${spacing.xl}px`,
            }}
          >
            {features.map((f) => (
              <span
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.md,
                  color: "rgba(255,255,255,0.92)",
                  fontWeight: 500,
                  fontSize: fontSize.md - 1,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: colors.accent,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="check" size={15} color={colors.white} />
                </span>
                {f}
              </span>
            ))}
          </div>
          <StoreButtons />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.md - 2,
              marginTop: spacing.lg,
              color: "rgba(255,255,255,0.8)",
              fontSize: fontSize.sm,
            }}
          >
            <Icon name="star" size={16} filled color={colors.gold} />
            <span>4.8 average · 12,000+ ratings</span>
          </div>
        </div>

        <div
          className="hidden lg:flex"
          style={{
            position: "relative",
            justifyContent: "center",
            minHeight: 480,
          }}
        >
          <div
            className="animate-glow-pulse"
            style={{
              position: "absolute",
              width: 430,
              height: 430,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(41,151,255,0.48), transparent 62%)",
              filter: "blur(26px)",
            }}
          />
          <Parallax
            speed={0.1}
            className="animate-floaty"
            style={{ position: "relative", zIndex: 1 }}
          >
            <PhoneFrame
              src={appHomeImg}
              alt="HomeDot mobile app home screen"
              width={288}
            />
          </Parallax>
          <PhoneChip
            icon={
              <Icon name="verified" size={16} filled color={colors.white} />
            }
            title="Verified pros"
            subtitle="Manually checked"
            tone="accent"
            style={{ left: 0, top: 64 }}
          />
          <PhoneChip
            icon={<Icon name="star" size={16} filled color={colors.white} />}
            title="4.8 rating"
            subtitle="12k+ reviews"
            tone="green"
            style={{ right: -6, bottom: 92 }}
          />
        </div>
      </Reveal>
    </section>
  );
}

function ProCta() {
  return (
    <section
      style={{ ...wrap, padding: `0 ${spacing.xl}px ${spacing.huge}px` }}
    >
      <ScrollScrub
        className="scrub-rise flex-col lg:flex-row"
        style={{
          background: colors.card,
          border: `1px solid ${colors.line}`,
          borderRadius: radius.lg,
          padding: "clamp(26px, 4vw, 44px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.xxl,
          boxShadow: shadow.sm,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 2.6vw, 30px)",
              fontWeight: 600,
            }}
          >
            Are you a home professional?
          </h2>
          <p
            style={{
              color: colors.muted,
              marginTop: spacing.sm,
              fontSize: fontSize.md - 0.5,
              maxWidth: 520,
            }}
          >
            List your services, showcase your portfolio and reach thousands of
            homeowners across Kerala.
          </p>
        </div>
        <Button variant="dark" size="lg" icon={<Icon name="arrow" size={18} />}>
          List your business — free
        </Button>
      </ScrollScrub>
    </section>
  );
}

function LatestInsights() {
  return (
    <section
      style={{ ...wrap, padding: `0 ${spacing.xl}px ${spacing.huge}px` }}
    >
      <ScrollScrub className="scrub-rise">
        <SectionHead
          eyebrow="From the blog"
          title="Latest insights"
          subtitle="Tips, guides and stories for every stage of your home journey."
        />
      </ScrollScrub>
      <Reveal
        stagger
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: spacing.xl }}
      >
        {blogPosts.map((post) => (
          <article
            key={post.id}
            className="card-hover"
            style={{
              background: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: radius.lg,
              overflow: "hidden",
              boxShadow: shadow.sm,
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                position: "relative",
                aspectRatio: "16/10",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image}
                alt={post.title}
                loading="lazy"
                className="card-hover-img"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                padding: spacing.xl,
                display: "flex",
                flexDirection: "column",
                gap: spacing.sm,
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: fontSize.xs,
                  color: colors.muted,
                }}
              >
                <span style={{ fontWeight: 600, color: colors.ink2 }}>
                  {post.author}
                </span>
                <span>{post.date}</span>
              </div>
              <h3
                style={{
                  fontSize: fontSize.lg - 1,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.3,
                }}
              >
                {post.title}
              </h3>
              <p
                style={{
                  fontSize: fontSize.sm + 1,
                  color: colors.muted,
                  lineHeight: 1.5,
                }}
              >
                {post.excerpt}
              </p>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: fontSize.sm,
                  fontWeight: 600,
                  color: colors.primary,
                  marginTop: "auto",
                  paddingTop: spacing.sm,
                }}
              >
                Read more <Icon name="arrow" size={15} />
              </span>
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}

function Testimonials() {
  return (
    <section
      style={{
        background: colors.card,
        borderTop: `1px solid ${colors.line}`,
        borderBottom: `1px solid ${colors.line}`,
      }}
    >
      <div style={{ ...wrap, padding: `${spacing.huge}px ${spacing.xl}px` }}>
        <ScrollScrub className="scrub-rise">
          <SectionHead
            eyebrow="Testimonials"
            title="What our clients say"
            subtitle="Real experiences from homeowners and professionals on HomeDot."
          />
        </ScrollScrub>
        <Reveal
          stagger
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: spacing.xl }}
        >
          {testimonials.map((t) => (
            <div
              key={t.id}
              style={{
                background: colors.bg,
                border: `1px solid ${colors.line}`,
                borderRadius: radius.lg,
                padding: spacing.xl,
                display: "flex",
                flexDirection: "column",
                gap: spacing.lg,
                boxShadow: shadow.sm,
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                  color: colors.white,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  lineHeight: 1,
                  fontFamily: "Georgia, serif",
                  fontWeight: 700,
                }}
              >
                &ldquo;
              </span>
              <p
                style={{
                  fontStyle: "italic",
                  color: colors.ink2,
                  fontSize: fontSize.md,
                  lineHeight: 1.6,
                  flex: 1,
                }}
              >
                {t.quote}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingTop: spacing.md,
                  borderTop: `1px solid ${colors.line}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.avatar}
                  alt={t.author}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div>
                  <b
                    style={{
                      display: "block",
                      fontSize: fontSize.sm + 1,
                      fontWeight: 700,
                    }}
                  >
                    {t.author}
                  </b>
                  <span
                    style={{
                      display: "block",
                      fontSize: fontSize.xs,
                      color: colors.muted,
                      marginBottom: 3,
                    }}
                  >
                    {t.role}
                  </span>
                  <span style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon
                        key={i}
                        name="star"
                        size={13}
                        filled
                        color={i < t.rating ? colors.gold : colors.line}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
