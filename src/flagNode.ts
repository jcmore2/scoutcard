import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { wrapFlagSvg, normalizeCountryCode } from "./flag.js";
import type { FlagGraphic } from "./types.js";

const require = createRequire(import.meta.url);

export function loadFlagGraphic(countryCode: string): FlagGraphic | null {
  const cc = normalizeCountryCode(countryCode);
  if (!cc) return null;

  const packageJsonPath = require.resolve("flag-icons/package.json");
  const flagPath = join(dirname(packageJsonPath), "flags", "4x3", `${cc}.svg`);
  if (!existsSync(flagPath)) return null;

  return wrapFlagSvg(readFileSync(flagPath, "utf-8"));
}
