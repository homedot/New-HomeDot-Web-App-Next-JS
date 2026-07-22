/** #rgb/#rrggbb → "r, g, b" for use inside an rgba() string — this app's
 * palette tokens (colors.accent etc.) are hex, but tinted chip/icon
 * backgrounds need an alpha channel, so this avoids hand-maintaining a
 * parallel rgba palette. */
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}
