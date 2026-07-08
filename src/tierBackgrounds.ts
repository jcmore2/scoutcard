// Bespoke background art per tier, modeled on official FUT card designs —
// Bronze/Silver/Gold map to the "Common"/"Rare" pattern real cards use
// (same pattern, recolored per tier, the way an actual Rare card exists at
// every color), while TOTY and Icon get their own fixed, recognizable
// identity (In-Form's black + gold streaks; Icon's white/gold marble)
// regardless of the underlying tier gradient.

interface TierPalette {
  from: string;
  to: string;
  text: string;
}

// "Common" — Bronze: the plainest look, just a faint dot-stipple pattern
// def — caller fills the card shape with url(#id) same as holoPatternDefs.
export function commonPatternDefs(id: string, colors: TierPalette): string {
  return `<pattern id="${id}" width="13" height="13" patternUnits="userSpaceOnUse">
    <circle cx="6.5" cy="6.5" r="1.3" fill="${colors.text}" fill-opacity="0.14" />
  </pattern>`;
}

// "Rare" — Silver/Gold: the same idea as Common plus a couple of bold
// diagonal brushstroke bands drawn separately (returned alongside the
// pattern def) — the signature that separates a Rare pull from a Common
// one at any color tier.
export function rarePatternDefs(id: string, colors: TierPalette): string {
  return `<pattern id="${id}" width="11" height="11" patternUnits="userSpaceOnUse">
    <circle cx="5.5" cy="5.5" r="1.2" fill="${colors.text}" fill-opacity="0.12" />
  </pattern>`;
}

export function rareStrokes(colors: TierPalette): string {
  return `<path d="M -30 300 L 190 30 L 230 62 L 10 332 Z" fill="${colors.text}" fill-opacity="0.1" />
  <path d="M 30 400 L 270 100 L 305 128 L 65 430 Z" fill="${colors.text}" fill-opacity="0.08" />`;
}

// "In-Form" — TOTY: a bold diagonal gold streak plus a scatter of tiny
// star-dust, the way a real In-Form card reads as event-exclusive rather
// than a recolored base card. Drawn over the tier's own (already black)
// gradient rather than needing its own pattern def.
export function inFormStrokes(colors: TierPalette): string {
  const dust = [
    [70, 90],
    [270, 60],
    [50, 220],
    [290, 200],
    [90, 340],
    [250, 380],
  ]
    .map(
      ([x, y]) =>
        `<path d="M ${x} ${y - 3} L ${x + 0.9} ${y - 0.9} L ${x + 3} ${y} L ${x + 0.9} ${y + 0.9} L ${x} ${y + 3} L ${x - 0.9} ${y + 0.9} L ${x - 3} ${y} L ${x - 0.9} ${y - 0.9} Z" fill="${colors.text}" opacity="0.65" />`,
    )
    .join("");
  return `<path d="M -30 320 L 210 20 L 250 55 L 10 355 Z" fill="${colors.text}" fill-opacity="0.16" />
  <path d="M 20 420 L 290 130 L 315 155 L 45 445 Z" fill="${colors.text}" fill-opacity="0.1" />
  ${dust}`;
}

// "Icon" — white/gold marble veining plus one gold streak, the "legendary"
// finish that pairs with the laurel wreath the FUT front already adds for
// this tier.
export function iconStrokes(colors: TierPalette): string {
  return `<path d="M 40 40 Q 90 110 55 180 T 90 320 T 60 440" fill="none" stroke="${colors.to}" stroke-width="2.5" stroke-opacity="0.3" />
  <path d="M 290 30 Q 230 100 270 170 T 235 300 T 270 420" fill="none" stroke="${colors.to}" stroke-width="2" stroke-opacity="0.25" />
  <path d="M 150 10 Q 175 90 130 160 T 165 300 T 135 440" fill="none" stroke="${colors.to}" stroke-width="1.3" stroke-opacity="0.22" />
  <path d="M -20 300 L 190 40 L 225 68 L 15 328 Z" fill="${colors.to}" fill-opacity="0.22" />`;
}
