"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/constants/colors";
import { spacing, radius, fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import CountryCodeSelect from "@/components/LoginModal/CountryCodeSelect";
import { digitLimitFor } from "@/components/LoginModal/shared";
import ProfileService from "@/services/ProfileService";

type Mode = "phone" | "email";

/** Change-phone / change-email OTP flow, mirroring homedot-mobile-app's
 * EditProfile (userlNumberUpdateOtpSent/userNumberUpdateOtpVerify and their
 * email equivalents) and reusing LoginModal's own OTP-step visuals so it
 * feels like the same product, not a bolted-on flow. */
export default function ContactUpdateModal({
  mode,
  currentCountryCode,
  onClose,
  onSuccess,
}: {
  mode: Mode;
  currentCountryCode?: string;
  onClose: () => void;
  onSuccess: (value: string, countryCode?: string) => void;
}) {
  const [step, setStep] = useState<"enter" | "otp">("enter");
  const [cc, setCc] = useState(currentCountryCode || "+91");
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [secs, setSecs] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "otp") return;
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const digitLimit = digitLimitFor(cc);
  const digits = value.replace(/\D/g, "");
  const valid = mode === "phone" ? digits.length === digitLimit : /\S+@\S+\.\S+/.test(value);
  const otpFull = otp.every((d) => d !== "");

  const doShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const requestOtp = () =>
    mode === "phone" ? ProfileService.sendPhoneUpdateOtp(digits, cc) : ProfileService.sendEmailUpdateOtp(value.trim());

  const sendOtp = async () => {
    if (!valid) return doShake();
    setSending(true);
    setError(null);
    const res = await requestOtp();
    setSending(false);
    if (!res.success || !res.data?.status) {
      setError(res.data?.message || res.message || "Couldn't send the OTP. Please try again.");
      return doShake();
    }
    setSecs(120);
    setStep("otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 300);
  };

  const resendOtp = async () => {
    setError(null);
    const res = await requestOtp();
    if (!res.success || !res.data?.status) {
      setError(res.data?.message || res.message || "Couldn't resend the OTP. Please try again.");
      return;
    }
    setSecs(120);
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
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const verify = async () => {
    if (!otpFull) return doShake();
    setVerifying(true);
    setError(null);
    const res =
      mode === "phone"
        ? await ProfileService.verifyPhoneUpdateOtp(digits, otp.join(""), cc)
        : await ProfileService.verifyEmailUpdateOtp(value.trim(), otp.join(""));
    setVerifying(false);
    if (!res.success || !res.data?.status) {
      setError(res.data?.message || res.message || "Invalid code. Please try again.");
      return doShake();
    }
    onSuccess(mode === "phone" ? digits : value.trim(), mode === "phone" ? cc : undefined);
  };

  return (
    <div
      className="login-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: colors.overlay,
        backdropFilter: "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          background: colors.card,
          borderRadius: 24,
          boxShadow: "0 40px 90px -30px rgba(10,20,34,0.6)",
          padding: "34px 32px",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(16,28,48,0.06)",
            color: colors.ink,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="close" size={18} />
        </button>

        {step === "enter" ? (
          <div className="login-step">
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 15,
                background: colors.primarySoft,
                color: colors.primary,
                display: "grid",
                placeItems: "center",
                marginBottom: spacing.lg,
              }}
            >
              <Icon name={mode === "phone" ? "phone" : "mail"} size={22} />
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.02em", marginBottom: spacing.sm }}>
              {mode === "phone" ? "Update phone number" : "Update email address"}
            </h2>
            <p style={{ color: colors.muted, fontSize: fontSize.sm, lineHeight: 1.5, marginBottom: spacing.lg }}>
              {mode === "phone"
                ? "We'll text a one-time code to confirm your new number."
                : "We'll email a one-time code to confirm your new address."}
            </p>
            <div
              className={shake ? "login-shake" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                height: 54,
                border: `1.5px solid ${colors.line}`,
                borderRadius: radius.md,
                padding: "0 16px",
                marginBottom: spacing.md,
              }}
            >
              {mode === "phone" ? (
                <>
                  <CountryCodeSelect value={cc} onChange={setCc} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98470 11223"
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, digitLimit))}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    autoFocus
                    style={{ border: "none", outline: "none", background: "none", width: "100%", fontSize: fontSize.md - 0.5, color: colors.ink }}
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
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    autoFocus
                    style={{ border: "none", outline: "none", background: "none", width: "100%", fontSize: fontSize.md - 0.5, color: colors.ink }}
                  />
                </>
              )}
            </div>
            {error && <p style={{ color: "#C0392B", fontSize: fontSize.sm, marginBottom: spacing.md }}>{error}</p>}
            <button
              onClick={sendOtp}
              disabled={sending}
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
                opacity: valid && !sending ? 1 : 0.5,
              }}
            >
              {sending ? "Sending…" : "Send OTP"}
              {!sending && <Icon name="arrow" size={18} color={colors.white} />}
            </button>
          </div>
        ) : (
          <div className="login-step">
            <button
              onClick={() => setStep("enter")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: fontSize.sm + 0.5, fontWeight: 600, color: colors.muted, marginBottom: spacing.lg }}
            >
              <Icon name="arrowLeft" size={17} /> Back
            </button>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.02em", marginBottom: spacing.sm }}>
              Enter the code
            </h2>
            <p style={{ color: colors.muted, fontSize: fontSize.sm, lineHeight: 1.5, marginBottom: spacing.lg }}>
              We sent a 6-digit code to <b style={{ color: colors.ink }}>{mode === "phone" ? `${cc} ${digits}` : value}</b>
            </p>
            <div className={shake ? "login-shake" : undefined} style={{ display: "flex", gap: 9, marginBottom: spacing.md }}>
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
            {error && <p style={{ color: "#C0392B", fontSize: fontSize.sm, marginBottom: spacing.md }}>{error}</p>}
            <button
              onClick={verify}
              disabled={verifying}
              className={`login-cta${otpFull ? " is-ready" : ""}`}
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
                opacity: otpFull && !verifying ? 1 : 0.5,
              }}
            >
              {verifying ? "Verifying…" : "Verify & update"}
              {!verifying && <Icon name="check" size={18} color={colors.white} />}
            </button>
            <p style={{ fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.lg, textAlign: "center" }}>
              {secs > 0 ? (
                <>
                  Resend code in <b style={{ color: colors.ink }}>0:{String(secs).padStart(2, "0")}</b>
                </>
              ) : (
                <>
                  Didn&apos;t get it?{" "}
                  <a onClick={resendOtp} style={{ color: colors.primary, fontWeight: 600, cursor: "pointer" }}>
                    Resend OTP
                  </a>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
