import type { CardData } from "./types.js";
import { tierColors } from "./scoring.js";
import { escapeXml, initials, truncate, flagFragment } from "./cardTextUtils.js";
import { tierLevel, sparkle, laurelBranch } from "./tierEffects.js";
import { commonPatternDefs, rarePatternDefs, rareStrokes, inFormStrokes, iconStrokes } from "./tierBackgrounds.js";
import { renderId } from "./uid.js";

const STAT_LABELS: [key: keyof CardData["stats"], label: string][] = [
  ["pac", "PAC"],
  ["sho", "SHO"],
  ["pas", "PAS"],
  ["dri", "DRI"],
  ["def", "DEF"],
  ["phy", "PHY"],
];

// A shield/crest silhouette (a small peaked notch at top center flanked by
// two shoulder dips, straight sides, tapering to a point at the bottom)
// rather than a plain flat-topped rectangle — the shape real rating cards
// use, and what the crest emblem sits on. The taper only kicks in near the
// bottom so the stat grid still gets the full card width. Exported so the
// interactive card-back view (web/cardBack.ts) can clip to the identical
// shape instead of drifting into a plain rectangle.
export const SHIELD_PATH =
  "M 34 6 L 145 6 L 155 15 L 170 2 L 185 15 L 195 6 L 306 6 Q 334 6 334 34 L 334 396 Q 334 414 320 424 L 316 428 L 194 468 Q 170 480 146 468 L 24 428 L 20 424 Q 6 414 6 396 L 6 34 Q 6 6 34 6 Z";

// Real names never wrap to 2 lines on this style — the font auto-shrinks to
// fit one line instead. Rough width estimate for a bold condensed face.
function singleLineFontSize(text: string, maxWidth: number, maxSize: number, minSize: number): number {
  const estimatedWidth = text.length * maxSize * 0.62;
  if (estimatedWidth <= maxWidth) return maxSize;
  const scaled = Math.floor(maxWidth / (text.length * 0.62));
  return Math.max(minSize, Math.min(maxSize, scaled));
}

export function renderCard(data: CardData): string {
  // Suffixes every id below so this card's gradients/clips never collide
  // with another FUT card's on the same page (e.g. the hero showcase demo)
  // — duplicate SVG ids make url(#id) resolve to whichever element is
  // first in the document, not necessarily this one's own defs.
  const rid = renderId();
  const colors = tierColors(data.tier);
  const name = truncate(data.name.toUpperCase(), 26);
  const nameSize = singleLineFontSize(name, 260, 24, 12);
  const headline = escapeXml(data.headline);
  const leftStats = STAT_LABELS.slice(0, 3);
  const rightStats = STAT_LABELS.slice(3);

  // Bronze through Gold share this exact template (like real rating cards
  // do) — TOTY and Icon layer extra effects on top so they read as a
  // genuinely different, rarer class of card rather than just a new color.
  const level = tierLevel(data.tier);
  const tierLabel = level === 4 ? "★ ICON ★" : data.tier;
  const sparklePositions: [number, number, number][] = [];
  if (level >= 2) sparklePositions.push([155, 76, 7], [315, 76, 7]);
  if (level >= 4) sparklePositions.push([155, 228, 6], [315, 228, 6]);

  // Bespoke background art per tier, modeled on official FUT card designs
  // rather than a generic effect scaling up with rarity: Bronze gets the
  // plain "Common" dot texture, Silver/Gold get "Rare"'s dots + diagonal
  // brushstrokes (recolored per tier, the way a real Rare card exists at
  // every color), and TOTY/Icon get their own fixed "In-Form"/"Icon" look.
  const dotPatternId = data.tier === "BRONZE" ? `commonDots${rid}` : data.tier === "SILVER" || data.tier === "GOLD" ? `rareDots${rid}` : null;
  const dotPatternDefs =
    data.tier === "BRONZE"
      ? commonPatternDefs(`commonDots${rid}`, colors)
      : data.tier === "SILVER" || data.tier === "GOLD"
        ? rarePatternDefs(`rareDots${rid}`, colors)
        : "";
  const backgroundStrokes =
    data.tier === "SILVER" || data.tier === "GOLD"
      ? rareStrokes(colors)
      : data.tier === "TOTY"
        ? inFormStrokes(colors)
        : data.tier === "ICON"
          ? iconStrokes(colors)
          : "";

  // A tall arched photo window (not a small circle) — the "hero shot" real
  // rating cards build the whole layout around — with a soft radial fade
  // dissolving it into the card's own background near the edges, instead of
  // a hard crop line.
  const archX1 = 148;
  const archX2 = 322;
  const archBaseY = 95;
  const archRy = 45;
  const archBottomY = 250;
  const archPath = `M ${archX1} ${archBaseY} A ${(archX2 - archX1) / 2} ${archRy} 0 0 1 ${archX2} ${archBaseY} L ${archX2} ${archBottomY} L ${archX1} ${archBottomY} Z`;
  const archCenterX = (archX1 + archX2) / 2;

  const statRow = (
    [key, label]: [keyof CardData["stats"], string],
    x: number,
    y: number,
  ) => `
    <text x="${x}" y="${y}" font-size="19" font-weight="800" fill="${colors.text}" font-family="'Arial Black', Arial, sans-serif" data-count-to="${data.stats[key]}">${data.stats[key]}</text>
    <text x="${x + 32}" y="${y}" font-size="13" font-weight="700" fill="${colors.text}" font-family="Arial, sans-serif" opacity="0.85">${label}</text>`;

  // A thick solid-color border band (real rating cards' frame is chunky,
  // not a hairline) rather than a thin stroke: the outer shield is filled
  // with the border color, then the whole face — background, texture,
  // sheen, and every content element below — is scaled down into a bordered
  // inset via one shared transform, so nothing inside had to be
  // repositioned by hand.
  const faceScale = 0.9;
  const faceTransform = `translate(170 240) scale(${faceScale}) translate(-170 -240)`;

  // Icon gets a structurally different frame, not just an extra glow —
  // a second thin accent ring between the border band and the face, the
  // "double-lined" look official Icon cards use to read as a different
  // class of card at a glance.
  const iconDoubleRing =
    level === 4
      ? `<path d="${SHIELD_PATH}" fill="none" stroke="#ffffff" stroke-opacity="0.75" stroke-width="1.5" transform="translate(170 240) scale(0.955) translate(-170 -240)" />`
      : "";

  // The crest emblem varies with tier identity rather than just scaling a
  // laurel up: Common/Rare (Bronze/Silver/Gold) keep a plain laurel + ball,
  // In-Form (TOTY) swaps it for a spiky rated-seal burst matching its
  // jagged energy, and Icon gets a bigger laurel around a gem instead of a
  // plain circle.
  const totyBurst =
    "M 170 3 L 176 13.8 L 188 15.5 L 179.5 24 L 181.5 36 L 170 30.5 L 158.5 36 L 160.5 24 L 152 15.5 L 164 13.8 Z";
  const crest =
    data.tier === "TOTY"
      ? `<path d="${totyBurst}" fill="${colors.from}" stroke="${colors.text}" stroke-opacity="0.6" stroke-width="1" /><circle cx="170" cy="19" r="6" fill="${colors.to}" stroke="${colors.text}" stroke-opacity="0.6" stroke-width="1" />`
      : data.tier === "ICON"
        ? `${laurelBranch(170, 18, 19, 95, 195, 4, colors.text)}${laurelBranch(170, 18, 19, 85, -15, 4, colors.text)}<rect x="164" y="10" width="12" height="12" transform="rotate(45 170 16)" fill="${colors.from}" stroke="${colors.text}" stroke-opacity="0.6" stroke-width="1" />`
        : `${laurelBranch(170, 20, 15, 100, 190, 3, colors.text)}${laurelBranch(170, 20, 15, 80, -10, 3, colors.text)}<circle cx="170" cy="20" r="5" fill="${colors.from}" stroke="${colors.text}" stroke-opacity="0.6" stroke-width="1" />`;

  return `<svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">
  <defs>
    <linearGradient id="cardBg${rid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.from}" />
      <stop offset="0.55" stop-color="${colors.to}" />
      <stop offset="1" stop-color="${colors.from}" />
    </linearGradient>
    <radialGradient id="cardSheen${rid}" cx="0.3" cy="0.08" r="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <clipPath id="shieldClip${rid}">
      <path d="${SHIELD_PATH}" />
    </clipPath>
    ${dotPatternDefs}
  </defs>

  ${
    level >= 4
      ? `<path d="${SHIELD_PATH}" fill="none" stroke="#fff6d8" stroke-opacity="0.35" stroke-width="10" transform="translate(170 240) scale(1.045) translate(-170 -240)" />`
      : ""
  }
  <path d="${SHIELD_PATH}" fill="${colors.from}" stroke="${colors.text}" stroke-opacity="0.4" stroke-width="2" />
  ${iconDoubleRing}

  <g transform="${faceTransform}">
    <path d="${SHIELD_PATH}" fill="url(#cardBg${rid})" />
    <path d="${SHIELD_PATH}" fill="none" stroke="${colors.text}" stroke-opacity="0.25" stroke-width="1" transform="translate(170 240) scale(0.965) translate(-170 -240)" />
    ${dotPatternId ? `<path d="${SHIELD_PATH}" fill="url(#${dotPatternId})" />` : ""}
    <path d="${SHIELD_PATH}" fill="url(#cardSheen${rid})" />

    <g clip-path="url(#shieldClip${rid})">
    ${backgroundStrokes}
    <text x="170" y="270" font-size="240" font-weight="800" fill="${colors.text}" fill-opacity="0.08" text-anchor="middle" font-family="'Arial Black', Arial, sans-serif">${data.overall}</text>

    ${crest}

    <text x="26" y="72" font-size="46" font-weight="800" fill="${colors.text}" font-family="'Arial Black', Arial, sans-serif" data-count-to="${data.overall}">${data.overall}</text>
    <text x="26" y="96" font-size="15" font-weight="700" fill="${colors.text}" opacity="0.9">${escapeXml(data.position)}</text>

    ${flagFragment(data.flag, 26, 110, 32, 24, colors.text)}
    ${
      data.company
        ? `<rect x="24" y="140" width="118" height="19" rx="4" fill="${colors.text}" fill-opacity="0.16" />
    <text x="30" y="153" font-size="9.5" font-weight="700" fill="${colors.text}">${escapeXml(truncate(data.company, 16))}</text>`
        : ""
    }

    <text x="312" y="34" font-size="12" font-weight="800" fill="${colors.text}" opacity="0.85" text-anchor="end">${tierLabel}</text>
    <text x="312" y="48" font-size="8" font-weight="700" fill="${colors.text}" opacity="0.55" text-anchor="end">${data.mode === "SCOUT" ? "PDF SCOUT" : "FULL EXPORT"}</text>

    <defs>
      <clipPath id="archClip${rid}"><path d="${archPath}" /></clipPath>
      <radialGradient id="archMelt${rid}" cx="0.5" cy="0.32" r="0.78">
        <stop offset="0.5" stop-color="${colors.to}" stop-opacity="0" />
        <stop offset="1" stop-color="${colors.to}" stop-opacity="0.95" />
      </radialGradient>
    </defs>
    ${
      data.photo
        ? `<image href="${data.photo}" x="${archX1}" y="${archBaseY - archRy}" width="${archX2 - archX1}" height="${archBottomY - (archBaseY - archRy)}" clip-path="url(#archClip${rid})" preserveAspectRatio="xMidYMid slice" />`
        : `<path d="${archPath}" fill="#ffffff" fill-opacity="0.2" />
    <text x="${archCenterX}" y="165" font-size="64" font-weight="800" fill="${colors.text}" fill-opacity="0.8" text-anchor="middle" clip-path="url(#archClip${rid})">${escapeXml(initials(data.name))}</text>`
    }
    <path d="${archPath}" fill="url(#archMelt${rid})" />
    <path d="${archPath}" fill="none" stroke="${colors.text}" stroke-width="2" stroke-opacity="0.55" />
    ${
      level >= 4
        ? laurelBranch(archCenterX, 150, 112, 100, 260, 6, "#fff6d8") +
          laurelBranch(archCenterX, 150, 112, 80, -80, 6, "#fff6d8")
        : ""
    }
    ${sparklePositions.map(([x, y, r]) => sparkle(x, y, r, "#ffffff")).join("\n    ")}

    <rect x="6" y="266" width="328" height="34" fill="${colors.text}" fill-opacity="0.14" />
    <line x1="6" y1="266" x2="334" y2="266" stroke="${colors.text}" stroke-opacity="0.3" stroke-width="1" />
    <line x1="6" y1="300" x2="334" y2="300" stroke="${colors.text}" stroke-opacity="0.3" stroke-width="1" />
    <text x="170" y="289" font-size="${nameSize}" font-weight="800" fill="${colors.text}" text-anchor="middle" letter-spacing="0.5">${escapeXml(name)}</text>

    <text x="170" y="316" font-size="11" fill="${colors.text}" text-anchor="middle" opacity="0.8">${headline.length > 40 ? headline.slice(0, 37) + "…" : headline}</text>
    <text x="170" y="332" font-size="12" font-weight="700" fill="${colors.text}" text-anchor="middle" opacity="0.9">${escapeXml(data.archetype)}</text>

    <line x1="170" y1="344" x2="170" y2="428" stroke="${colors.text}" stroke-opacity="0.25" stroke-width="1" />
    <line x1="30" y1="375" x2="310" y2="375" stroke="${colors.text}" stroke-opacity="0.18" stroke-width="1" />
    <line x1="30" y1="405" x2="310" y2="405" stroke="${colors.text}" stroke-opacity="0.18" stroke-width="1" />

    ${leftStats.map((s, i) => statRow(s, 42, 360 + i * 30)).join("\n")}
    ${rightStats.map((s, i) => statRow(s, 192, 360 + i * 30)).join("\n")}
    </g>
  </g>
</svg>`;
}
