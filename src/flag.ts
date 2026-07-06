import type { FlagGraphic } from "./types.js";

// Extracts the inner markup + viewBox from a flag-icons SVG file so it can
// be re-embedded as a nested <svg> at whatever position/size a card needs,
// without pulling in an XML parser — these files are simple and consistent
// enough that a couple of regexes are reliable.
export function wrapFlagSvg(raw: string): FlagGraphic {
  const viewBoxMatch = raw.match(/viewBox="([^"]+)"/);
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/\sid="[^"]*"/g, ""); // avoid id collisions if ever embedded twice
  return { viewBox: viewBoxMatch ? viewBoxMatch[1] : "0 0 640 480", inner };
}

export function normalizeCountryCode(code: string): string | null {
  const trimmed = code.trim().toLowerCase();
  return /^[a-z]{2}$/.test(trimmed) ? trimmed : null;
}
