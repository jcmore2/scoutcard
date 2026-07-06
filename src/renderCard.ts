import type { CardData } from "./types.js";
import { tierColors } from "./scoring.js";
import { escapeXml, initials, truncate, flagFragment } from "./cardTextUtils.js";

const STAT_LABELS: [key: keyof CardData["stats"], label: string][] = [
  ["pac", "PAC"],
  ["sho", "SHO"],
  ["pas", "PAS"],
  ["dri", "DRI"],
  ["def", "DEF"],
  ["phy", "PHY"],
];

// A shield/pentagon silhouette (flat wide top, straight sides, tapering to
// a point at the bottom) rather than a plain rounded rectangle — the shape
// sports-card-style ratings cards use. The taper only kicks in near the
// bottom so the stat grid still gets the full card width.
const SHIELD_PATH =
  "M 34 6 L 306 6 Q 334 6 334 34 L 334 396 Q 334 414 320 424 L 316 428 L 194 468 Q 170 480 146 468 L 24 428 L 20 424 Q 6 414 6 396 L 6 34 Q 6 6 34 6 Z";

// Real names never wrap to 2 lines on this style — the font auto-shrinks to
// fit one line instead. Rough width estimate for a bold condensed face.
function singleLineFontSize(text: string, maxWidth: number, maxSize: number, minSize: number): number {
  const estimatedWidth = text.length * maxSize * 0.62;
  if (estimatedWidth <= maxWidth) return maxSize;
  const scaled = Math.floor(maxWidth / (text.length * 0.62));
  return Math.max(minSize, Math.min(maxSize, scaled));
}

export function renderCard(data: CardData): string {
  const colors = tierColors(data.tier);
  const name = truncate(data.name.toUpperCase(), 26);
  const nameSize = singleLineFontSize(name, 260, 24, 12);
  const headline = escapeXml(data.headline);
  const leftStats = STAT_LABELS.slice(0, 3);
  const rightStats = STAT_LABELS.slice(3);

  const statRow = (
    [key, label]: [keyof CardData["stats"], string],
    x: number,
    y: number,
  ) => `
    <text x="${x}" y="${y}" font-size="19" font-weight="800" fill="${colors.text}" font-family="'Arial Black', Arial, sans-serif">${data.stats[key]}</text>
    <text x="${x + 32}" y="${y}" font-size="13" font-weight="700" fill="${colors.text}" font-family="Arial, sans-serif" opacity="0.85">${label}</text>`;

  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.from}" />
      <stop offset="0.55" stop-color="${colors.to}" />
      <stop offset="1" stop-color="${colors.from}" />
    </linearGradient>
    <radialGradient id="cardSheen" cx="0.3" cy="0.08" r="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <pattern id="cardTexture" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="${colors.text}" stroke-opacity="0.05" stroke-width="4" />
    </pattern>
    <clipPath id="shieldClip">
      <path d="${SHIELD_PATH}" />
    </clipPath>
  </defs>

  <path d="${SHIELD_PATH}" fill="url(#cardBg)" stroke="${colors.text}" stroke-opacity="0.35" stroke-width="2" />
  <path d="${SHIELD_PATH}" fill="url(#cardTexture)" />
  <path d="${SHIELD_PATH}" fill="url(#cardSheen)" />

  <g clip-path="url(#shieldClip)">
    <text x="26" y="72" font-size="46" font-weight="800" fill="${colors.text}" font-family="'Arial Black', Arial, sans-serif">${data.overall}</text>
    <text x="26" y="96" font-size="15" font-weight="700" fill="${colors.text}" opacity="0.9">${escapeXml(data.position)}</text>

    ${flagFragment(data.flag, 26, 110, 32, 24, colors.text)}
    ${
      data.company
        ? `<rect x="24" y="140" width="118" height="19" rx="4" fill="${colors.text}" fill-opacity="0.16" />
    <text x="30" y="153" font-size="9.5" font-weight="700" fill="${colors.text}">${escapeXml(truncate(data.company, 16))}</text>`
        : ""
    }

    <text x="312" y="34" font-size="12" font-weight="800" fill="${colors.text}" opacity="0.85" text-anchor="end">${data.tier}</text>
    <text x="312" y="48" font-size="8" font-weight="700" fill="${colors.text}" opacity="0.55" text-anchor="end">${data.mode === "SCOUT" ? "PDF SCOUT" : "FULL EXPORT"}</text>

    <circle cx="170" cy="172" r="64" fill="#ffffff" fill-opacity="0.22" stroke="${colors.text}" stroke-width="2" stroke-opacity="0.45" />
    <text x="170" y="187" font-size="46" font-weight="800" fill="${colors.text}" text-anchor="middle">${escapeXml(initials(data.name))}</text>

    <rect x="6" y="266" width="328" height="34" fill="${colors.text}" fill-opacity="0.14" />
    <text x="170" y="289" font-size="${nameSize}" font-weight="800" fill="${colors.text}" text-anchor="middle" letter-spacing="0.5">${escapeXml(name)}</text>

    <text x="170" y="316" font-size="11" fill="${colors.text}" text-anchor="middle" opacity="0.8">${headline.length > 40 ? headline.slice(0, 37) + "…" : headline}</text>
    <text x="170" y="332" font-size="12" font-weight="700" fill="${colors.text}" text-anchor="middle" opacity="0.9">${escapeXml(data.archetype)}</text>

    ${leftStats.map((s, i) => statRow(s, 42, 360 + i * 30)).join("\n")}
    ${rightStats.map((s, i) => statRow(s, 192, 360 + i * 30)).join("\n")}
  </g>
</svg>`;
}
