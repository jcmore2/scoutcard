import type { FlagGraphic } from "./types.js";

export function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Wraps a name onto at most 2 lines so long full names (very common outside
// short GitHub-handle-style names) don't run off the edge of the card.
export function wrapName(name: string, maxCharsPerLine: number): [string] | [string, string] {
  if (name.length <= maxCharsPerLine) return [name];
  const words = name.split(" ");
  let line1 = "";
  let i = 0;
  for (; i < words.length; i++) {
    const candidate = line1 ? `${line1} ${words[i]}` : words[i];
    if (candidate.length > maxCharsPerLine && line1) break;
    line1 = candidate;
  }
  let line2 = words.slice(i).join(" ");
  if (line2.length > maxCharsPerLine) line2 = `${line2.slice(0, maxCharsPerLine - 1)}…`;
  return line2 ? [line1, line2] : [line1];
}

export function nameFontSize(longestLine: number): number {
  if (longestLine <= 14) return 22;
  if (longestLine <= 18) return 18;
  return 15;
}

export function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// Renders a bundled flag SVG (see src/flag.ts) as a nested <svg> at a given
// position, or "" if there's no flag to show — callers just splice this
// into their template regardless of whether a flag was resolved.
export function flagFragment(
  flag: FlagGraphic | null,
  x: number,
  y: number,
  width: number,
  height: number,
  borderColor: string,
): string {
  if (!flag) return "";
  return `
    <rect x="${x - 1}" y="${y - 1}" width="${width + 2}" height="${height + 2}" fill="none" stroke="${borderColor}" stroke-opacity="0.4" stroke-width="1" />
    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${flag.viewBox}" preserveAspectRatio="xMidYMid slice">${flag.inner}</svg>`;
}
