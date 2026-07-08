import type { Tier } from "./types.js";

// How "epic" a tier's presentation gets, on top of its base color — plain
// through Gold (matching how real rating cards keep bronze/silver/gold to a
// shared template), then a visible step up for the two rarity tiers.
export function tierLevel(tier: Tier): 0 | 1 | 2 | 3 | 4 {
  switch (tier) {
    case "ICON":
      return 4;
    case "TOTY":
      return 3;
    case "GOLD":
      return 2;
    case "SILVER":
      return 1;
    default:
      return 0;
  }
}

// A 4-point sparkle/glint glyph — the small "premium" cue Gold and up add
// that Bronze/Silver don't get.
export function sparkle(cx: number, cy: number, r: number, color: string, opacity = 0.85): string {
  return `<path d="M ${cx} ${cy - r} L ${cx + r * 0.28} ${cy - r * 0.28} L ${cx + r} ${cy} L ${cx + r * 0.28} ${cy + r * 0.28} L ${cx} ${cy + r} L ${cx - r * 0.28} ${cy + r * 0.28} L ${cx - r} ${cy} L ${cx - r * 0.28} ${cy - r * 0.28} Z" fill="${color}" opacity="${opacity}" />`;
}

// A diagonal rainbow holo-foil stripe — the way genuinely rare trading
// cards catch light, reserved for TOTY and ICON so those two actually look
// like a different class of card, not just a different color.
export function holoPatternDefs(id: string): string {
  return `<pattern id="${id}" width="46" height="46" patternTransform="rotate(35)" patternUnits="userSpaceOnUse">
      <rect x="0" width="9" height="46" fill="#ff6ec7" opacity="0.22" />
      <rect x="9" width="9" height="46" fill="#7dd3fc" opacity="0.18" />
      <rect x="18" width="9" height="46" fill="#fef08a" opacity="0.18" />
      <rect x="27" width="9" height="46" fill="#86efac" opacity="0.18" />
      <rect x="36" width="9" height="46" fill="#c4b5fd" opacity="0.2" />
    </pattern>`;
}

// One laurel branch (a curved row of small leaves) — Icon-only, the
// "legendary" motif real card sets reserve for their single rarest tier.
export function laurelBranch(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  count: number,
  color: string,
): string {
  const leaves: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const angle = startAngle + (endAngle - startAngle) * t;
    const rad = (angle * Math.PI) / 180;
    const x = cx + radius * Math.cos(rad);
    const y = cy + radius * Math.sin(rad);
    leaves.push(
      `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="3" fill="${color}" opacity="0.9" transform="rotate(${(angle + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" />`,
    );
  }
  return leaves.join("");
}
