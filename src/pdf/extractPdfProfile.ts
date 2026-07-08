import type { PdfLine } from "./lines.js";
import type { PdfProfile } from "../types.js";

// LinkedIn's "Save to PDF" renders sections in whatever language the
// *viewer's* LinkedIn UI is set to — this profile mixes Spanish section
// headers with English body text. English/Spanish/French/German/Portuguese
// headers are recognized; other locales degrade gracefully to 0 for that
// section rather than crashing.
const SKILLS_HEADERS = ["aptitudes principales", "top skills", "principales compétences", "top-kenntnisse", "principais competências"];
const LANGUAGES_HEADERS = ["languages", "idiomas", "langues", "sprachen"];
const CERTIFICATIONS_HEADERS = ["certifications", "certificaciones", "zertifizierungen", "certificações", "certificados"];
const EXPERIENCE_HEADERS = ["experiencia", "experience", "expérience", "berufserfahrung", "experiência"];
const EDUCATION_HEADERS = ["educación", "educacion", "education", "formation", "ausbildung", "formação acadêmica", "educação"];
const CONTACT_HEADERS = ["contact", "contactar", "contacter", "coordonnées", "kontakt", "contato", "contacte"];
const ALL_SIDEBAR_HEADERS = [...SKILLS_HEADERS, ...LANGUAGES_HEADERS, ...CERTIFICATIONS_HEADERS];
const ALL_HEADERS = [...ALL_SIDEBAR_HEADERS, ...EXPERIENCE_HEADERS, ...EDUCATION_HEADERS];

// Matches "linkedin.com/in/<handle>" with or without a "www." prefix, so the
// profile's own URL (shown under the Contact header) can be pulled out and
// linked from the card back.
const LINKEDIN_PROFILE_URL = /(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i;

// A role/date line looks like "<start> - <end> (<duration>)", e.g.
// "enero de 2025 - Present (1 año 7 meses)" or "Jun 2021 - Feb 2023 (1 yr 9 mos)".
// Matching on year digits + shape rather than month names keeps this
// locale-independent.
const DATE_RANGE_LINE = /^(.+?)\s+-\s+(.+?)\s+\(([^)]+)\)$/;
const YEAR = /\b(\d{4})\b/;
const PRESENT_WORDS = /\b(present|actualidad|actual|presente)\b/i;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function findHeaderIndex(lines: PdfLine[], headers: string[]): number {
  return lines.findIndex((l) => headers.includes(norm(l.text)));
}

function countSidebarSection(lines: PdfLine[], headers: string[], boundary: number): number {
  const start = findHeaderIndex(lines, headers);
  if (start === -1 || start >= boundary) return 0;
  let end = boundary;
  for (let i = start + 1; i < boundary; i++) {
    if (ALL_SIDEBAR_HEADERS.includes(norm(lines[i].text))) {
      end = i;
      break;
    }
  }
  return Math.max(0, end - start - 1);
}

function findProfileUrl(lines: PdfLine[], boundary: number): string {
  const start = findHeaderIndex(lines, CONTACT_HEADERS);
  if (start === -1 || start >= boundary) return "";
  for (let i = start + 1; i < boundary; i++) {
    if (ALL_SIDEBAR_HEADERS.includes(norm(lines[i].text))) break;
    const match = LINKEDIN_PROFILE_URL.exec(lines[i].text);
    if (match) return `https://${match[0]}`;
  }
  return "";
}

export function extractPdfProfile(lines: PdfLine[]): PdfProfile {
  if (lines.length === 0) {
    return {
      name: "",
      headline: "",
      company: "",
      location: "",
      profileUrl: "",
      positionYears: 0,
      roleCount: 0,
      certCount: 0,
      languageCount: 0,
      topSkillCount: 0,
      educationCount: 0,
    };
  }

  // The name is reliably the single largest-font run on the page — true
  // regardless of language, unlike header text matching.
  const nameIdx = lines.reduce((best, l, i) => (l.fontSize > lines[best].fontSize ? i : best), 0);

  const profileUrl = findProfileUrl(lines, nameIdx);
  const topSkillCount = countSidebarSection(lines, SKILLS_HEADERS, nameIdx);
  const languageCount = countSidebarSection(lines, LANGUAGES_HEADERS, nameIdx);
  const certCount = countSidebarSection(lines, CERTIFICATIONS_HEADERS, nameIdx);

  const name = lines[nameIdx]?.text ?? "";
  const headlineCandidate = lines[nameIdx + 1]?.text ?? "";
  const headline = ALL_HEADERS.includes(norm(headlineCandidate)) ? "" : headlineCandidate;

  // The location line (e.g. "Madrid y alrededores") sits right after the
  // headline, before the "About"/"Extracto" section — same layout LinkedIn
  // uses regardless of language.
  const locationCandidate = headline ? (lines[nameIdx + 2]?.text ?? "") : "";
  const location = ALL_HEADERS.includes(norm(locationCandidate)) ? "" : locationCandidate;

  const experienceStart = findHeaderIndex(lines, EXPERIENCE_HEADERS);
  const educationStart = findHeaderIndex(lines, EDUCATION_HEADERS);
  const experienceEnd = educationStart === -1 ? lines.length : educationStart;
  const experienceLines = experienceStart === -1 ? [] : lines.slice(experienceStart + 1, experienceEnd);

  // LinkedIn lists experience newest-first, and each entry's block starts
  // with the company name (before any per-role title/date line) — so the
  // very first experience line is the current/most recent employer.
  const company =
    experienceLines.length > 0 && !DATE_RANGE_LINE.test(experienceLines[0].text) ? experienceLines[0].text : "";

  let roleCount = 0;
  let earliestYear: number | null = null;
  const currentYear = new Date().getFullYear();

  for (const line of experienceLines) {
    const match = DATE_RANGE_LINE.exec(line.text);
    if (!match) continue;
    const [, startPart, endPart] = match;
    const startYearMatch = YEAR.exec(startPart);
    const hasEndYearOrPresent = YEAR.test(endPart) || PRESENT_WORDS.test(endPart);
    if (!startYearMatch || !hasEndYearOrPresent) continue;

    roleCount++;
    const startYear = parseInt(startYearMatch[1], 10);
    if (earliestYear === null || startYear < earliestYear) earliestYear = startYear;
  }

  const positionYears = earliestYear === null ? 0 : Math.max(0, currentYear - earliestYear);

  const educationLines = educationStart === -1 ? [] : lines.slice(educationStart + 1);
  const educationCount = educationLines.filter((l) => l.text.includes("·")).length;

  return {
    name,
    headline,
    company,
    location,
    profileUrl,
    positionYears,
    roleCount,
    certCount,
    languageCount,
    topSkillCount,
    educationCount,
  };
}
