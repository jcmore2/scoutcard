export interface ParsedProfile {
  firstName: string;
  lastName: string;
  headline: string;
  positionYears: number; // total years spanned across Positions.csv
  skillCount: number; // unique entries in Skills.csv
  connectionCount: number; // rows in Connections.csv
  recommendationsReceived: number;
  recommendationsGiven: number;
  endorsementsReceived: number;
  endorsementsGiven: number;
  recentActivityCount: number; // Shares.csv + Comments.csv rows in the last 12 months
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

export interface CardData {
  name: string;
  headline: string;
  country: string;
  stats: Stats;
  overall: number;
  tier: Tier;
  position: string;
  archetype: string;
}
