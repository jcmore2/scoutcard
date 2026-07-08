import { parseCsv, type Row } from "./csv.js";
import type { ParsedProfile } from "./types.js";

// Looks up a file's raw text content by matching its name against a regex,
// or null if no such file exists in the export. Implemented once per
// platform (Node zip reading vs. browser zip reading) and passed in here so
// this module has no dependency on either.
export type FileLookup = (nameMatch: RegExp) => string | null;

function findColumn(row: Row, candidates: string[]): string {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const key = keys.find((k) => k.toLowerCase().includes(candidate.toLowerCase()));
    if (key) return row[key] ?? "";
  }
  return "";
}

function parseMonthYear(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value.includes(" ") ? `1 ${value}` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Prefers a still-ongoing role (no "Finished On") with the latest start
// date; falls back to the most recently started role if none are ongoing.
function findCurrentCompany(positionRows: Row[]): string {
  const entries = positionRows
    .map((r) => ({
      company: findColumn(r, ["Company Name"]),
      started: parseMonthYear(findColumn(r, ["Started On"])),
      ongoing: findColumn(r, ["Finished On"]).trim() === "",
    }))
    .filter((e) => e.company);
  if (entries.length === 0) return "";

  const pool = entries.some((e) => e.ongoing) ? entries.filter((e) => e.ongoing) : entries;
  const latest = pool.reduce((best, e) => {
    if (!best.started) return e;
    if (!e.started) return best;
    return e.started.getTime() > best.started.getTime() ? e : best;
  });
  return latest.company;
}

function loadRows(getFile: FileLookup, nameMatch: RegExp, label: string): Row[] {
  const raw = getFile(nameMatch);
  if (!raw) {
    console.warn(`[extractProfile] ${label} not found in export — defaulting to empty`);
    return [];
  }
  try {
    return parseCsv(raw);
  } catch (err) {
    console.warn(`[extractProfile] failed to parse ${label}:`, (err as Error).message);
    return [];
  }
}

export function extractProfile(getFile: FileLookup): ParsedProfile {
  const profileRows = loadRows(getFile, /^Profile\.csv$/i, "Profile.csv");
  const positionRows = loadRows(getFile, /^Positions\.csv$/i, "Positions.csv");
  const skillRows = loadRows(getFile, /^Skills\.csv$/i, "Skills.csv");
  const connectionRows = loadRows(getFile, /Connections\.csv$/i, "Connections.csv");
  const recsReceived = loadRows(getFile, /Recommendations[_ ]?Received\.csv$/i, "Recommendations_Received.csv");
  const recsGiven = loadRows(getFile, /Recommendations[_ ]?Given\.csv$/i, "Recommendations_Given.csv");
  const endorseReceived = loadRows(getFile, /Endorsement[_ ]?Received/i, "Endorsement_Received_Info.csv");
  const endorseGiven = loadRows(getFile, /Endorsement[_ ]?Given/i, "Endorsement_Given_Info.csv");
  const shares = loadRows(getFile, /^Shares\.csv$/i, "Shares.csv");
  const comments = loadRows(getFile, /^Comments\.csv$/i, "Comments.csv");

  const profile = profileRows[0] ?? {};
  const firstName = findColumn(profile, ["First Name"]);
  const lastName = findColumn(profile, ["Last Name"]);
  const headline = findColumn(profile, ["Headline"]);
  const location = findColumn(profile, ["Geo Location"]);

  const startDates = positionRows
    .map((r) => parseMonthYear(findColumn(r, ["Started On"])))
    .filter((d): d is Date => d !== null);
  const earliestStart = startDates.length
    ? new Date(Math.min(...startDates.map((d) => d.getTime())))
    : null;
  const positionYears = earliestStart
    ? (Date.now() - earliestStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    : 0;

  const company = findCurrentCompany(positionRows);

  const skillCount = new Set(skillRows.map((r) => findColumn(r, ["Name"]).toLowerCase()).filter(Boolean)).size;

  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const recentActivityCount = [...shares, ...comments].filter((r) => {
    const dateStr = findColumn(r, ["Date"]);
    const date = new Date(dateStr);
    return !Number.isNaN(date.getTime()) && date.getTime() >= oneYearAgo;
  }).length;

  return {
    firstName,
    lastName,
    headline,
    company,
    location,
    profileUrl: "",
    positionYears: Math.max(0, positionYears),
    skillCount,
    connectionCount: connectionRows.length,
    recommendationsReceived: recsReceived.length,
    recommendationsGiven: recsGiven.length,
    endorsementsReceived: endorseReceived.length,
    endorsementsGiven: endorseGiven.length,
    recentActivityCount,
  };
}
