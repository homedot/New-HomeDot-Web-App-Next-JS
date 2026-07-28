export type EmailValidationStatus =
  | "valid"
  | "invalid"
  | "catch-all"
  | "unknown"
  | "spamtrap"
  | "abuse"
  | "do_not_mail"
  | string;

export interface EmailValidationResult {
  status: EmailValidationStatus;
  subStatus: string | null;
}

// Calls our own /api/validate-email route rather than ZeroBounce directly —
// that route holds the API key server-side. Never call ZeroBounce from the
// browser. Not routed through ApiService since this hits a same-origin Next.js
// route, not the BASE_URL backend, and needs no auth token.
export const EmailValidationService = {
  validate: async (email: string): Promise<EmailValidationResult> => {
    try {
      const res = await fetch(
        `/api/validate-email?email=${encodeURIComponent(email)}`,
      );
      const data = (await res.json()) as EmailValidationResult;
      return {
        status: data.status ?? "unknown",
        subStatus: data.subStatus ?? null,
      };
    } catch {
      return { status: "unknown", subStatus: null };
    }
  },
};

export default EmailValidationService;
