import type { NextConfig } from "next";

// These have no runtime fallback (see ApiConstants.ts / recaptcha.ts) — every
// page depends on the API base URL and reCAPTCHA silently no-ops without a
// site key, so fail the build/dev server up front instead of shipping a
// bundle that throws for every visitor.
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_API_STAGING_BASE_URL",
  "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
] as const;

const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missingEnvVars.join(", ")}. Set them in .env before running dev/build.`,
  );
}

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
