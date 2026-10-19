export interface ScaleGuide {
  intro?: string;
  min: string;
  max: string;
  minLabel?: string;
  maxLabel?: string;
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
