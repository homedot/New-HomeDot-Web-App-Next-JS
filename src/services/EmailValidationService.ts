export type EmailValidationStatus =
  | "valid"
  | "invalid"
  | "disposable"
  | "no_mx"
  | "role_based"
  | "unknown";

export interface EmailValidationResult {
  status: EmailValidationStatus;
  isValid: boolean;
  message: string;
  suggestion?: string;
}

// Calls our own /api/validate-email route, which runs the self-hosted
// validation (format, disposable domain, typo suggestion, MX lookup,
// role-based mailbox) — no third-party API or key involved.
export const EmailValidationService = {
  validate: async (email: string): Promise<EmailValidationResult> => {
    try {
      const res = await fetch(`/api/validate-email?email=${encodeURIComponent(email)}`);
      const data = (await res.json()) as EmailValidationResult;
      return {
        status: data.status ?? "unknown",
        isValid: data.isValid ?? true,
        message: data.message ?? "",
        suggestion: data.suggestion,
      };
    } catch {
      return { status: "unknown", isValid: true, message: "" };
    }
  },
};

export default EmailValidationService;
