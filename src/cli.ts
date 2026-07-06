import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseExport } from "./parseExport.js";
import { computeStats, computeOverall, computeTier, computeArchetype } from "./scoring.js";
import { computeStatsFromPdfProfile } from "./pdf/scoringPdf.js";
import { parseProfilePdf } from "./pdf/readPdfNode.js";
import { renderCardStyled } from "./renderCardStyled.js";
import { loadFlagGraphic } from "./flagNode.js";
import type { CardData, CardStyle } from "./types.js";

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const country = args.country ?? "";
  const outPath = args.out ?? "output/card.svg";
  const flag = loadFlagGraphic(country);

  let cardData: CardData;

  if (args.pdf) {
    const profile = await parseProfilePdf(args.pdf);
    const stats = computeStatsFromPdfProfile(profile);
    const overall = computeOverall(stats);
    const tier = computeTier(overall);
    const { position, archetype } = computeArchetype(stats);
    cardData = {
      name: profile.name || "Unknown",
      headline: profile.headline,
      company: profile.company,
      country,
      flag,
      stats,
      overall,
      tier,
      position,
      archetype,
      mode: "SCOUT",
    };
  } else if (args.export) {
    const profile = parseExport(args.export);
    const stats = computeStats(profile);
    const overall = computeOverall(stats);
    const tier = computeTier(overall);
    const { position, archetype } = computeArchetype(stats);
    cardData = {
      name: `${profile.firstName} ${profile.lastName}`.trim() || "Unknown",
      headline: profile.headline,
      company: profile.company,
      country,
      flag,
      stats,
      overall,
      tier,
      position,
      archetype,
      mode: "FULL",
    };
  } else {
    console.error(
      "Usage: npm run generate -- --export <export.zip> | --pdf <profile.pdf> [--country US] [--style fut|tcg] [--out output/card.svg]",
    );
    process.exit(1);
  }

  const style: CardStyle = args.style === "tcg" ? "tcg" : "fut";
  const svg = renderCardStyled(cardData, style);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, svg, "utf-8");

  console.log(`Card written to ${outPath}`);
  console.log(JSON.stringify(cardData, null, 2));
}

main();
