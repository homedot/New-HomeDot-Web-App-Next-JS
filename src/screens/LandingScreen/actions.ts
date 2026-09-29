"use server";

import LandingScreenService, {
  type ContactPayload,
} from "@/services/LandingScreenService";

// Mirrors the client-side checks in LandingScreen's ContactSection — a
// Server Action is a public endpoint in its own right (callable directly,
// bypassing the browser form), so garbage input must be rejected here too,
// not just in the UI. Kept as plain regexes (not imported from
// useEmailValidation.ts) since that module is "use client" and pulling it
// into this "use server" file would drag its React-hook code along.
const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]{1,49}$/;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
const MESSAGE_MIN_LENGTH = 10;

// Runs the contact form submission on the server via a Server Action, so the
// browser only ever talks to this Next.js route (as a server action call)
// instead of hitting the staging API host directly.
export async function submitContactAction(payload: ContactPayload) {
  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const message = payload.message?.trim() ?? "";

  if (!NAME_PATTERN.test(name)) {
    return {
      success: false,
      message: "Enter a valid name using letters only.",
    };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, message: "Enter a valid email address." };
  }
  if (message.length < MESSAGE_MIN_LENGTH) {
    return {
      success: false,
      message: `Please write a message of at least ${MESSAGE_MIN_LENGTH} characters.`,
    };
  }

  const res = await LandingScreenService.submitContact({
    name,
    email,
    message,
  });
  return { success: res.success, message: res.message };
}
