import type { SourceMode, Stats } from "./types.js";

// Bump this whenever a scoring formula (src/scoring.ts, src/pdf/scoringPdf.ts)
// changes, so a card generated under an older formula stays self-explanatory
// instead of silently meaning something different once shared.
export const SCORING_VERSION = "v1";

export const STAT_DESCRIPTIONS: Record<SourceMode, Record<keyof Stats, string>> = {
  FULL: {
    pac: "Posts + comments in the last 12 months",
    sho: "Endorsements + recommendations received",
    pas: "Connections + recommendations given",
    dri: "Skill diversity (full skill list)",
    def: "Recommendations + endorsements given",
    phy: "Years of experience",
  },
  SCOUT: {
    pac: "Number of roles held (career pace)",
    sho: "Certifications earned",
    pas: "Languages spoken",
    dri: "Top skills listed (capped at 3 by LinkedIn)",
    def: "Education entries",
    phy: "Career span (years since earliest role)",
  },
};

export const TIER_BANDS = [
  { label: "BRONZE", range: "≤64" },
  { label: "SILVER", range: "65–74" },
  { label: "GOLD", range: "75–84" },
  { label: "TOTY", range: "85–89" },
  { label: "ICON", range: "90+" },
];
