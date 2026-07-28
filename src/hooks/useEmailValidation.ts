"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EmailValidationService from "@/services/EmailValidationService";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

export function isEmailFormatValid(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

function messageFor(status: string): string {
  switch (status) {
    case "invalid":
      return "This email address appears to be invalid.";
    case "catch-all":
      return "This domain accepts all emails and can't be fully validated.";
    case "spamtrap":
    case "abuse":
    case "do_not_mail":
      return "This email cannot be used. Please try another.";
    default:
      return "Unable to validate this email. Please check and try again.";
  }
}

/** Debounced ZeroBounce email validation, mirroring homedot-mobile-app's
 * performZeroBounceValidation (UserRegistrationScreen.js /
 * LoginOrRegisterUsingEmailScreen.js) — live feedback while typing, plus
 * `validateNow` for a final check right before a form submits. Talks to our
 * own /api/validate-email route, never ZeroBounce directly. */
export function useEmailValidation(debounceMs = 800) {
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateNow = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !isEmailFormatValid(email)) {
      setStatus(null);
      setErrorMessage("Please enter a valid email address.");
      setSuccessMessage("");
      return false;
    }

    setIsValidating(true);
    setStatus("checking");
    const result = await EmailValidationService.validate(email);
    setIsValidating(false);

    if (result.status === "valid") {
      setStatus("valid");
      setErrorMessage("");
      setSuccessMessage("Email is valid and ready to use");
      return true;
    }

    // Validation service unreachable/unconfigured — don't block the user on
    // an outage, just fall back to the format check already passed above.
    if (result.status === "unknown") {
      setStatus("unknown");
      setErrorMessage("");
      setSuccessMessage("");
      return true;
    }

    setStatus(result.status);
    setSuccessMessage("");
    setErrorMessage(messageFor(result.status));
    return false;
  }, []);

  const onEmailChange = useCallback(
    (email: string) => {
      setErrorMessage("");
      setSuccessMessage("");
      if (timer.current) clearTimeout(timer.current);

      if (email && isEmailFormatValid(email)) {
        timer.current = setTimeout(() => {
          void validateNow(email);
        }, debounceMs);
      } else {
        setStatus(null);
      }
    },
    [debounceMs, validateNow],
  );

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setIsValidating(false);
    setStatus(null);
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return {
    isValidating,
    status,
    errorMessage,
    successMessage,
    onEmailChange,
    validateNow,
    reset,
  };
}
