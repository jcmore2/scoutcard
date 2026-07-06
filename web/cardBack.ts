import { tierColors } from "../src/scoring.js";
import { STAT_DESCRIPTIONS, TIER_BANDS } from "../src/statDescriptions.js";
import type { CardData, Stats } from "../src/types.js";

const STAT_ORDER: (keyof Stats)[] = ["pac", "sho", "pas", "dri", "def", "phy"];

function escapeHtml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export function renderCardBack(data: CardData): string {
  const colors = tierColors(data.tier);
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
    <div class="back-face" style="background: linear-gradient(180deg, ${colors.from}, ${colors.to}); color: ${colors.text};">
      <div class="back-title">Scout Report</div>
      <div class="back-mode">Source: ${modeLabel}</div>
      <div class="back-tiers">${tierRow}</div>
      <ul class="back-stats">${statRows}</ul>
      <div class="back-note">Formulas are early estimates, not calibrated against real profiles yet.</div>
      <div class="back-hint">Tap to flip back</div>
    </div>`;
}
