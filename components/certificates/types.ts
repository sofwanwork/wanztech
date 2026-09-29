// Shared types for certificate templates

export interface TemplateProps {
  id?: string;
  name: string;
  program: string;
  formattedDate?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  component: React.ComponentType<TemplateProps>;
}

// Template IDs as const for type safety
export const TEMPLATE_IDS = [
  'classic',
  'modern',
  'elegant',
  'corporate',
  'creative',
  'minimalist',
  'premium',
  'vintage',
  'nature',
  'royal',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/**
 * Calculates optimal font size for certificate program titles
 * to keep long and multi-line titles balanced, aesthetic, and within safe bounds.
 */
export function getProgramFontSize(text: string | null | undefined, baseSize: number = 40): number {
  if (!text) return baseSize;

  const raw = text.trim();
  if (!raw) return baseSize;

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const totalLength = raw.length;
  const maxLineLength = lines.length > 0 ? Math.max(...lines.map((l) => l.length)) : totalLength;

  // Very long titles (80+ characters total, or 40+ chars on a single line, or 3+ lines)
  if (totalLength >= 80 || maxLineLength >= 40 || lines.length >= 3) {
    return Math.max(18, Math.round(baseSize * 0.58));
  }

  // Medium-long titles (45-79 characters total, or 28+ chars on a line, or 2 lines)
  if (totalLength >= 45 || maxLineLength >= 28 || lines.length === 2) {
    return Math.max(22, Math.round(baseSize * 0.75));
  }

  // Slightly long titles (28-44 characters)
  if (totalLength >= 28 || maxLineLength >= 24) {
    return Math.max(26, Math.round(baseSize * 0.88));
  }

  // Short titles (<28 characters, 1 line)
  return baseSize;
}

/**
 * Determines whether a participant name is considered "short" (should strictly stay on 1 line)
 * or "long" (may wrap up to a maximum of 2 lines).
 * Names up to 28 characters (e.g. "SOFWAN BIN MOHD JAILANI" = 23 chars) without manual newlines
 * are classified as short names.
 */
export function isShortName(name: string | null | undefined): boolean {
  if (!name) return true;
  const raw = name.trim();
  if (raw.includes('\n')) return false;
  return raw.length <= 28;
}

/**
 * Calculates optimal font size for participant names on certificates.
 * - Short names (<= 28 chars, e.g. "SOFWAN BIN MOHD JAILANI"): Stays on 1 line. Clamped if baseSize > 52px.
 * - Medium-long names (29 - 43 chars): Scaled to ~78% so it formats cleanly into at most 2 lines.
 * - Very long names (44+ chars): Scaled to ~62% (minimum 18px) so it strictly fits within 2 lines.
 */
export function getNameFontSize(name: string | null | undefined, baseSize: number = 46): number {
  if (!name) return baseSize;

  const raw = name.trim();
  if (!raw) return baseSize;

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const totalLength = raw.length;

  // Very long names (44+ characters or explicit 2+ lines with high char count)
  if (totalLength >= 44 || (lines.length >= 2 && totalLength >= 36)) {
    return Math.max(18, Math.round(baseSize * 0.62));
  }

  // Medium-long names (29 - 43 characters or explicit 2 lines)
  if (totalLength >= 29 || lines.length === 2) {
    return Math.max(22, Math.round(baseSize * 0.78));
  }

  // Short names (<= 28 characters, e.g. "SOFWAN BIN MOHD JAILANI" = 23 chars)
  // Ensure base font is not excessively large (> 52px) on medium-short names (21-28 chars)
  if (totalLength > 20 && baseSize > 52) {
    return 52;
  }

  return baseSize;
}

