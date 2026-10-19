import type { FormField } from '@/lib/types/forms';

export interface ScaleGuide {
  intro?: string;
  min: string;
  max: string;
  minLabel?: string;
  maxLabel?: string;
}

/**
 * Common keywords used in rating scales, satisfaction levels, and Likert choices (Malay & English).
 */
const SCALE_KEYWORDS = [
  'lemah',
  'sederhana',
  'baik',
  'cemerlang',
  'memuaskan',
  'setuju',
  'puas',
  'tahap',
  'rendah',
  'tinggi',
  'kerap',
  'jarang',
  'selalu',
  'sentiasa',
  'berkecuali',
  'tidak pasti',
  'kurang',
  'sangat',
  'poor',
  'fair',
  'good',
  'excellent',
  'satisf',
  'agree',
  'disagree',
  'neutral',
  'low',
  'high',
  'medium',
  'never',
  'rarely',
  'sometimes',
  'often',
  'always',
  'star',
  'bintang',
];

/**
 * Checks whether an array of choices represents a rating scale (Likert, satisfaction, grading, or numeric scale).
 * Used to automatically render scale choices horizontally for a compact, clean layout.
 */
export function isScaleLikeOptions(options?: string[]): boolean {
  if (!options || !Array.isArray(options) || options.length < 2 || options.length > 7) {
    return false;
  }

  const cleaned = options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean);
  if (cleaned.length !== options.length) return false;

  // Each scale option is typically concise (<= 22 characters)
  if (!cleaned.every((opt) => opt.length <= 22)) return false;

  // 1. All numeric scales: e.g. ['1', '2', '3', '4', '5'] or ['1 - Lemah', '2 - Sederhana', ...]
  const isNumericScale = cleaned.every((opt) => /^[0-9]+(\s*[-–.)]\s*.+)?$/.test(opt));
  if (isNumericScale) return true;

  // 2. Binary polarity choices: e.g. ['Ya', 'Tidak'], ['Yes', 'No']
  const lowerAll = cleaned.map((o) => o.toLowerCase());
  if (
    cleaned.length === 2 &&
    ((lowerAll.includes('ya') && lowerAll.includes('tidak')) ||
      (lowerAll.includes('yes') && lowerAll.includes('no')) ||
      (lowerAll.includes('true') && lowerAll.includes('false')))
  ) {
    return true;
  }

  // 3. Known scale keywords (Likert / satisfaction / performance levels)
  const hasScaleKeywords = lowerAll.some((opt) =>
    SCALE_KEYWORDS.some((kw) => opt.includes(kw))
  );

  return hasScaleKeywords;
}

/**
 * Resolves whether a form field's options should be rendered horizontally (mendatar).
 * Prioritizes explicit `optionsLayout` configuration, falling back to smart scale detection.
 */
export function isFieldHorizontal(
  field?: Partial<FormField> | { optionsLayout?: 'vertical' | 'horizontal'; options?: string[] } | null
): boolean {
  if (!field) return false;
  if (field.optionsLayout === 'horizontal') return true;
  if (field.optionsLayout === 'vertical') return false;
  return isScaleLikeOptions(field.options);
}

/**
 * Detects and parses user-typed ASCII scale diagrams commonly used in Malaysian course evaluations
 * e.g.: "Sila isi skala seperti berikut : 1-----------------------------> 6 Sangat tidak setuju          Sangat Setuju"
 * or: "1 -------> 5"
 */
export function parseScaleGuide(text: string | undefined | null): ScaleGuide | null {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();
  if (!trimmed) return null;

  // Match pattern: [intro] (min) ---dashes/arrow--- (max) [labels]
  // Requires at least 3 consecutive hyphens/dashes to distinguish from standard hyphens
  const match = trimmed.match(
    /^([\s\S]*?)(?:^|\s)(\d+)\s*[-—–]{3,}\s*(?:>|→)?\s*(\d+)([\s\S]*)$/
  );

  if (!match) return null;

  const [, rawIntro, min, max, rawRest] = match;
  const intro = rawIntro ? rawIntro.trim() : undefined;
  const rest = rawRest ? rawRest.trim() : '';

  let minLabel: string | undefined;
  let maxLabel: string | undefined;

  if (rest) {
    // If rest contains two labels separated by 2+ spaces or newline or delimiter (/ or -> or to)
    const doubleSpaceSplit = rest.split(/\s{2,}|\n+/).map((s) => s.trim()).filter(Boolean);
    if (doubleSpaceSplit.length >= 2) {
      minLabel = doubleSpaceSplit[0];
      maxLabel = doubleSpaceSplit[doubleSpaceSplit.length - 1];
    } else {
      // Check for delimiter like " - " or " / " or " to " or " hingga " or " -> "
      const delimSplit = rest.split(/\s*(?:\/|->|—|–|\bto\b|\bhingga\b)\s*/i).map((s) => s.trim()).filter(Boolean);
      if (delimSplit.length >= 2) {
        minLabel = delimSplit[0];
        maxLabel = delimSplit[delimSplit.length - 1];
      } else {
        // Fallback: If rest is a single string, check if it starts with "1:" or similar
        minLabel = rest;
      }
    }
  }

  return {
    intro: intro || undefined,
    min,
    max,
    minLabel: minLabel || undefined,
    maxLabel: maxLabel || undefined,
  };
}
