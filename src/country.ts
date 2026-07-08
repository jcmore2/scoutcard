import countries from "./countryData.json";

interface CountryEntry {
  code: string;
  name: string;
  capital: string;
}

const NAME_TO_CODE = new Map<string, string>();
const CAPITAL_TO_CODE = new Map<string, string>();
for (const c of countries as CountryEntry[]) {
  NAME_TO_CODE.set(c.name.toLowerCase(), c.code);
  if (c.capital) CAPITAL_TO_CODE.set(c.capital.toLowerCase(), c.code);
}

// LinkedIn location text is free-form ("Madrid y alrededores", "San
// Francisco Bay Area") and often doesn't literally name the country, so
// country name/capital matching alone misses a lot. A handful of common
// non-English names and abbreviations fill the biggest gaps without trying
// to be a full localization dictionary.
const EXTRA_NAMES: Record<string, string> = {
  españa: "es",
  "estados unidos": "us",
  méxico: "mx",
  mexico: "mx",
  "reino unido": "gb",
  alemania: "de",
  francia: "fr",
  "usa": "us",
  "u.s.": "us",
  "u.s.a.": "us",
  uk: "gb",
};

// Major hubs that show up constantly in LinkedIn locations but aren't
// national capitals, so the capital-matching pass above misses them
// (e.g. "San Francisco Bay Area" names neither "United States" nor "us").
const HUB_CITIES: Record<string, string> = {
  "bay area": "us",
  "silicon valley": "us",
  "san francisco": "us",
  "new york": "us",
  "los angeles": "us",
  seattle: "us",
  boston: "us",
  chicago: "us",
  austin: "us",
  houston: "us",
  dallas: "us",
  denver: "us",
  miami: "us",
  atlanta: "us",
  philadelphia: "us",
  toronto: "ca",
  vancouver: "ca",
  montreal: "ca",
  barcelona: "es",
  bangalore: "in",
  bengaluru: "in",
  mumbai: "in",
  delhi: "in",
  hyderabad: "in",
  pune: "in",
  "são paulo": "br",
  "sao paulo": "br",
  shanghai: "cn",
  shenzhen: "cn",
  guangzhou: "cn",
  dubai: "ae",
  frankfurt: "de",
  munich: "de",
  hamburg: "de",
  milan: "it",
  manchester: "gb",
  sydney: "au",
  melbourne: "au",
  brisbane: "au",
  osaka: "jp",
  zurich: "ch",
  geneva: "ch",
};

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);
const US_STATE_ABBR = /,\s*([A-Z]{2})\b/;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWord(haystack: string, needle: string): boolean {
  return new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i").test(haystack);
}

// Best-effort, in order: a known country name, a capital city name (catches
// "Madrid y alrededores" → Spain), a major non-capital hub city ("San
// Francisco Bay Area" → US), then a US state abbreviation ("Austin, TX").
// Returns null rather than guessing wrong when nothing matches.
export function guessCountryCode(location: string): string | null {
  if (!location) return null;

  for (const [name, code] of Object.entries(EXTRA_NAMES)) {
    if (containsWord(location, name)) return code;
  }
  for (const [name, code] of NAME_TO_CODE) {
    if (containsWord(location, name)) return code;
  }
  for (const [capital, code] of CAPITAL_TO_CODE) {
    if (containsWord(location, capital)) return code;
  }
  for (const [city, code] of Object.entries(HUB_CITIES)) {
    if (containsWord(location, city)) return code;
  }
  const stateMatch = US_STATE_ABBR.exec(location);
  if (stateMatch && US_STATES.has(stateMatch[1])) return "us";

  return null;
}
