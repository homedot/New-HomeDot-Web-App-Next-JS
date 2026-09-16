"use server";

import LandingScreenService, {
  type ContactPayload,
} from "@/services/LandingScreenService";

// Runs the contact form submission on the server via a Server Action, so the
// browser only ever talks to this Next.js route (as a server action call)
// instead of hitting the staging API host directly.
export async function submitContactAction(payload: ContactPayload) {
  const res = await LandingScreenService.submitContact(payload);
  return { success: res.success, message: res.message };
}
