import { tierColors } from "../src/scoring.js";
import { SHIELD_PATH } from "../src/renderCard.js";
import { GOLD_BORDER, PAPER, INK } from "../src/renderCardTcg.js";
import { STAT_DESCRIPTIONS, TIER_BANDS } from "../src/statDescriptions.js";
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

  return `
    <div class="back-title">Scout Report</div>
    <div class="back-mode">Source: ${modeLabel}</div>
    <div class="back-tiers">${tierRow}</div>
    <ul class="back-stats">${statRows}</ul>
    <div class="back-note">Formulas are early estimates, not calibrated against real profiles yet.</div>
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

// Matches the TCG front's gold border, parchment fill, and serif type.
function renderTcgBack(data: CardData): string {
  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <defs>
    <linearGradient id="backBorder" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GOLD_BORDER.from}" />
      <stop offset="1" stop-color="${GOLD_BORDER.to}" />
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="332" height="472" rx="16" fill="url(#backBorder)" stroke="#8A6B1A" stroke-width="2" />
  <rect x="13" y="13" width="314" height="454" rx="11" fill="${PAPER}" />
  <foreignObject x="13" y="13" width="314" height="454">
    <xhtml:div class="back-face" style="color: ${INK}; font-family: Georgia, 'Times New Roman', serif; padding: 22px 22px 18px;">
      ${backContentHtml(data)}
    </xhtml:div>
  </foreignObject>
</svg>`;
}

export function renderCardBack(data: CardData, style: CardStyle): string {
  return style === "tcg" ? renderTcgBack(data) : renderFutBack(data);
}
