import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import type { ParsedProfile } from "./types.js";

type Row = Record<string, string>;

// Some LinkedIn export files (notably Connections.csv) prepend a "Notes:"
// disclaimer paragraph before the real header row. Strip it if present —
// but only that specific pattern, since plenty of files (e.g. the
// single-column Skills.csv) have no commas at all and would be wrongly
// emptied by a generic "find the first line with a comma" heuristic.
function stripNotesPreamble(raw: string): string {
  const lines = raw.split(/\r?\n/);
  if (!/^notes:?\s*$/i.test(lines[0]?.trim() ?? "")) return raw;
  const blankIndex = lines.findIndex((l, i) => i > 0 && l.trim() === "");
  if (blankIndex === -1) return raw;
  return lines.slice(blankIndex + 1).join("\n");
}

function parseCsv(raw: string): Row[] {
  const csvText = stripNotesPreamble(raw);
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Row[];
}

function findFile(zip: AdmZip, nameMatch: RegExp): string | null {
  const entry = zip.getEntries().find((e) => nameMatch.test(e.entryName));
  if (!entry) return null;
  return entry.getData().toString("utf-8");
}

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

function loadRows(zip: AdmZip, nameMatch: RegExp, label: string): Row[] {
  const raw = findFile(zip, nameMatch);
  if (!raw) {
    console.warn(`[parseExport] ${label} not found in export — defaulting to empty`);
    return [];
  }
  try {
    return parseCsv(raw);
  } catch (err) {
    console.warn(`[parseExport] failed to parse ${label}:`, (err as Error).message);
    return [];
  }
}

export function parseExport(zipPath: string): ParsedProfile {
  const zip = new AdmZip(zipPath);

  const profileRows = loadRows(zip, /^Profile\.csv$/i, "Profile.csv");
  const positionRows = loadRows(zip, /^Positions\.csv$/i, "Positions.csv");
  const skillRows = loadRows(zip, /^Skills\.csv$/i, "Skills.csv");
  const connectionRows = loadRows(zip, /Connections\.csv$/i, "Connections.csv");
  const recsReceived = loadRows(zip, /Recommendations[_ ]?Received\.csv$/i, "Recommendations_Received.csv");
  const recsGiven = loadRows(zip, /Recommendations[_ ]?Given\.csv$/i, "Recommendations_Given.csv");
  const endorseReceived = loadRows(zip, /Endorsement[_ ]?Received/i, "Endorsement_Received_Info.csv");
  const endorseGiven = loadRows(zip, /Endorsement[_ ]?Given/i, "Endorsement_Given_Info.csv");
  const shares = loadRows(zip, /^Shares\.csv$/i, "Shares.csv");
  const comments = loadRows(zip, /^Comments\.csv$/i, "Comments.csv");

  const profile = profileRows[0] ?? {};
  const firstName = findColumn(profile, ["First Name"]);
  const lastName = findColumn(profile, ["Last Name"]);
  const headline = findColumn(profile, ["Headline"]);

  const startDates = positionRows
    .map((r) => parseMonthYear(findColumn(r, ["Started On"])))
    .filter((d): d is Date => d !== null);
  const earliestStart = startDates.length
    ? new Date(Math.min(...startDates.map((d) => d.getTime())))
    : null;
  const positionYears = earliestStart
    ? (Date.now() - earliestStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    : 0;

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
