export interface ParsedProfile {
  firstName: string;
  lastName: string;
  headline: string;
  company: string; // most recent/current employer, from Positions.csv
  positionYears: number; // total years spanned across Positions.csv
  skillCount: number; // unique entries in Skills.csv
  connectionCount: number; // rows in Connections.csv
  recommendationsReceived: number;
  recommendationsGiven: number;
  endorsementsReceived: number;
  endorsementsGiven: number;
  recentActivityCount: number; // Shares.csv + Comments.csv rows in the last 12 months
}

// Signals extracted from a "Save to PDF" profile export — usable on ANY
// public profile you can view, not just your own data export. Much thinner
// on social-proof metrics (no connections/endorsements/recommendations/
// activity), so it's scored with a separate, distinct formula rather than
// forcing these into ParsedProfile's shape.
export interface PdfProfile {
  name: string;
  headline: string;
  company: string; // most recent/current employer, first entry in the Experience section
  positionYears: number; // career span, earliest role start to latest end/present
  roleCount: number; // number of distinct positions listed
  certCount: number;
  languageCount: number;
  topSkillCount: number; // LinkedIn's PDF only lists up to 3 — capped by design
  educationCount: number;
}

// A country flag graphic extracted from a bundled SVG, ready to embed as a
// nested <svg viewBox="{viewBox}">{inner}</svg> inside a card.
export interface FlagGraphic {
  viewBox: string;
  inner: string;
}

export interface Stats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export type Tier = "BRONZE" | "SILVER" | "GOLD" | "IN-FORM" | "TOTY" | "ICON";
export type SourceMode = "FULL" | "SCOUT";
export type CardStyle = "fut" | "tcg";

export interface CardData {
  name: string;
  headline: string;
  company: string;
  country: string;
  flag: FlagGraphic | null;
  stats: Stats;
  overall: number;
  tier: Tier;
  position: string;
  archetype: string;
  mode: SourceMode;
}
