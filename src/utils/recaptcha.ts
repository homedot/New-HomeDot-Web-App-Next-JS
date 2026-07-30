declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    __recaptchaScriptLoad?: Promise<void>;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

function loadScript(): Promise<void> {
  if (window.grecaptcha) return Promise.resolve();
  if (window.__recaptchaScriptLoad) return window.__recaptchaScriptLoad;

  window.__recaptchaScriptLoad = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
    document.head.appendChild(script);
  });
  return window.__recaptchaScriptLoad;
}

/** Mirrors recaptcha-test.html's generate() flow exactly (same script URL, same
 * ready/execute sequence) since that's the token shape the backend accepts. */
export async function getRecaptchaToken(action: string): Promise<string> {
  await loadScript();
  return new Promise((resolve, reject) => {
    window.grecaptcha!.ready(() => {
      window.grecaptcha!.execute(SITE_KEY, { action }).then(resolve).catch(reject);
    });
  });
}
