import dns from "node:dns";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}$/i;

export type EmailValidationStatus =
  | "valid"
  | "invalid"
  | "disposable"
  | "no_mx"
  | "role_based"
  | "unknown";

export interface ValidateEmailResponse {
  status: EmailValidationStatus;
  isValid: boolean;
  message: string;
  suggestion?: string;
}

// Common throwaway / temp-mail domains — mirrors ZeroBounce's old disposable flag.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail2.com",
  "tempmailo.com",
  "tempmailer.com",
  "tempomail.fr",
  "tempinbox.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "throwawaymail.com",
  "getnada.com",
  "trashmail.com",
  "trashmail.net",
  "trashmailer.com",
  "dispostable.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "fake-mail.net",
  "mailnesia.com",
  "mintemail.com",
  "mytemp.email",
  "spamgourmet.com",
  "pokemail.net",
  "spam4.me",
  "mailcatch.com",
  "mailnull.com",
  "moakt.com",
  "emailondeck.com",
  "inboxkitten.com",
  "mohmal.com",
  "crazymailing.com",
  "discard.email",
  "discardmail.com",
  "emailsensei.com",
  "harakirimail.com",
  "jetable.org",
  "mailexpire.com",
  "mailforspam.com",
  "mailimate.com",
  "meltmail.com",
  "mt2015.com",
  "no-spam.ws",
  "nowmymail.com",
  "objectmail.com",
  "oneoffemail.com",
  "rcpt.at",
  "sneakemail.com",
  "spambob.com",
  "spamex.com",
  "spaml.com",
  "thankyou2010.com",
  "trash2009.com",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "wegwerfmail.org",
  "zippymail.info",
  "maildrop.cc",
  "mailsac.com",
  "burnermail.io",
  "guerrillamail.com.ar",
  "einrot.com",
  "spamfree24.org",
  "mailbox52.ga",
]);

// Shared/functional mailboxes — ZeroBounce used to surface these as "role_based".
const ROLE_LOCAL_PARTS = new Set([
  "admin",
  "administrator",
  "support",
  "info",
  "sales",
  "contact",
  "help",
  "webmaster",
  "postmaster",
  "noreply",
  "no-reply",
  "donotreply",
  "abuse",
  "billing",
  "marketing",
  "press",
  "careers",
  "jobs",
  "hr",
  "office",
  "team",
  "hello",
  "service",
  "enquiry",
  "enquiries",
]);

// Popular domains used for "did you mean…" typo suggestions.
const POPULAR_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "hotmail.com",
  "outlook.com",
  "outlook.in",
  "icloud.com",
  "aol.com",
  "live.com",
  "protonmail.com",
  "rediffmail.com",
];

const getDomain = (email: string): string => {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : "";
};

const getLocalPart = (email: string): string => {
  const parts = email.split("@");
  return parts.length === 2 ? parts[0].toLowerCase() : "";
};

// Minimal edit-distance so "gmial.com" → suggests "gmail.com".
const levenshtein = (a: string, b: string): number => {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
};

const suggestDomain = (domain: string): string | null => {
  if (!domain || POPULAR_DOMAINS.includes(domain)) return null;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of POPULAR_DOMAINS) {
    const distance = levenshtein(domain, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return bestDistance > 0 && bestDistance <= 2 ? best : null;
};

type MxResult = "ok" | "no_mx" | "nxdomain" | "unknown";

// Server-side MX lookup (Node's dns module — no external API/key needed) to
// confirm the domain can actually receive mail — the one check regex alone can't do.
const checkDomainHasMailServer = (domain: string): Promise<MxResult> =>
  new Promise((resolve) => {
    dns.resolveMx(domain, (error, addresses) => {
      if (error) {
        resolve(error.code === "ENOTFOUND" || error.code === "ENODATA" ? "nxdomain" : "unknown");
        return;
      }
      resolve(addresses && addresses.length > 0 ? "ok" : "no_mx");
    });
  });

/**
 * Validates an email the way ZeroBounce used to, without any external paid
 * API: format → disposable-domain → typo suggestion → MX/domain existence →
 * role-based mailbox.
 */
async function validateEmail(email: string): Promise<ValidateEmailResponse> {
  const trimmed = email.trim();

  if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
    return {
      status: "invalid",
      isValid: false,
      message: "Invalid email format. Please enter a valid email address.",
    };
  }

  const domain = getDomain(trimmed);
  const localPart = getLocalPart(trimmed);

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      status: "disposable",
      isValid: false,
      message: "Temporary or disposable email addresses aren't allowed. Please use a permanent email.",
    };
  }

  const suggestion = suggestDomain(domain);
  if (suggestion) {
    return {
      status: "invalid",
      isValid: false,
      message: `This email looks like it might have a typo. Did you mean ${localPart}@${suggestion}?`,
      suggestion: `${localPart}@${suggestion}`,
    };
  }

  const mxResult = await checkDomainHasMailServer(domain);
  if (mxResult === "nxdomain") {
    return { status: "no_mx", isValid: false, message: "This email domain doesn't exist." };
  }
  if (mxResult === "no_mx") {
    return { status: "no_mx", isValid: false, message: "This domain can't receive emails." };
  }
  if (mxResult === "unknown") {
    // DNS lookup failed/timed out — don't block the user over a transient
    // network issue, fall back to the checks already done.
    return { status: "unknown", isValid: true, message: "" };
  }

  if (ROLE_LOCAL_PARTS.has(localPart)) {
    return {
      status: "role_based",
      isValid: true,
      message: "This looks like a shared/role-based email address.",
    };
  }

  return { status: "valid", isValid: true, message: "" };
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim() ?? "";

  if (!email) {
    return NextResponse.json(
      { status: "invalid", isValid: false, message: "Please enter your email." } satisfies ValidateEmailResponse,
      { status: 400 },
    );
  }

  const result = await validateEmail(email);
  return NextResponse.json(result);
}
