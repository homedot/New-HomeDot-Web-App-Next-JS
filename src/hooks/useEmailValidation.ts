"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EmailValidationService from "@/services/EmailValidationService";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}$/i;

export function isEmailFormatValid(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/** Debounced self-hosted email validation, mirroring homedot-mobile-app's
 * performEmailValidation (UserRegistrationScreen.js /
 * LoginOrRegisterUsingEmailScreen.js) — live feedback while typing, plus
 * `validateNow` for a final check right before a form submits. Talks to our
 * own /api/validate-email route (format, disposable domain, typo suggestion,
 * MX lookup, role-based mailbox — no third-party API). */
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
    setStatus(result.status);

    if (result.isValid) {
      setErrorMessage("");
      setSuccessMessage(
        result.status === "role_based" ? result.message : "Email is valid and ready to use",
      );
      return true;
    }

    setSuccessMessage("");
    setErrorMessage(result.message);
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
