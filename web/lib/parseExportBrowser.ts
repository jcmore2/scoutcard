import JSZip from "jszip";
import { extractProfile } from "../../src/extractProfile.js";
import type { ParsedProfile } from "../../src/types.js";

// Reads every entry out of the zip up front into a plain string map, then
// hands a synchronous lookup closure to the shared extractProfile() — same
// function the Node CLI uses, so scoring behaves identically either way.
export async function parseExportFile(file: File): Promise<ParsedProfile> {
  const zip = await JSZip.loadAsync(file);
  const filenames = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

  const contents = new Map<string, string>();
  await Promise.all(
    filenames.map(async (name) => {
      contents.set(name, await zip.files[name].async("string"));
    }),
  );

  return extractProfile((nameMatch) => {
    const match = filenames.find((name) => nameMatch.test(name));
    return match ? (contents.get(match) ?? null) : null;
  });
}
