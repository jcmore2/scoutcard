import type { CardData } from "./types.js";
import { tierColors } from "./scoring.js";

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const STAT_LABELS: [key: keyof CardData["stats"], label: string][] = [
  ["pac", "PAC"],
  ["sho", "SHO"],
  ["pas", "PAS"],
  ["dri", "DRI"],
  ["def", "DEF"],
  ["phy", "PHY"],
];

export function renderCard(data: CardData): string {
  const colors = tierColors(data.tier);
  const name = escapeXml(data.name.toUpperCase());
  const headline = escapeXml(data.headline);
  const leftStats = STAT_LABELS.slice(0, 3);
  const rightStats = STAT_LABELS.slice(3);

  const statRow = (
    [key, label]: [keyof CardData["stats"], string],
    x: number,
    y: number,
  ) => `
    <text x="${x}" y="${y}" font-size="20" font-weight="700" fill="${colors.text}" font-family="Arial, sans-serif">${data.stats[key]}</text>
    <text x="${x + 34}" y="${y}" font-size="14" font-weight="600" fill="${colors.text}" font-family="Arial, sans-serif" opacity="0.85">${label}</text>`;

  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${colors.from}" />
      <stop offset="1" stop-color="${colors.to}" />
    </linearGradient>
  </defs>

  <rect x="4" y="4" width="332" height="472" rx="24" fill="url(#cardBg)" stroke="${colors.text}" stroke-opacity="0.25" stroke-width="2" />

  <text x="30" y="70" font-size="44" font-weight="800" fill="${colors.text}">${data.overall}</text>
  <text x="30" y="94" font-size="16" font-weight="700" fill="${colors.text}" opacity="0.85">${escapeXml(data.position)}</text>
  <text x="300" y="40" font-size="12" font-weight="700" fill="${colors.text}" opacity="0.7" text-anchor="end">${escapeXml(data.country)}</text>
  <text x="300" y="58" font-size="11" font-weight="700" fill="${colors.text}" opacity="0.7" text-anchor="end">${data.tier}</text>

  <circle cx="170" cy="150" r="56" fill="#ffffff" fill-opacity="0.25" stroke="${colors.text}" stroke-width="2" stroke-opacity="0.4" />
  <text x="170" y="163" font-size="40" font-weight="800" fill="${colors.text}" text-anchor="middle">${escapeXml(initials(data.name))}</text>

  <text x="170" y="235" font-size="22" font-weight="800" fill="${colors.text}" text-anchor="middle" letter-spacing="1">${name}</text>
  <text x="170" y="256" font-size="12" fill="${colors.text}" text-anchor="middle" opacity="0.8">${headline.length > 42 ? headline.slice(0, 39) + "…" : headline}</text>
  <text x="170" y="276" font-size="12" font-weight="700" fill="${colors.text}" text-anchor="middle" opacity="0.9">${escapeXml(data.archetype)}</text>

  <line x1="40" y1="300" x2="300" y2="300" stroke="${colors.text}" stroke-opacity="0.3" stroke-width="1.5" />

  ${leftStats.map((s, i) => statRow(s, 45, 335 + i * 40)).join("\n")}
  ${rightStats.map((s, i) => statRow(s, 195, 335 + i * 40)).join("\n")}
</svg>`;
}
