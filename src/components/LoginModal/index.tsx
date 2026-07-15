"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize, shadow } from "@/utils/size";
import Icon from "@/components/Icon";
import Button from "@/components/Button";
import AuthService from "@/services/AuthService";
import { useAuthStore } from "@/store/useAuthStore";
import type { LocationValue } from "@/components/LocationMapPicker";
import RoleStep from "./RoleStep";
import UserFormStep, { type UserFormValues } from "./UserFormStep";
import ProLocationStep from "./ProLocationStep";
import ProFormStep, { type ProFormValues } from "./ProFormStep";
import CountryCodeSelect from "./CountryCodeSelect";
import { inputWrap, digitLimitFor, type Method } from "./shared";

type Step =
  | "method"
  | "otp"
  | "role"
  | "userForm"
  | "proLocation"
  | "proForm"
  | "success";

const PERKS: {
  icon: "verified" | "chat" | "heart";
  title: string;
  subtitle: string;
}[] = [
  {
    icon: "verified",
    title: "Verified pros & listings",
    subtitle: "Every profile manually checked",
  },
  {
    icon: "chat",
    title: "Chat & book directly",
    subtitle: "Talk to agents and experts",
  },
  {
    icon: "heart",
    title: "Save your favourites",
    subtitle: "Across every device",
  },
];

export interface LoginModalHandle {
  /** Opens the modal imperatively — used by callers like SiteNav's "Add Property"
   * button that need to prompt login from outside this component's own trigger. */
  open: () => void;
}

/** Login trigger button (Nav) + the phone/email → OTP → success modal. Self-contained
 * client island so the rest of LandingScreen can stay a Server Component. */
const LoginModal = forwardRef<LoginModalHandle>(
  function LoginModal(_props, ref) {
    const [open, setOpen] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [step, setStep] = useState<Step>("method");
    const [method, setMethod] = useState<Method>("phone");
    const [value, setValue] = useState("");
    const [cc, setCc] = useState("+91");
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const [secs, setSecs] = useState(0);
    const [shake, setShake] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkError, setCheckError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [isNewUser, setIsNewUser] = useState(true);
    const [proLocation, setProLocation] = useState<LocationValue | null>(null);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
    }));

    useEffect(() => {
      if (step !== "otp") return;
      const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
      return () => clearInterval(id);
    }, [step]);

    const reset = useCallback(() => {
      setStep("method");
      setMethod("phone");
      setValue("");
      setOtp(["", "", "", "", "", ""]);
      setCheckError(null);
      setOtpError(null);
      setIsNewUser(true);
      setProLocation(null);
    }, []);

    const close = useCallback(() => {
      setOpen(false);
      setTimeout(reset, 250);
    }, [reset]);

    useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open, close]);

    const digitLimit = digitLimitFor(cc);
    const digits = value.replace(/\D/g, "");
    const valid =
      method === "phone"
        ? digits.length === digitLimit
        : /\S+@\S+\.\S+/.test(value);
    const otpFull = otp.every((d) => d !== "");

    const doShake = () => {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    };

    const contactPayload = () =>
      method === "phone"
        ? { userContact: digits, countryCode: cc.replace("+", "") }
        : { userContact: value.trim() };

    const sendOtp = async () => {
      if (!valid) return doShake();
      setChecking(true);
      setCheckError(null);
      const payload = contactPayload();

      const checkRes = await AuthService.checkUser(payload);
      if (!checkRes.success || !checkRes.data?.status) {
        setChecking(false);
        setCheckError(
          checkRes.data?.message ||
            checkRes.message ||
            "Something went wrong. Please try again.",
        );
        return doShake();
      }

      const otpRes = await AuthService.sendLoginOtp(payload);
      console.log("Send OTP response:", otpRes);
      setChecking(false);
      if (!otpRes.success || !otpRes.data?.status) {
        setCheckError(
          otpRes.data?.message ||
            otpRes.message ||
            "Couldn't send the OTP. Please try again.",
        );
        return doShake();
      }

      setIsNewUser(
        otpRes.data.data[0]?.newUser ?? checkRes.data.data[0]?.newUser ?? true,
      );
      setSecs(120);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 380);
    };

    const setDigit = (i: number, raw: string) => {
      const v = raw.replace(/\D/g, "").slice(-1);
      setOtp((o) => {
        const next = [...o];
        next[i] = v;
        return next;
      });
      if (v && i < 5) otpRefs.current[i + 1]?.focus();
    };

    const onOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[i] && i > 0)
        otpRefs.current[i - 1]?.focus();
    };

    const onOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      const d = (e.clipboardData.getData("text") || "")
        .replace(/\D/g, "")
        .slice(0, 6)
        .split("");
      if (!d.length) return;
      e.preventDefault();
      const next = ["", "", "", "", "", ""];
      d.forEach((x, i) => (next[i] = x));
      setOtp(next);
      otpRefs.current[Math.min(d.length, 5)]?.focus();
    };

    const verify = async () => {
      if (!otpFull) return doShake();
      setVerifying(true);
      setOtpError(null);
      const res = await AuthService.verifyLoginOtp({
        ...contactPayload(),
        otp: otp.join(""),
        deviceToken: "",
        deviceType: "ios",
      });
      setVerifying(false);
      if (!res.success || !res.data || res.data.status === false) {
        setOtpError(
          res.data?.message || res.message || "Invalid code. Please try again.",
        );
        return doShake();
      }
      const record = res.data.data[0];
      if (record?.token && record?.reToken) {
        useAuthStore
          .getState()
          .setTokens({ token: record.token, refreshToken: record.reToken });
      }
      if (isNewUser) {
        setStep("role");
        return;
      }
      finishSuccess();
    };

    const resendOtp = async () => {
      setOtpError(null);
      const res = await AuthService.sendLoginOtp(contactPayload());
      if (!res.success || !res.data?.status) {
        setOtpError(
          res.data?.message ||
            res.message ||
            "Couldn't resend the OTP. Please try again.",
        );
        return;
      }
      setSecs(120);
    };

    const finishSuccess = () => {
      setStep("success");
      setTimeout(() => {
        setLoggedIn(true);
        close();
      }, 1500);
    };

    const submitUserForm = (values: UserFormValues) => {
      console.log("User registration payload:", values);
      finishSuccess();
    };

    const submitProForm = (values: ProFormValues) => {
      console.log("Professional registration payload:", values);
      finishSuccess();
    };

    const masked =
      method === "phone"
        ? `${cc} ${digits
            .slice(-10)
            .replace(/(\d{5})(\d{0,5})/, "$1 $2")
            .trim()}`
        : value;

    const isWideStep =
      step === "role" ||
      step === "userForm" ||
      step === "proLocation" ||
      step === "proForm";

    return (
      <>
        {loggedIn ? (
          <button
            onClick={() => setOpen(true)}
            aria-label="My account"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: colors.primarySoft,
              color: colors.primary,
              display: "grid",
              placeItems: "center",
              border: `1.5px solid ${colors.line}`,
              flexShrink: 0,
            }}
          >
            <Icon name="check" size={18} strokeWidth={2.4} />
          </button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            // icon={<Icon name="check" size={16} />}
            onClick={() => setOpen(true)}
          >
            Log in
          </Button>
        )}

        {open && (
          <div
            className="login-overlay"
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: colors.overlay,
              backdropFilter: "blur(7px)",
              display: "flex",
              justifyContent: "center",
              alignItems: isWideStep ? "flex-start" : "center",
              overflowY: "auto",
              padding: isWideStep ? "40px 20px" : 20,
            }}
          >
            <div
              className="login-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                width: isWideStep ? "min(640px, 100%)" : "min(880px, 100%)",
                maxHeight: isWideStep ? undefined : "94vh",
                overflow: isWideStep ? "visible" : "hidden",
                display: "grid",
                gridTemplateColumns: isWideStep ? "1fr" : "1fr 1.05fr",
                background: colors.card,
                borderRadius: 24,
                boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
                flexShrink: 0,
              }}
            >
              <button
                onClick={close}
                aria-label="Close"
                style={{
                  position: "absolute",
                  right: 16,
                  top: 16,
                  zIndex: 5,
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: isWideStep
                    ? "rgba(16,28,48,0.08)"
                    : "rgba(255,255,255,0.16)",
                  color: isWideStep ? colors.ink : colors.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon
                  name="close"
                  size={20}
                  color={isWideStep ? colors.ink : colors.white}
                />
              </button>

              {!isWideStep && <BrandPanel />}

              <div
                style={{
                  padding: "38px 36px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: isWideStep ? "flex-start" : "center",
                  overflowY: isWideStep ? "visible" : "auto",
                  minHeight: isWideStep ? undefined : 0,
                  minWidth: 0,
                }}
              >
                {step === "method" && (
                  <MethodStep
                    method={method}
                    setMethod={(m) => {
                      setMethod(m);
                      setValue("");
                    }}
                    value={value}
                    setValue={setValue}
                    cc={cc}
                    setCc={setCc}
                    digitLimit={digitLimit}
                    valid={valid}
                    shake={shake}
                    checking={checking}
                    error={checkError}
                    onSubmit={sendOtp}
                  />
                )}

                {step === "otp" && (
                  <OtpStep
                    masked={masked}
                    otp={otp}
                    otpRefs={otpRefs}
                    setDigit={setDigit}
                    onOtpKey={onOtpKey}
                    onOtpPaste={onOtpPaste}
                    shake={shake}
                    otpFull={otpFull}
                    secs={secs}
                    verifying={verifying}
                    error={otpError}
                    onBack={() => setStep("method")}
                    onVerify={verify}
                    onResend={resendOtp}
                  />
                )}

                {step === "role" && (
                  <RoleStep
                    onSelect={(r) =>
                      setStep(r === "user" ? "userForm" : "proLocation")
                    }
                  />
                )}

                {step === "userForm" && (
                  <UserFormStep
                    method={method}
                    contactValue={value}
                    countryCode={cc}
                    onBack={() => setStep("role")}
                    onSubmit={submitUserForm}
                  />
                )}

                {step === "proLocation" && (
                  <ProLocationStep
                    initialLocation={proLocation}
                    onBack={() => setStep("role")}
                    onContinue={(loc) => {
                      setProLocation(loc);
                      setStep("proForm");
                    }}
                  />
                )}

                {step === "proForm" && proLocation && (
                  <ProFormStep
                    method={method}
                    contactValue={value}
                    countryCode={cc}
                    location={proLocation}
                    onChangeLocation={() => setStep("proLocation")}
                    onBack={() => setStep("proLocation")}
                    onSubmit={submitProForm}
                  />
                )}

                {step === "success" && (
                  <SuccessStep
                    title={isNewUser ? "Account created!" : undefined}
                    subtitle={
                      isNewUser
                        ? "Welcome to HomeDot. Taking you in…"
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

export default LoginModal;

function BrandPanel() {
  return (
    <div
      className="login-brand-panel"
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(155deg, ${colors.primaryDeep}, ${colors.primary})`,
        color: colors.white,
        padding: "34px 30px",
        display: "flex",
        flexDirection: "column",
        gap: spacing.xxl - 10,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(70% 50% at 100% 0, rgba(41,151,255,0.4), transparent 60%), radial-gradient(60% 50% at 0 100%, rgba(41,151,255,0.24), transparent 55%)",
        }}
      />

      <span
        style={{
          position: "relative",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: fontSize.xl,
          letterSpacing: "-0.03em",
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
        Home<span>Dot</span>
      </span>

      <div style={{ position: "relative" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 30,
            letterSpacing: "-0.03em",
            marginBottom: spacing.sm + 2,
          }}
        >
          Welcome home.
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: fontSize.base,
            lineHeight: 1.55,
            maxWidth: 300,
          }}
        >
          Sign in to explore verified properties and professionals across
          Kerala.
        </p>

        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: spacing.lg - 2,
            marginTop: spacing.xl,
          }}
        >
          {PERKS.map((p) => (
            <li
              key={p.title}
              className="login-perk"
              style={{ display: "flex", alignItems: "center", gap: spacing.md }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "rgba(255,255,255,0.14)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={p.icon}
                  size={17}
                  strokeWidth={2}
                  color={colors.white}
                />
              </span>
              <span>
                <b
                  style={{
                    display: "block",
                    fontSize: fontSize.base,
                    fontWeight: 600,
                  }}
                >
                  {p.title}
                </b>
                <em
                  style={{
                    fontStyle: "normal",
                    fontSize: fontSize.xs,
                    color: "rgba(255,255,255,0.66)",
                  }}
                >
                  {p.subtitle}
                </em>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          marginTop: "auto",
          fontSize: fontSize.xs,
          color: "rgba(255,255,255,0.66)",
        }}
      >
        <Icon name="shield" size={15} color="rgba(255,255,255,0.8)" /> Your
        details stay private &amp; secure
      </div>
    </div>
  );
}

function MethodStep({
  method,
  setMethod,
  value,
  setValue,
  cc,
  setCc,
  digitLimit,
  valid,
  shake,
  checking,
  error,
  onSubmit,
}: {
  method: Method;
  setMethod: (m: Method) => void;
  value: string;
  setValue: (v: string) => void;
  cc: string;
  setCc: (c: string) => void;
  digitLimit: number;
  valid: boolean;
  shake: boolean;
  checking: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const digits = value.replace(/\D/g, "");
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
        Log in or sign up
      </h1>
      <p
        style={{
          fontSize: fontSize.base,
          color: colors.muted,
          lineHeight: 1.5,
          marginBottom: spacing.xl - 2,
        }}
      >
        Enter your number or email — we&apos;ll send a one-time code.
      </p>

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: colors.bg,
          border: `1px solid ${colors.line}`,
          borderRadius: radius.full,
          padding: 4,
          marginBottom: spacing.lg + 2,
        }}
      >
        <span
          className="login-tab-thumb"
          style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: 4,
            width: "calc(50% - 4px)",
            borderRadius: radius.full,
            background: colors.white,
            boxShadow: shadow.sm,
            transform:
              method === "email" ? "translateX(100%)" : "translateX(0)",
          }}
        />
        {(["phone", "email"] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            style={{
              position: "relative",
              zIndex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: 10,
              borderRadius: radius.full,
              fontSize: fontSize.sm + 0.5,
              fontWeight: 600,
              color: method === m ? colors.primary : colors.muted,
            }}
          >
            <Icon name={m === "phone" ? "phone" : "mail"} size={16} />
            {m === "phone" ? "Phone" : "Email"}
          </button>
        ))}
      </div>

      <div
        className={shake ? "login-shake" : undefined}
        style={{ ...inputWrap, marginBottom: spacing.lg + 2 }}
      >
        {method === "phone" ? (
          <>
            <CountryCodeSelect value={cc} onChange={setCc} />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98470 11223"
              value={value}
              onChange={(e) =>
                setValue(e.target.value.replace(/\D/g, "").slice(0, digitLimit))
              }
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              autoFocus
              style={{
                border: "none",
                outline: "none",
                background: "none",
                width: "100%",
                fontSize: fontSize.md - 0.5,
                color: colors.ink,
              }}
            />
          </>
        ) : (
          <>
            <Icon name="mail" size={18} color={colors.muted} />
            <input
              type="email"
              inputMode="email"
              placeholder="you@email.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              autoFocus
              style={{
                border: "none",
                outline: "none",
                background: "none",
                width: "100%",
                fontSize: fontSize.md - 0.5,
                color: colors.ink,
              }}
            />
          </>
        )}
      </div>

      {method === "phone" && !error && (
        <p
          style={{
            fontSize: fontSize.xs,
            color: colors.muted,
            marginBottom: spacing.md,
            marginTop: -spacing.sm,
          }}
        >
          Enter a {digitLimit}-digit number ({digits.length}/{digitLimit})
        </p>
      )}

      {error && (
        <p
          style={{
            fontSize: fontSize.sm,
            color: "#C0392B",
            marginBottom: spacing.md,
            marginTop: -spacing.sm,
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={checking}
        className={`login-cta${valid ? " is-ready" : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          width: "100%",
          height: 52,
          borderRadius: radius.md,
          background: colors.primary,
          color: colors.white,
          fontWeight: 600,
          fontSize: fontSize.md - 1,
          opacity: valid && !checking ? 1 : 0.5,
        }}
      >
        {checking ? "Checking…" : "Send OTP"}
        {!checking && <Icon name="arrow" size={18} color={colors.white} />}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.md,
          margin: `${spacing.xl - 4}px 0`,
          color: colors.muted,
          fontSize: fontSize.xs + 0.5,
        }}
      >
        <span style={{ flex: 1, height: 1, background: colors.line }} />
        or continue with
        <span style={{ flex: 1, height: 1, background: colors.line }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: spacing.md,
        }}
      >
        <button
          className="login-social-btn"
          onClick={onSubmit}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            height: 48,
            border: `1.5px solid ${colors.line}`,
            borderRadius: 13,
            background: colors.white,
            fontWeight: 600,
            fontSize: fontSize.base,
            color: colors.ink,
          }}
        >
          <GoogleGlyph /> Google
        </button>
        <button
          className="login-social-btn"
          onClick={onSubmit}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            height: 48,
            border: `1.5px solid ${colors.line}`,
            borderRadius: 13,
            background: colors.white,
            fontWeight: 600,
            fontSize: fontSize.base,
            color: colors.ink,
          }}
        >
          <AppleGlyph /> Apple
        </button>
      </div>

      <p
        style={{
          fontSize: fontSize.xs - 1,
          color: colors.muted,
          textAlign: "center",
          marginTop: spacing.xl - 4,
          lineHeight: 1.5,
        }}
      >
        By continuing you agree to HomeDot&apos;s{" "}
        <a
          style={{ color: colors.primary, fontWeight: 600, cursor: "pointer" }}
        >
          Terms
        </a>{" "}
        &amp;{" "}
        <a
          style={{ color: colors.primary, fontWeight: 600, cursor: "pointer" }}
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

function OtpStep({
  masked,
  otp,
  otpRefs,
  setDigit,
  onOtpKey,
  onOtpPaste,
  shake,
  otpFull,
  secs,
  verifying,
  error,
  onBack,
  onVerify,
  onResend,
}: {
  masked: string;
  otp: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  setDigit: (i: number, v: string) => void;
  onOtpKey: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOtpPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  shake: boolean;
  otpFull: boolean;
  secs: number;
  verifying: boolean;
  error: string | null;
  onBack: () => void;
  onVerify: () => void;
  onResend: () => void;
}) {
  return (
    <div className="login-step">
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: fontSize.sm + 0.5,
          fontWeight: 600,
          color: colors.muted,
          marginBottom: spacing.lg,
        }}
      >
        <Icon name="arrowLeft" size={17} /> Back
      </button>

      <span
        style={{
          width: 58,
          height: 58,
          borderRadius: 17,
          background: colors.primarySoft,
          color: colors.primary,
          display: "grid",
          placeItems: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Icon name="chat" size={26} />
      </span>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          letterSpacing: "-0.02em",
          marginBottom: spacing.sm,
        }}
      >
        Enter the code
      </h1>
      <p
        style={{
          fontSize: fontSize.base,
          color: colors.muted,
          lineHeight: 1.5,
          marginBottom: spacing.lg,
        }}
      >
        We sent a 6-digit code to <b style={{ color: colors.ink }}>{masked}</b>
      </p>

      <div
        onPaste={onOtpPaste}
        className={shake ? "login-shake" : undefined}
        style={{
          display: "flex",
          gap: 9,
          marginBottom: spacing.md,
          maxWidth: 330,
        }}
      >
        {otp.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            className="login-otp-box"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onOtpKey(i, e)}
            style={{
              flex: 1,
              minWidth: 0,
              width: 46,
              height: 52,
              textAlign: "center",
              fontSize: 21,
              fontWeight: 700,
              color: colors.ink,
              border: `1.5px solid ${d ? colors.primary : colors.line}`,
              borderRadius: 12,
              background: d ? colors.primarySoft : colors.white,
              outline: "none",
            }}
          />
        ))}
      </div>

      {error && (
        <p
          style={{
            fontSize: fontSize.sm,
            color: "#C0392B",
            marginBottom: spacing.md,
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={onVerify}
        disabled={verifying}
        className={`login-cta${otpFull ? " is-ready" : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          width: "100%",
          height: 52,
          marginTop: spacing.md,
          borderRadius: radius.md,
          background: colors.primary,
          color: colors.white,
          fontWeight: 600,
          fontSize: fontSize.md - 1,
          opacity: otpFull && !verifying ? 1 : 0.5,
        }}
      >
        {verifying ? "Verifying…" : "Verify & continue"}
        {!verifying && <Icon name="check" size={18} color={colors.white} />}
      </button>

      <p
        style={{
          fontSize: fontSize.sm,
          color: colors.muted,
          marginTop: spacing.lg,
          textAlign: "center",
        }}
      >
        {secs > 0 ? (
          <>
            Resend code in{" "}
            <b style={{ color: colors.ink }}>
              0:{String(secs).padStart(2, "0")}
            </b>
          </>
        ) : (
          <>
            Didn&apos;t get it?{" "}
            <a
              onClick={onResend}
              style={{
                color: colors.primary,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Resend OTP
            </a>
          </>
        )}
      </p>
    </div>
  );
}

function SuccessStep({
  title = "You're in!",
  subtitle = "Welcome to HomeDot. Taking you in…",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      className="login-step"
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <span
        className="login-check-ring"
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "rgba(31,138,91,0.13)",
          color: "#1F8A5B",
          display: "grid",
          placeItems: "center",
          marginBottom: spacing.xl - 4,
        }}
      >
        <Icon name="check" size={44} strokeWidth={2.4} />
      </span>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          letterSpacing: "-0.02em",
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: fontSize.base, color: colors.muted }}>{subtitle}</p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.06-1.4-.18-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z"
      />
      <path
        fill="#EA4335"
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z"
      />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 12.04c-.03-3.09 2.52-4.57 2.64-4.64-1.44-2.11-3.68-2.4-4.48-2.43-1.91-.19-3.72 1.12-4.69 1.12-.96 0-2.45-1.09-4.03-1.06-2.07.03-3.98 1.2-5.05 3.06-2.15 3.73-.55 9.25 1.55 12.28 1.03 1.48 2.25 3.14 3.86 3.08 1.55-.06 2.13-1 4-1 1.86 0 2.4 1 4.03.97 1.66-.03 2.72-1.51 3.74-3 1.18-1.72 1.66-3.38 1.69-3.47-.04-.02-3.24-1.25-3.27-4.91M14.13 3.5c.85-1.04 1.43-2.48 1.27-3.92-1.23.05-2.72.82-3.6 1.85-.79.92-1.49 2.39-1.3 3.8 1.37.11 2.78-.7 3.63-1.73" />
    </svg>
  );
}
