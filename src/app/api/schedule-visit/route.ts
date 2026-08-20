import { NextRequest, NextResponse } from "next/server";

export interface ScheduleVisitRequest {
  name: string;
  phone: string;
  message?: string;
  propertyId: string;
  propertyTitle: string;
  pageUrl?: string;
}

export interface ScheduleVisitResponse {
  ok: boolean;
  error?: string;
}

// Google Sheets treats a cell value starting with +, =, - or @ as the start
// of a formula (e.g. "+91 98765..." becomes "=+91 98765..." -> #ERROR!
// Formula parse error). A leading apostrophe is the standard escape Sheets
// (and Apps Script's setValue/appendRow, which apply the same as-typed
// parsing) use to force plain-text storage, so re-apply it here since phone
// numbers are sent with a "+<dial code>" prefix.
function sheetSafe(value: string): string {
  return /^[+=@-]/.test(value) ? `'${value}` : value;
}

// Server-side proxy to a Google Apps Script Web App bound to the "Schedule a
// visit" Google Sheet, so the (unauthenticated) Apps Script URL never reaches
// the browser. Mirrors the validate-email route's proxy pattern.
export async function POST(request: NextRequest) {
  let body: Partial<ScheduleVisitRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" } satisfies ScheduleVisitResponse,
      { status: 400 },
    );
  }

  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const propertyId = body.propertyId?.trim() ?? "";
  const propertyTitle = body.propertyTitle?.trim() ?? "";

  if (!name || !phone || !propertyId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Name, phone, and property are required",
      } satisfies ScheduleVisitResponse,
      { status: 400 },
    );
  }

  const sheetsUrl = process.env.GOOGLE_SHEETS_SCHEDULE_VISIT_URL;
  if (!sheetsUrl) {
    console.error("GOOGLE_SHEETS_SCHEDULE_VISIT_URL is not configured");
    return NextResponse.json(
      {
        ok: false,
        error: "Scheduling is temporarily unavailable",
      } satisfies ScheduleVisitResponse,
      { status: 500 },
    );
  }

  try {
    const sheetRes = await fetch(sheetsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: sheetSafe(name),
        phone: sheetSafe(phone),
        message: sheetSafe(body.message?.trim() ?? ""),
        propertyId,
        propertyTitle,
        pageUrl: body.pageUrl?.trim() ?? "",
      }),
    });

    if (!sheetRes.ok) {
      throw new Error(`Sheet responded with ${sheetRes.status}`);
    }

    return NextResponse.json({ ok: true } satisfies ScheduleVisitResponse);
  } catch (error) {
    console.error("Schedule visit sheet write failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not save your request. Please call us directly.",
      } satisfies ScheduleVisitResponse,
      { status: 502 },
    );
  }
}
