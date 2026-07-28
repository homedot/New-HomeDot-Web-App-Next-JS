"use client";

import { forwardRef, useEffect, useImperativeHandle, type CSSProperties } from "react";
import { colors } from "@/constants/colors";
import { fontSize } from "@/utils/size";
import Icon from "@/components/Icon";
import { useEmailValidation } from "@/hooks/useEmailValidation";

export interface EmailFieldHandle {
  /** Runs (or re-runs) ZeroBounce validation immediately and resolves
   * whether the email is usable — call this right before a form submits. */
  validate: () => Promise<boolean>;
}

/** Email input wired to ZeroBounce validation (mirrors homedot-mobile-app's
 * handleEmailChange/performZeroBounceValidation): debounced live feedback
 * while typing, plus an imperative `validate()` for submit-time gating.
 * `readOnly` fields (an email already OTP-verified earlier in a flow) skip
 * validation entirely. */
const EmailField = forwardRef<
  EmailFieldHandle,
  {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    wrapStyle: CSSProperties;
    inputStyle: CSSProperties;
  }
>(function EmailField(
  { value, onChange, readOnly, autoFocus, placeholder = "you@email.com", onKeyDown, wrapStyle, inputStyle },
  ref,
) {
  const { isValidating, status, errorMessage, successMessage, onEmailChange, validateNow, reset } =
    useEmailValidation();

  useImperativeHandle(ref, () => ({
    validate: () => validateNow(value.trim()),
  }));

  useEffect(() => {
    if (!value) reset();
  }, [value, reset]);

  const statusMessage = readOnly ? "" : errorMessage || successMessage;
  const statusColor = errorMessage ? "#C0392B" : "#1F8A5B";

  return (
    <>
      <div style={wrapStyle}>
        <Icon name="mail" size={18} color={colors.muted} />
        <input
          type="email"
          inputMode="email"
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          autoFocus={autoFocus}
          onChange={(e) => {
            onChange(e.target.value);
            if (!readOnly) onEmailChange(e.target.value);
          }}
          onKeyDown={onKeyDown}
          style={inputStyle}
        />
        {!readOnly && isValidating && (
          <span style={{ fontSize: fontSize.xs, color: colors.muted, flexShrink: 0 }}>
            Checking…
          </span>
        )}
        {!readOnly && !isValidating && status === "valid" && (
          <Icon name="check" size={16} color="#1F8A5B" />
        )}
      </div>
      {statusMessage && (
        <p style={{ fontSize: fontSize.xs, color: statusColor, margin: "4px 0 0" }}>
          {statusMessage}
        </p>
      )}
    </>
  );
});

export default EmailField;
