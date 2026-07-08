import type { CardData, Stats } from "./types.js";
import { tierColors } from "./scoring.js";
import { escapeXml, initials, wrapName, nameFontSize, truncate, flagFragment } from "./cardTextUtils.js";

const STAT_ORDER: (keyof Stats)[] = ["pac", "sho", "pas", "dri", "def", "phy"];
export const TCG_FONT = "'Trebuchet MS', Verdana, sans-serif";

// Exported so the interactive card-back view (web/cardBack.ts) can reuse the
// exact same palette/border instead of drifting into a different look.
// Real TCG borders are a fairly flat, saturated yellow card stock, not a
// soft gold-to-bronze gradient — this is a much closer match than the
// original pass.
export const GOLD_BORDER = { from: "#FBDB6B", to: "#EFC03C" };
export const BORDER_EDGE = "#3A2E12";
export const PAPER = "#FFF8E7";
export const INK = "#2A1F14";
export const MUTED_INK = "#6B5A3E";

// Each stat reads as its own "energy type" (distinct color, like a TCG
// attack cost mixing fire/water/lightning icons) instead of every pip
// sharing one flat tier color — the biggest thing missing from the first
// pass at this style.
const TYPE_COLORS: Record<keyof Stats, string> = {
  pac: "#F4C430",
  sho: "#E8542A",
  pas: "#4A90D9",
  dri: "#5FA052",
  def: "#8B96A5",
  phy: "#A0522D",
};

function lowestStat(stats: Stats): keyof Stats {
  return STAT_ORDER.reduce((worst, key) => (stats[key] < stats[worst] ? key : worst), STAT_ORDER[0]);
}

function energyPip(cx: number, cy: number, r: number, key: keyof Stats): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TYPE_COLORS[key]}" stroke="${INK}" stroke-opacity="0.45" stroke-width="0.75" /><circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.32}" fill="#ffffff" fill-opacity="0.5" />`;
}

// A trading-card-game-inspired alternate skin for the same CardData — same
// scoring, same viewBox, different presentation. Each of the 6 stats reads
// as an "attack" (energy pip, name, damage number), mirroring how TCG cards
// format move lists. Per-stat effect text (what each one is scouted from)
// lives on the card *back* only, not repeated under every row here — real
// cards don't caption every single attack either, and cramming a sentence
// under all 6 was the biggest source of the "too packed" feedback this
// replaced. Laid out with an explicit vertical cursor so it's easy to
// re-check that nothing overflows when the name wraps to 2 lines.
export function renderCardTcg(data: CardData): string {
  const colors = tierColors(data.tier);
  const weakest = lowestStat(data.stats);

  const headlineMentionsCompany = data.company && data.headline.toLowerCase().includes(data.company.toLowerCase());
  const headlineCaption = data.company && !headlineMentionsCompany
    ? `${truncate(data.headline, 40)} · ${data.company}`
    : truncate(data.headline, 58);

  const nameLines = wrapName(data.name.toUpperCase(), 20).map(escapeXml);
  const twoLines = nameLines.length > 1;
  // Two-line names eat header space the layout can't spare, so cap the font
  // size tighter than the single-line case regardless of per-line length.
  const nameSize = twoLines ? Math.min(16, nameFontSize(Math.max(...nameLines.map((l) => l.length)))) : nameFontSize(nameLines[0].length);

  let y = 22;
  const badgeY = y;
  y += 16; // header badge row

  const nameBaseline = y + nameSize - 4;
  const nameBottom = twoLines ? nameBaseline + nameSize : nameBaseline;
  const hpY = nameBaseline;
  y = nameBottom + 13; // headline caption baseline

  const headlineY = y;
  y += 12;

  const artY = y;
  const artHeight = 128;
  y += artHeight + 16; // power box below artwork (no archetype caption line —
  // it duplicated the power box title one-for-one, so it's gone rather than
  // squeezed smaller)

  const powerBoxY = y;
  const powerBoxHeight = 34;
  y += powerBoxHeight + 12;

  const divider1Y = y;
  y += 16;

  const attackTop = y;
  const rowHeight = 24;
  y += (STAT_ORDER.length - 1) * rowHeight;

  const divider2Y = y + 12;
  const footerLabelY = divider2Y + 12;
  const footerValueY = divider2Y + 24;
  const creditY = divider2Y + 39;

  const attackRow = (key: keyof Stats, i: number) => {
    const rowY = attackTop + i * rowHeight;
    return `
    ${i > 0 ? `<line x1="21" y1="${rowY - rowHeight / 2 - 2}" x2="319" y2="${rowY - rowHeight / 2 - 2}" stroke="#B79B5B" stroke-opacity="0.3" stroke-width="0.75" />` : ""}
    ${energyPip(26, rowY - 4, 7, key)}
    <text x="40" y="${rowY}" font-size="13" font-weight="800" fill="${INK}">${key.toUpperCase()}</text>
    <text x="316" y="${rowY}" font-size="16" font-weight="800" fill="${INK}" text-anchor="end" data-count-to="${data.stats[key]}">${data.stats[key]}</text>`;
  };

  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" font-family="${TCG_FONT}">
  <defs>
    <linearGradient id="tcgBorder" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GOLD_BORDER.from}" />
      <stop offset="1" stop-color="${GOLD_BORDER.to}" />
    </linearGradient>
    <linearGradient id="tcgArt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${colors.from}" />
      <stop offset="1" stop-color="${colors.to}" />
    </linearGradient>
    <linearGradient id="tcgShine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="0.38" stop-color="#fff6c8" stop-opacity="0.65" />
      <stop offset="0.48" stop-color="#ffe9a8" stop-opacity="0.75" />
      <stop offset="0.58" stop-color="#d8f0ff" stop-opacity="0.65" />
      <stop offset="0.68" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>

  <rect x="4" y="4" width="332" height="472" rx="16" fill="url(#tcgBorder)" stroke="${BORDER_EDGE}" stroke-width="2.5" />
  <rect x="4" y="4" width="332" height="472" rx="16" fill="url(#tcgShine)" />
  <rect x="9" y="9" width="322" height="462" rx="13" fill="none" stroke="${BORDER_EDGE}" stroke-opacity="0.6" stroke-width="1" />
  <rect x="13" y="13" width="314" height="454" rx="11" fill="${PAPER}" />

  <rect x="21" y="${badgeY}" width="72" height="14" rx="7" fill="${colors.from}" />
  <text x="57" y="${badgeY + 10}" font-size="8" font-weight="800" fill="${colors.text}" text-anchor="middle">${data.tier}</text>
  ${flagFragment(data.flag, 99, badgeY, 18, 14, INK)}
  <text x="319" y="${badgeY + 10}" font-size="8" font-weight="600" fill="${MUTED_INK}" text-anchor="end" font-style="italic">Sourced via ${modeLabel(data)}</text>

  ${nameLines
    .map(
      (line, i) =>
        `<text x="21" y="${i === 0 ? nameBaseline : nameBottom}" font-size="${nameSize}" font-weight="800" fill="${INK}">${line}</text>`,
    )
    .join("\n  ")}
  ${energyPip(243, hpY - 5, 6.5, STAT_ORDER.reduce((top, k) => (data.stats[k] > data.stats[top] ? k : top), STAT_ORDER[0]))}
  <text x="270" y="${hpY}" font-size="11" font-weight="800" fill="${INK}" text-anchor="end">HP</text>
  <text x="319" y="${hpY + 1}" font-size="22" font-weight="800" fill="${INK}" text-anchor="end" data-count-to="${data.overall}">${data.overall}</text>

  <text x="21" y="${headlineY}" font-size="8.5" fill="${MUTED_INK}" font-style="italic">${escapeXml(headlineCaption)}</text>

  <rect x="20" y="${artY - 1}" width="300" height="${artHeight + 2}" rx="9" fill="none" stroke="${BORDER_EDGE}" stroke-opacity="0.7" stroke-width="1.5" />
  ${
    data.photo
      ? `<defs>
    <clipPath id="tcgArtClip"><rect x="21" y="${artY}" width="298" height="${artHeight}" rx="8" /></clipPath>
    <linearGradient id="tcgArtMelt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.5" stop-color="${colors.to}" stop-opacity="0" />
      <stop offset="1" stop-color="${colors.to}" stop-opacity="0.9" />
    </linearGradient>
  </defs>
  <image href="${data.photo}" x="21" y="${artY}" width="298" height="${artHeight}" clip-path="url(#tcgArtClip)" preserveAspectRatio="xMidYMid slice" />
  <rect x="21" y="${artY}" width="298" height="${artHeight}" fill="url(#tcgArtMelt)" clip-path="url(#tcgArtClip)" />`
      : `<rect x="21" y="${artY}" width="298" height="${artHeight}" rx="8" fill="url(#tcgArt)" stroke="${INK}" stroke-opacity="0.2" />
  <circle cx="170" cy="${artY + artHeight / 2}" r="42" fill="#ffffff" fill-opacity="0.3" stroke="${colors.text}" stroke-width="2" stroke-opacity="0.4" />
  <text x="170" y="${artY + artHeight / 2 + 9}" font-size="28" font-weight="800" fill="${colors.text}" text-anchor="middle">${escapeXml(initials(data.name))}</text>`
  }

  <rect x="21" y="${powerBoxY}" width="298" height="${powerBoxHeight}" rx="6" fill="none" stroke="#B79B5B" stroke-width="1" />
  <text x="28" y="${powerBoxY + 14}" font-size="11" font-weight="800" fill="#7A4B9C">Scout Power: ${escapeXml(data.archetype)}</text>
  <text x="28" y="${powerBoxY + 26}" font-size="8" fill="${MUTED_INK}" font-style="italic">${escapeXml(truncate(`Their ${data.archetype.toLowerCase()}-style strength leads the pack.`, 68))}</text>

  <line x1="21" y1="${divider1Y}" x2="319" y2="${divider1Y}" stroke="#B79B5B" stroke-width="1" />

  ${STAT_ORDER.map((key, i) => attackRow(key, i)).join("\n")}

  <line x1="21" y1="${divider2Y}" x2="319" y2="${divider2Y}" stroke="#B79B5B" stroke-width="1" />

  <text x="21" y="${footerLabelY}" font-size="7.5" font-weight="700" fill="${MUTED_INK}">weakness</text>
  <text x="21" y="${footerValueY}" font-size="10" font-weight="700" fill="${INK}">${weakest.toUpperCase()} ×2</text>
  <text x="170" y="${footerLabelY}" font-size="7.5" font-weight="700" fill="${MUTED_INK}" text-anchor="middle">resistance</text>
  <text x="170" y="${footerValueY}" font-size="10" font-weight="700" fill="${INK}" text-anchor="middle">—</text>
  <text x="319" y="${footerLabelY}" font-size="7.5" font-weight="700" fill="${MUTED_INK}" text-anchor="end">retreat cost</text>
  <circle cx="300" cy="${footerValueY - 3}" r="5" fill="none" stroke="${INK}" stroke-width="1.2" />
  <circle cx="312" cy="${footerValueY - 3}" r="5" fill="none" stroke="${INK}" stroke-width="1.2" />

  <text x="21" y="${creditY}" font-size="7" font-weight="700" fill="${MUTED_INK}" opacity="0.85">No. ${String(data.overall).padStart(2, "0")}/99</text>
  <path d="M 306 ${creditY - 4} l 1.8 3.8 4.2 0.5 -3 3 0.7 4.1 -3.7 -2 -3.7 2 0.7 -4.1 -3 -3 4.2 -0.5 z" fill="${colors.from}" stroke="${INK}" stroke-opacity="0.4" stroke-width="0.5" />
  <text x="170" y="${creditY}" font-size="6.5" fill="${MUTED_INK}" opacity="0.7" font-style="italic" text-anchor="middle">ScoutCard fan card — not affiliated with Pokémon or LinkedIn</text>
</svg>`;
}

function modeLabel(data: CardData): string {
  return data.mode === "SCOUT" ? "PDF Scout" : "Full Export";
}
