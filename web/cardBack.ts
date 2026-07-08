import { tierColors } from "../src/scoring.js";
import { SHIELD_PATH } from "../src/renderCard.js";
import { GOLD_BORDER, BORDER_EDGE, PAPER, INK, TCG_FONT } from "../src/renderCardTcg.js";
import { BB_CREAM, BB_INK, BB_FONT } from "../src/renderBaseball.js";
import { STAT_DESCRIPTIONS, TIER_BANDS, SCORING_VERSION } from "../src/statDescriptions.js";
import type { CardData, CardStyle, Stats } from "../src/types.js";

const STAT_ORDER: (keyof Stats)[] = ["pac", "sho", "pas", "dri", "def", "phy"];

function escapeHtml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

function backContentHtml(data: CardData): string {
  const descriptions = STAT_DESCRIPTIONS[data.mode];
  const modeLabel = data.mode === "SCOUT" ? "PDF Scout" : "Full Export";

  const tierRow = TIER_BANDS.map(
    (band) => `<span class="back-tier${band.label === data.tier ? " current" : ""}">${band.label} ${band.range}</span>`,
  ).join("");

  const statRows = STAT_ORDER.map(
    (key) => `
      <li>
        <span class="back-stat-key">${key.toUpperCase()} ${data.stats[key]}</span>
        <span class="back-stat-desc">${escapeHtml(descriptions[key])}</span>
      </li>`,
  ).join("");

  const profileLink = data.profileUrl
    ? `<a class="back-link" href="${escapeHtml(data.profileUrl)}" target="_blank" rel="noopener">${escapeHtml(data.profileUrl.replace(/^https?:\/\//, ""))}</a>`
    : "";

  return `
    <div class="back-title">Scout Report</div>
    <div class="back-mode">Source: ${modeLabel} · Scoring ${SCORING_VERSION}</div>
    <div class="back-tiers">${tierRow}</div>
    <ul class="back-stats">${statRows}</ul>
    <div class="back-note">Formulas are early estimates, not calibrated against real profiles yet.</div>
    ${profileLink}
    <div class="back-hint">Tap to flip back</div>`;
}

// Matches the FUT front's shield silhouette, gradient, and sans-serif type
// exactly (same SHIELD_PATH import) instead of a plain rectangle.
function renderFutBack(data: CardData): string {
  const colors = tierColors(data.tier);
  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <defs>
    <linearGradient id="backBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.from}" />
      <stop offset="0.55" stop-color="${colors.to}" />
      <stop offset="1" stop-color="${colors.from}" />
    </linearGradient>
    <clipPath id="backShieldClip"><path d="${SHIELD_PATH}" /></clipPath>
  </defs>
  <path d="${SHIELD_PATH}" fill="url(#backBg)" stroke="${colors.text}" stroke-opacity="0.4" stroke-width="3" />
  <foreignObject x="0" y="0" width="340" height="480" clip-path="url(#backShieldClip)">
    <xhtml:div class="back-face" style="color: ${colors.text}; font-family: Arial, sans-serif; padding: 34px 28px 30px;">
      ${backContentHtml(data)}
    </xhtml:div>
  </foreignObject>
</svg>`;
}

// Matches the TCG front's yellow border, parchment fill, and rounded
// sans-serif type.
function renderTcgBack(data: CardData): string {
  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <defs>
    <linearGradient id="backBorder" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GOLD_BORDER.from}" />
      <stop offset="1" stop-color="${GOLD_BORDER.to}" />
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="332" height="472" rx="16" fill="url(#backBorder)" stroke="${BORDER_EDGE}" stroke-width="2.5" />
  <rect x="13" y="13" width="314" height="454" rx="11" fill="${PAPER}" />
  <foreignObject x="13" y="13" width="314" height="454">
    <xhtml:div class="back-face" style="color: ${INK}; font-family: ${TCG_FONT}; padding: 22px 22px 18px;">
      ${backContentHtml(data)}
    </xhtml:div>
  </foreignObject>
</svg>`;
}

// Matches the baseball front's cream cardstock and geometric sans-serif type.
function renderBaseballBack(data: CardData): string {
  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <rect x="4" y="4" width="332" height="472" rx="14" fill="${BB_CREAM}" stroke="${BB_INK}" stroke-opacity="0.7" stroke-width="2" />
  <rect x="14" y="14" width="312" height="452" rx="8" fill="none" stroke="${BB_INK}" stroke-opacity="0.25" stroke-width="1" />
  <foreignObject x="14" y="14" width="312" height="452">
    <xhtml:div class="back-face" style="color: ${BB_INK}; font-family: ${BB_FONT}; padding: 22px 22px 18px;">
      ${backContentHtml(data)}
    </xhtml:div>
  </foreignObject>
</svg>`;
}

export function renderCardBack(data: CardData, style: CardStyle): string {
  if (style === "tcg") return renderTcgBack(data);
  if (style === "baseball") return renderBaseballBack(data);
  return renderFutBack(data);
}
