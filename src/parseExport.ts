import AdmZip from "adm-zip";
import { extractProfile } from "./extractProfile.js";
import type { ParsedProfile } from "./types.js";

export function parseExport(zipPath: string): ParsedProfile {
  const zip = new AdmZip(zipPath);
  return extractProfile((nameMatch) => {
    const entry = zip.getEntries().find((e) => nameMatch.test(e.entryName));
    return entry ? entry.getData().toString("utf-8") : null;
  });
}
