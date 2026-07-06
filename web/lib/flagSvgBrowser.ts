import { wrapFlagSvg, normalizeCountryCode } from "../../src/flag.js";
import type { FlagGraphic } from "../../src/types.js";

// Flags are served from web/public/flags (copied from the flag-icons
// package) as plain static files, fetched relative to the page — same
// mechanism as every other asset, no bundler magic and no third-party
// request (unlike a hosted flag/logo API, this never leaves the site).
export async function loadFlagGraphic(countryCode: string): Promise<FlagGraphic | null> {
  const cc = normalizeCountryCode(countryCode);
  if (!cc) return null;

  const res = await fetch(`./flags/${cc}.svg`);
  if (!res.ok) return null;
  return wrapFlagSvg(await res.text());
}
