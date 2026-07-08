import { loadFlagGraphic } from "./lib/flagSvgBrowser.js";
import { computeOverall, computeTier, computeArchetype } from "../src/scoring.js";
import { renderCard } from "../src/renderCard.js";
import { renderCardTcg } from "../src/renderCardTcg.js";
import { renderBaseball } from "../src/renderBaseball.js";
import type { CardData, Stats } from "../src/types.js";

// Fictional, deliberately good-looking stats — this is marketing content,
// not a real scouted profile — rendered with the exact same functions a
// real card uses, so the showcase can never drift out of sync with what
// visitors actually get.
const DEMO_STATS: Stats = { pac: 78, sho: 74, pas: 85, dri: 88, def: 65, phy: 79 };

async function buildDemoCard(): Promise<CardData> {
  const overall = computeOverall(DEMO_STATS);
  const tier = computeTier(overall);
  const { position, archetype } = computeArchetype(DEMO_STATS);
  const flag = await loadFlagGraphic("US");

  return {
    name: "Alex Rivera",
    headline: "Senior Product Engineer @ Nova Labs",
    company: "Nova Labs",
    country: "US",
    flag,
    profileUrl: "https://linkedin.com/in/alex-rivera",
    stats: DEMO_STATS,
    overall,
    tier,
    position,
    archetype,
    mode: "FULL",
  };
}

export async function initHeroShowcase(container: HTMLElement) {
  const demo = await buildDemoCard();
  container.innerHTML = `
    <div class="showcase-card showcase-fut">${renderCard(demo)}</div>
    <div class="showcase-card showcase-tcg">${renderCardTcg(demo)}</div>
    <div class="showcase-card showcase-baseball">${renderBaseball(demo)}</div>
  `;
}
