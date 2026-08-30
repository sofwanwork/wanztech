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

