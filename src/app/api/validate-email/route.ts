import { NextRequest, NextResponse } from "next/server";

const ZEROBOUNCE_API_URL = "https://api.zerobounce.net/v2/validate";
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

export interface ValidateEmailResponse {
  status: string;
  subStatus: string | null;
}

// Server-side proxy for ZeroBounce (mirrors homedot-mobile-app's
// performZeroBounceValidation) so ZEROBOUNCE_API_KEY never reaches the
// browser — the mobile app calls ZeroBounce directly with the key embedded
// in the client bundle, which is fine for a signed app binary but would
// expose the key in page source/network tab on the web.
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim() ?? "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { status: "invalid", subStatus: null } satisfies ValidateEmailResponse,
      { status: 400 },
    );
  }

  const apiKey = process.env.ZEROBOUNCE_API_KEY;
  if (!apiKey) {
    console.error("ZEROBOUNCE_API_KEY is not configured");
    return NextResponse.json({
      status: "unknown",
      subStatus: null,
    } satisfies ValidateEmailResponse);
  }

  const url = new URL(ZEROBOUNCE_API_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("email", email);

  try {
    const zbRes = await fetch(url.toString());
    const data = await zbRes.json();
    return NextResponse.json({
      status: typeof data.status === "string" ? data.status : "unknown",
      subStatus: typeof data.sub_status === "string" ? data.sub_status : null,
    } satisfies ValidateEmailResponse);
  } catch (error) {
    console.error("ZeroBounce API error:", error);
    return NextResponse.json({
      status: "unknown",
      subStatus: null,
    } satisfies ValidateEmailResponse);
  }
}
