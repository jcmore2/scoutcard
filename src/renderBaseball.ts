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

// A classic trading-card layout (think: baseball/sports cards from a pack) —
// distributes information differently from the other two styles rather than
// just reskinning the same layout. The front is just identity: photo, name,
// team, position, and one headline stat, the way a real player card leads
// with "who" over "how many." The full 6-stat breakdown lives on the back
// (via the shared card-back view), matching how real cards put the stat
// table on the reverse, not the front.
export function renderBaseball(data: CardData): string {
  const colors = tierColors(data.tier);
  const team = truncate(data.company || "Free Agent", 24);
  const name = truncate(data.name.toUpperCase(), 22);
  const nameSize = singleLineFontSize(name, 260, 26, 15);

  const topStatEntries = Object.entries(data.stats) as [keyof CardData["stats"], number][];
  const topStat = topStatEntries.reduce((best, s) => (s[1] > best[1] ? s : best), topStatEntries[0]);

  const photoY = 58;
  const photoHeight = 250;

  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" font-family="${BB_FONT}">
  <defs>
    <linearGradient id="bbPhoto" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${colors.from}" />
      <stop offset="1" stop-color="${colors.to}" />
    </linearGradient>
  </defs>

  <rect x="4" y="4" width="332" height="472" rx="14" fill="${BB_CREAM}" stroke="${BB_INK}" stroke-opacity="0.7" stroke-width="2" />
  <rect x="14" y="14" width="312" height="452" rx="8" fill="none" stroke="${BB_INK}" stroke-opacity="0.25" stroke-width="1" />

  <text x="170" y="38" font-size="13" font-weight="700" fill="${BB_INK}" text-anchor="middle" letter-spacing="1.5">${escapeXml(team.toUpperCase())}</text>
  ${flagFragment(data.flag, 24, 24, 26, 19, BB_INK)}
  <text x="316" y="38" font-size="10" font-weight="700" fill="${BB_MUTED}" text-anchor="end">${data.tier}</text>

  <rect x="20" y="${photoY}" width="300" height="${photoHeight}" fill="url(#bbPhoto)" stroke="${BB_INK}" stroke-opacity="0.3" stroke-width="1" />
  <circle cx="170" cy="${photoY + photoHeight / 2 - 10}" r="72" fill="#ffffff" fill-opacity="0.25" stroke="${colors.text}" stroke-width="2" stroke-opacity="0.4" />
  <text x="170" y="${photoY + photoHeight / 2 + 2}" font-size="52" font-weight="800" fill="${colors.text}" text-anchor="middle">${escapeXml(initials(data.name))}</text>
  <text x="298" y="${photoY + photoHeight - 14}" font-size="17" font-style="italic" fill="${colors.text}" fill-opacity="0.9" text-anchor="end" font-family="${BB_SCRIPT}">${escapeXml(data.name.split(" ")[0] ?? "")}</text>

  <polygon points="20,${photoY} 62,${photoY} 20,${photoY + 34}" fill="${colors.from}" stroke="${BB_INK}" stroke-opacity="0.4" stroke-width="0.75" />
  <text x="30" y="${photoY + 18}" font-size="11" font-weight="800" fill="${colors.text}">${escapeXml(data.position).slice(0, 3)}</text>

  <text x="170" y="${photoY + photoHeight + 38}" font-size="${nameSize}" font-weight="800" fill="${BB_INK}" text-anchor="middle" letter-spacing="0.5">${escapeXml(name)}</text>
  <text x="170" y="${photoY + photoHeight + 56}" font-size="11" fill="${BB_MUTED}" text-anchor="middle">${escapeXml(data.position)} · ${escapeXml(truncate(data.headline, 40))}</text>

  <line x1="40" y1="${photoY + photoHeight + 70}" x2="300" y2="${photoY + photoHeight + 70}" stroke="${BB_INK}" stroke-opacity="0.2" stroke-width="1" />

  <text x="90" y="${photoY + photoHeight + 100}" font-size="30" font-weight="800" fill="${BB_INK}" text-anchor="middle" data-count-to="${data.overall}">${data.overall}</text>
  <text x="90" y="${photoY + photoHeight + 114}" font-size="9" font-weight="700" fill="${BB_MUTED}" text-anchor="middle" letter-spacing="1">OVERALL</text>

  <text x="250" y="${photoY + photoHeight + 100}" font-size="30" font-weight="800" fill="${BB_INK}" text-anchor="middle" data-count-to="${topStat[1]}">${topStat[1]}</text>
  <text x="250" y="${photoY + photoHeight + 114}" font-size="9" font-weight="700" fill="${BB_MUTED}" text-anchor="middle" letter-spacing="1">TOP: ${topStat[0].toUpperCase()}</text>

  <text x="170" y="464" font-size="8" fill="${BB_MUTED}" opacity="0.8" text-anchor="middle">No. ${String(data.overall).padStart(2, "0")}/99 · ScoutCard · Flip for full stats</text>
</svg>`;
}
