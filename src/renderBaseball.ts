import type { CardData } from "./types.js";
import { tierColors } from "./scoring.js";
import { escapeXml, initials, truncate, flagFragment } from "./cardTextUtils.js";

// Exported so the interactive card back can match this style too.
export const BB_CREAM = "#F5F1E8";
export const BB_INK = "#1A1712";
export const BB_MUTED = "#5C5648";
export const BB_FONT = "'Futura', 'Century Gothic', Arial, sans-serif";
export const BB_SCRIPT = "'Segoe Script', 'Bradley Hand', cursive";

function singleLineFontSize(text: string, maxWidth: number, maxSize: number, minSize: number): number {
  const estimatedWidth = text.length * maxSize * 0.6;
  if (estimatedWidth <= maxWidth) return maxSize;
  return Math.max(minSize, Math.floor(maxWidth / (text.length * 0.6)));
}

// A short 2-3 letter "team code" the way real franchises abbreviate
// (BOS, LAD, NYY) — initials of up to 3 words, or the first 3 letters of a
// single-word name.
function teamCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return (words[0] ?? "").slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// A jagged "rated" seal outline — the starburst badge real sports-card sets
// stamp a rating or rookie callout inside.
function sunburstPoints(cx: number, cy: number, rOuter: number, rInner: number, spikes: number): string {
  const points: string[] = [];
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = i * step - Math.PI / 2;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}

// A classic sports-card layout — full-bleed photo, a colored team nameplate,
// a pennant and position patch, a facsimile signature, and an overall-rating
// "seal" badge rather than a stat grid, the way a real base card leads with
// "who" over "how many." The full 6-stat breakdown lives on the back (via
// the shared card-back view), matching how real cards put the stat table on
// the reverse, not the front.
export function renderBaseball(data: CardData): string {
  const colors = tierColors(data.tier);
  const team = truncate(data.company || "Free Agent", 24);
  const name = truncate(data.name.toUpperCase(), 22);
  const nameSize = singleLineFontSize(name, 260, 22, 13);
  const position = data.position.slice(0, 3).toUpperCase();

  const photoX = 20;
  const photoY = 20;
  const photoW = 300;
  const photoH = 286;
  const seamY = photoY + photoH; // 306 — photo/nameplate boundary
  const nameplateH = 56;
  const footerTop = seamY + nameplateH; // 362

  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" font-family="${BB_FONT}">
  <defs>
    <linearGradient id="bbPhoto" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.from}" />
      <stop offset="1" stop-color="${colors.to}" />
    </linearGradient>
    <radialGradient id="bbSheen" cx="0.32" cy="0.1" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect x="4" y="4" width="332" height="472" rx="10" fill="${BB_CREAM}" stroke="${BB_INK}" stroke-opacity="0.65" stroke-width="2" />
  <rect x="14" y="14" width="312" height="452" rx="6" fill="none" stroke="${BB_INK}" stroke-opacity="0.2" stroke-width="1" />

  ${
    data.photo
      ? `<clipPath id="bbPhotoClip"><rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" /></clipPath>
  <image href="${data.photo}" x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" clip-path="url(#bbPhotoClip)" preserveAspectRatio="xMidYMid slice" />
  <rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" fill="none" stroke="${BB_INK}" stroke-opacity="0.3" stroke-width="1" />`
      : `<rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" fill="url(#bbPhoto)" stroke="${BB_INK}" stroke-opacity="0.3" stroke-width="1" />
  <text x="170" y="${photoY + photoH / 2}" dominant-baseline="central" text-anchor="middle" font-size="150" font-weight="800" fill="${colors.text}" fill-opacity="0.14">${escapeXml(initials(data.name))}</text>`
  }
  <rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" fill="url(#bbSheen)" />

  <polygon points="${photoX},${photoY} ${photoX + 76},${photoY} ${photoX + 60},${photoY + 26} ${photoX},${photoY + 26}" fill="${colors.to}" stroke="${BB_INK}" stroke-opacity="0.4" stroke-width="0.75" />
  <text x="${photoX + 10}" y="${photoY + 18}" font-size="12" font-weight="800" fill="${BB_CREAM}" letter-spacing="0.5">${escapeXml(teamCode(team))}</text>

  ${flagFragment(data.flag, photoX + photoW - 42, photoY + 4, 28, 20, BB_CREAM)}
  <text x="${photoX + photoW - 8}" y="${photoY + 42}" font-size="9" font-weight="800" fill="${BB_CREAM}" fill-opacity="0.85" text-anchor="end" letter-spacing="0.5">${data.tier}</text>

  <text x="170" y="250" font-size="21" font-style="italic" fill="${colors.text}" fill-opacity="0.85" text-anchor="middle" font-family="${BB_SCRIPT}" transform="rotate(-4 170 250)">${escapeXml(data.name.split(" ")[0] ?? "")}</text>

  <polygon points="${sunburstPoints(56, seamY, 30, 20, 10)}" fill="${colors.to}" stroke="${BB_CREAM}" stroke-width="3" stroke-linejoin="round" />
  <polygon points="${sunburstPoints(56, seamY, 30, 20, 10)}" fill="none" stroke="${BB_INK}" stroke-opacity="0.3" stroke-width="1" stroke-linejoin="round" />
  <text x="56" y="${seamY - 6}" font-size="18" font-weight="800" fill="${BB_CREAM}" text-anchor="middle" data-count-to="${data.overall}">${data.overall}</text>
  <text x="56" y="${seamY + 8}" font-size="7" font-weight="700" fill="${BB_CREAM}" fill-opacity="0.85" text-anchor="middle" letter-spacing="0.5">RATED</text>

  <circle cx="284" cy="${seamY}" r="26" fill="${colors.to}" stroke="${BB_CREAM}" stroke-width="3" />
  <circle cx="284" cy="${seamY}" r="26" fill="none" stroke="${BB_INK}" stroke-opacity="0.3" stroke-width="1" />
  <text x="284" y="${seamY + 5}" font-size="15" font-weight="800" fill="${BB_CREAM}" text-anchor="middle">${escapeXml(position)}</text>

  <rect x="${photoX}" y="${seamY}" width="${photoW}" height="${nameplateH}" fill="${colors.to}" stroke="${BB_INK}" stroke-opacity="0.3" stroke-width="1" />
  <text x="170" y="${seamY + 30}" font-size="${nameSize}" font-weight="800" fill="${BB_CREAM}" text-anchor="middle" letter-spacing="0.5">${escapeXml(name)}</text>
  <text x="170" y="${seamY + 46}" font-size="10" font-weight="700" fill="${BB_CREAM}" fill-opacity="0.85" text-anchor="middle" letter-spacing="1">${escapeXml(truncate(team, 20).toUpperCase())} · ${escapeXml(data.position)}</text>

  <text x="170" y="${footerTop + 18}" font-size="10.5" fill="${BB_MUTED}" text-anchor="middle">${escapeXml(truncate(data.headline, 44))}</text>
  <text x="170" y="${footerTop + 38}" font-size="12" font-weight="800" fill="${colors.to}" text-anchor="middle" letter-spacing="1">${escapeXml(data.archetype.toUpperCase())}</text>

  <line x1="40" y1="${footerTop + 50}" x2="300" y2="${footerTop + 50}" stroke="${BB_INK}" stroke-opacity="0.2" stroke-width="1" />

  <text x="170" y="${footerTop + 78}" font-size="8" fill="${BB_MUTED}" opacity="0.85" text-anchor="middle" letter-spacing="0.5">SCOUTCARD · FLIP FOR FULL STATS</text>
  <text x="170" y="${footerTop + 94}" font-size="8" fill="${BB_MUTED}" opacity="0.7" text-anchor="middle">No. ${String(data.overall).padStart(2, "0")}/99</text>
</svg>`;
}
