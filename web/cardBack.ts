import { tierColors } from "../src/scoring.js";
import { SHIELD_PATH } from "../src/renderCard.js";
import { GOLD_BORDER, BORDER_EDGE, PAPER, INK, TCG_FONT } from "../src/renderCardTcg.js";
import { BB_CREAM, BB_INK, BB_FONT } from "../src/renderBaseball.js";
import { STAT_DESCRIPTIONS, TIER_BANDS, SCORING_VERSION } from "../src/statDescriptions.js";
import { escapeXml, truncate, wrapText } from "../src/cardTextUtils.js";
import { renderId } from "../src/uid.js";
import type { CardData, CardStyle, Stats } from "../src/types.js";

const STAT_ORDER: (keyof Stats)[] = ["pac", "sho", "pas", "dri", "def", "phy"];

interface BackBox {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fontFamily: string;
}

// Native SVG text/lines rather than an HTML foreignObject — a foreignObject
// back rendered fine on-page (styled by web/style.css), but browsers taint
// any canvas drawn from an SVG containing one, which broke rasterizing the
// back to a PNG for sharing. Plain SVG has no such restriction, and as a
// bonus the output is now a fully self-contained file with no dependency on
// an external stylesheet.
function backContentSvg(data: CardData, box: BackBox): string {
  const { x, y, width, height, color, fontFamily } = box;
  const descriptions = STAT_DESCRIPTIONS[data.mode];
  const modeLabel = data.mode === "SCOUT" ? "PDF Scout" : "Full Export";
  const maxChars = Math.floor(width / 5.6);
  const parts: string[] = [];
  let cy = y + 12;

  parts.push(
    `<text x="${x}" y="${cy}" font-size="17" font-weight="800" fill="${color}" font-family="${fontFamily}">Scout Report</text>`,
  );
  cy += 20;
  parts.push(
    `<text x="${x}" y="${cy}" font-size="10.5" font-weight="700" fill="${color}" fill-opacity="0.75" font-family="${fontFamily}">Source: ${escapeXml(modeLabel)} · Scoring ${SCORING_VERSION}</text>`,
  );
  cy += 20;

  for (let i = 0; i < TIER_BANDS.length; i += 3) {
    let rx = x;
    for (const band of TIER_BANDS.slice(i, i + 3)) {
      const isCurrent = band.label === data.tier;
      const label = `${band.label} ${band.range}`;
      parts.push(
        `<text x="${rx}" y="${cy}" font-size="8.5" font-weight="700" fill="${color}" fill-opacity="${isCurrent ? 1 : 0.6}" text-decoration="${isCurrent ? "underline" : "none"}" font-family="${fontFamily}">${escapeXml(label)}</text>`,
      );
      rx += label.length * 5.2 + 12;
    }
    cy += 14;
  }
  cy += 10;

  for (const key of STAT_ORDER) {
    parts.push(
      `<text x="${x}" y="${cy}" font-size="12" font-weight="800" fill="${color}" font-family="${fontFamily}">${key.toUpperCase()} ${data.stats[key]}</text>`,
    );
    cy += 14;
    for (const line of wrapText(descriptions[key], maxChars)) {
      parts.push(
        `<text x="${x}" y="${cy}" font-size="10" fill="${color}" fill-opacity="0.85" font-family="${fontFamily}">${escapeXml(line)}</text>`,
      );
      cy += 12.5;
    }
    cy += 6;
  }

  // Anchored to the bottom of the box (rather than flowing after the stats)
  // so it lands in the same spot regardless of how many lines the stat
  // descriptions wrapped to above.
  const noteLines = wrapText("Formulas are early estimates, not calibrated against real profiles yet.", maxChars);
  const linkLines = data.profileUrl ? 1 : 0;
  let fy = y + height - 6 - 12 - linkLines * 12 - noteLines.length * 11;

  parts.push(
    `<line x1="${x}" y1="${fy - 10}" x2="${x + width}" y2="${fy - 10}" stroke="${color}" stroke-opacity="0.2" stroke-width="1" />`,
  );
  for (const line of noteLines) {
    parts.push(
      `<text x="${x}" y="${fy}" font-size="8.5" font-style="italic" fill="${color}" fill-opacity="0.6" font-family="${fontFamily}">${escapeXml(line)}</text>`,
    );
    fy += 11;
  }
  if (data.profileUrl) {
    const linkLabel = truncate(data.profileUrl.replace(/^https?:\/\//, ""), maxChars);
    parts.push(
      `<a href="${escapeXml(data.profileUrl)}" target="_blank" rel="noopener"><text x="${x}" y="${fy}" font-size="8.5" fill="${color}" fill-opacity="0.75" text-decoration="underline" font-family="${fontFamily}">${escapeXml(linkLabel)}</text></a>`,
    );
    fy += 12;
  }
  parts.push(
    `<text x="${x + width / 2}" y="${y + height - 6}" font-size="8.5" fill="${color}" fill-opacity="0.55" text-anchor="middle" font-family="${fontFamily}">Tap to flip back</text>`,
  );

  return parts.join("\n");
}

// Matches the FUT front's shield silhouette, gradient, and sans-serif type
// exactly (same SHIELD_PATH import) instead of a plain rectangle.
function renderFutBack(data: CardData): string {
  const rid = renderId();
  const colors = tierColors(data.tier);
  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="backBg${rid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.from}" />
      <stop offset="0.55" stop-color="${colors.to}" />
      <stop offset="1" stop-color="${colors.from}" />
    </linearGradient>
    <clipPath id="backShieldClip${rid}"><path d="${SHIELD_PATH}" /></clipPath>
  </defs>
  <path d="${SHIELD_PATH}" fill="url(#backBg${rid})" stroke="${colors.text}" stroke-opacity="0.4" stroke-width="3" />
  <g clip-path="url(#backShieldClip${rid})">
    ${backContentSvg(data, { x: 28, y: 34, width: 284, height: 416, color: colors.text, fontFamily: "Arial, sans-serif" })}
  </g>
</svg>`;
}

// Matches the TCG front's yellow border, parchment fill, and rounded
// sans-serif type.
function renderTcgBack(data: CardData): string {
  const rid = renderId();
  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="backBorder${rid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GOLD_BORDER.from}" />
      <stop offset="1" stop-color="${GOLD_BORDER.to}" />
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="332" height="472" rx="16" fill="url(#backBorder${rid})" stroke="${BORDER_EDGE}" stroke-width="2.5" />
  <rect x="13" y="13" width="314" height="454" rx="11" fill="${PAPER}" />
  ${backContentSvg(data, { x: 35, y: 35, width: 270, height: 414, color: INK, fontFamily: TCG_FONT })}
</svg>`;
}

// Matches the baseball front's cream cardstock, colored team accent, and
// geometric sans-serif type.
function renderBaseballBack(data: CardData): string {
  const colors = tierColors(data.tier);
  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="332" height="472" rx="10" fill="${BB_CREAM}" stroke="${BB_INK}" stroke-opacity="0.65" stroke-width="2" />
  <rect x="14" y="14" width="312" height="10" fill="${colors.to}" />
  <rect x="14" y="14" width="312" height="452" rx="6" fill="none" stroke="${BB_INK}" stroke-opacity="0.2" stroke-width="1" />
  ${backContentSvg(data, { x: 36, y: 36, width: 268, height: 412, color: BB_INK, fontFamily: BB_FONT })}
</svg>`;
}

export function renderCardBack(data: CardData, style: CardStyle): string {
  if (style === "tcg") return renderTcgBack(data);
  if (style === "baseball") return renderBaseballBack(data);
  return renderFutBack(data);
}
