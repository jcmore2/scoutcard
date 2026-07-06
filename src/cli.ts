import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseExport } from "./parseExport.js";
import { computeStats, computeOverall, computeTier, computeArchetype } from "./scoring.js";
import { renderCard } from "./renderCard.js";
import type { CardData } from "./types.js";

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      out[key] = argv[i + 1] ?? "";
      i++;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const exportPath = args.export;
const country = args.country ?? "";
const outPath = args.out ?? "output/card.svg";

if (!exportPath) {
  console.error("Usage: npm run generate -- --export <path-to-export.zip> [--country US] [--out output/card.svg]");
  process.exit(1);
}

const profile = parseExport(exportPath);
const stats = computeStats(profile);
const overall = computeOverall(stats);
const tier = computeTier(overall);
const { position, archetype } = computeArchetype(stats);

const cardData: CardData = {
  name: `${profile.firstName} ${profile.lastName}`.trim() || "Unknown",
  headline: profile.headline,
  country,
  stats,
  overall,
  tier,
  position,
  archetype,
};

const svg = renderCard(cardData);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, svg, "utf-8");

console.log(`Card written to ${outPath}`);
console.log(JSON.stringify({ overall, tier, position, archetype, stats }, null, 2));
