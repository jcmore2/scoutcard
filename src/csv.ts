export type Row = Record<string, string>;

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

// Minimal RFC4180-ish CSV tokenizer (quoted fields, "" escaping, embedded
// commas/newlines inside quotes). Written by hand instead of pulling in a
// dependency so the exact same parser runs in both the Node CLI and the
// browser bundle with no platform-specific code.
function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let sawAnyField = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      sawAnyField = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
      sawAnyField = true;
    } else if (char === "\r") {
      continue;
    } else if (char === "\n") {
      row.push(field.trim());
      if (sawAnyField || row.some((f) => f !== "")) rows.push(row);
      row = [];
      field = "";
      sawAnyField = false;
    } else {
      field += char;
      sawAnyField = true;
    }
  }
  if (sawAnyField || field !== "" || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

export function parseCsv(raw: string): Row[] {
  const rows = tokenizeCsv(stripNotesPreamble(raw));
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((cells) => {
    const obj: Row = {};
    header.forEach((h, i) => {
      obj[h] = cells[i] ?? "";
    });
    return obj;
  });
}
