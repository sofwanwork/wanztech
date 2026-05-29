/**
 * Minimal CSV parser tailored for the bulk-certificate flow.
 *
 * Why hand-rolled rather than `papaparse`/`csv-parse`:
 *  - Zero new dependencies.
 *  - Tiny surface area — we just need: header row, quoted fields, escaped
 *    quotes (`""`), CRLF/LF line endings, BOM, empty cells.
 *  - Pure & synchronous so it stays unit-testable.
 *
 * Returns an array of objects keyed by the (trimmed) header row.
 */

export interface CsvParseOptions {
  /** Default `,` */
  delimiter?: string;
  /** Trim every cell. Default `true`. */
  trim?: boolean;
}

export interface CsvParseResult {
  headers: string[];
  rows: Array<Record<string, string>>;
}

/**
 * Tokenize a single CSV line into cells, respecting quotes and escaped
 * quotes. Newlines inside quoted cells must be unwrapped before this is
 * called — see `parseCSV` for the full state machine.
 */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Lookahead for escaped quote ("")
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

/**
 * Walk the source character-by-character to split logical rows. Quoted
 * fields may contain raw newlines, so we can't `String.split(/\r?\n/)`
 * up front.
 */
function splitRows(src: string): string[] {
  const rows: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"') {
      // Toggle quote state — escaped quotes are handled by splitLine.
      inQuotes = !inQuotes;
      cur += ch;
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      // Consume \r\n as one separator.
      if (ch === '\r' && src[i + 1] === '\n') i++;
      if (cur.length > 0) {
        rows.push(cur);
        cur = '';
      }
      continue;
    }
    cur += ch;
  }
  if (cur.length > 0) rows.push(cur);
  return rows;
}

export function parseCSV(input: string, options: CsvParseOptions = {}): CsvParseResult {
  const delimiter = options.delimiter ?? ',';
  const trim = options.trim ?? true;

  // Strip UTF-8 BOM
  let src = input;
  if (src.charCodeAt(0) === 0xfeff) src = src.slice(1);
  // Trim trailing whitespace so we don't end with an empty row.
  src = src.replace(/[\r\n]+$/, '');

  if (!src.trim()) return { headers: [], rows: [] };

  const lines = splitRows(src);
  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = splitLine(lines[0], delimiter);
  const headers = rawHeaders.map((h) => (trim ? h.trim() : h));

  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    // Skip blank lines (no usable cells)
    if (cells.length === 1 && cells[0].trim() === '') continue;
    const obj: Record<string, string> = {};
    for (let h = 0; h < headers.length; h++) {
      const v = cells[h] ?? '';
      obj[headers[h]] = trim ? v.trim() : v;
    }
    rows.push(obj);
  }
  return { headers, rows };
}

/**
 * Case-insensitive lookup against a row. Returns the first match, falling
 * back to common aliases. Useful so the user's CSV doesn't have to match
 * our exact field names.
 */
export function pickField(
  row: Record<string, string>,
  candidates: string[]
): string | undefined {
  const norm = (s: string) => s.toLowerCase().trim();
  const map = new Map<string, string>();
  for (const k of Object.keys(row)) map.set(norm(k), k);
  for (const cand of candidates) {
    const hit = map.get(norm(cand));
    if (hit) {
      const v = row[hit];
      if (v !== undefined && v !== '') return v;
    }
  }
  return undefined;
}
