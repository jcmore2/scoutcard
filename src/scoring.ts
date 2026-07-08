import { scale } from "./scaleCurve.js";
import type { ParsedProfile, Stats, Tier } from "./types.js";

export function computeStats(p: ParsedProfile): Stats {
  return {
    pac: scale(p.recentActivityCount, 15),
    sho: scale(p.endorsementsReceived + p.recommendationsReceived * 3, 40),
    pas: scale(p.connectionCount + p.recommendationsGiven * 5, 250),
    dri: scale(p.skillCount, 15),
    def: scale(p.recommendationsGiven * 3 + p.endorsementsGiven, 25),
    phy: scale(p.positionYears, 8),
  };
}

export function computeOverall(stats: Stats): number {
  const values = Object.values(stats);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function computeTier(overall: number): Tier {
  if (overall >= 90) return "ICON";
  if (overall >= 85) return "TOTY";
  if (overall >= 75) return "GOLD";
  if (overall >= 65) return "SILVER";
  return "BRONZE";
}

// TOTY and Icon match the palette of their real FUT counterparts (an
// "In-Form" card is black + gold streaks; an Icon card is white/gold
// marble) rather than an arbitrary color, since those two are meant to look
// like a genuinely different class of card everywhere they're used —
// badges, borders, the tier legend on the card back — not just on the
// FIFA/FUT style's bespoke background art.
const TIER_COLORS: Record<Tier, { from: string; to: string; text: string }> = {
  BRONZE: { from: "#CD7F32", to: "#5A3A18", text: "#2A1A0C" },
  SILVER: { from: "#E4E7EB", to: "#8B96A5", text: "#262B33" },
  GOLD: { from: "#F5D77E", to: "#B8860B", text: "#3A2806" },
  "IN-FORM": { from: "#FF6B7A", to: "#8C0F1F", text: "#4A0A14" },
  TOTY: { from: "#3A3A3E", to: "#0A0A0C", text: "#F0C419" },
  ICON: { from: "#FFF9EA", to: "#D8B667", text: "#2B2410" },
};

export function tierColors(tier: Tier) {
  return TIER_COLORS[tier];
}

// Position/archetype read from which two stats lead the profile — same idea
// as GitFut's "shooting spike scouts a poacher" logic.
export function computeArchetype(stats: Stats): { position: string; archetype: string } {
  const entries = Object.entries(stats) as [keyof Stats, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const [top] = sorted;

  const byTop: Record<keyof Stats, { position: string; archetype: string }> = {
    pac: { position: "RW", archetype: "Sprinter" },
    sho: { position: "ST", archetype: "Poacher" },
    pas: { position: "CAM", archetype: "Playmaker" },
    dri: { position: "CM", archetype: "Generalist" },
    def: { position: "CB", archetype: "Anchor" },
    phy: { position: "CDM", archetype: "Veteran" },
  };

  return byTop[top[0]];
}
