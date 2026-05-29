/**
 * Pure conditional-logic evaluator for form fields.
 *
 * Kept as pure functions (no async, no I/O) so it can be:
 *  - shared between the public form runtime and unit tests
 *  - extended on the server in future (we currently only enforce on client)
 *
 * Backward compatibility: older saved forms have the legacy
 * `{ fieldId, value }` shape (single equals rule). We normalize on read and
 * evaluate uniformly through `ConditionRule[]`.
 */

import type {
  ConditionalConfig,
  ConditionOperator,
  ConditionRule,
  FormField,
} from '@/lib/types/forms';

/**
 * Convert a possibly-legacy `ConditionalConfig` into a normalized rules array.
 * Returns `null` if the config is empty / has no usable rules.
 */
export function normalizeConditional(
  cfg: ConditionalConfig | undefined | null
): { rules: ConditionRule[]; logic: 'all' | 'any' } | null {
  if (!cfg) return null;

  // New shape wins if provided.
  if (cfg.rules && cfg.rules.length > 0) {
    const filtered = cfg.rules.filter((r) => r && r.fieldId);
    if (filtered.length === 0) return null;
    return { rules: filtered, logic: cfg.logic ?? 'all' };
  }

  // Legacy fallback.
  if (cfg.fieldId) {
    return {
      rules: [{ fieldId: cfg.fieldId, operator: 'equals', value: cfg.value ?? '' }],
      logic: 'all',
    };
  }

  return null;
}

/**
 * Coerce a form-data value into a comparable string. Handles arrays and dates.
 */
function toComparable(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map((x) => String(x ?? '')).join(',');
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

/**
 * Evaluate a single rule against the current form-data map.
 * `formData` is keyed by field id (matches public form's runtime state).
 */
export function evaluateRule(
  rule: ConditionRule,
  formData: Record<string, unknown>
): boolean {
  const raw = formData[rule.fieldId];
  const lhs = toComparable(raw);
  const rhs = rule.value ?? '';

  switch (rule.operator as ConditionOperator) {
    case 'equals':
      return lhs === rhs;
    case 'not_equals':
      return lhs !== rhs;
    case 'contains':
      return lhs.toLowerCase().includes(rhs.toLowerCase());
    case 'not_contains':
      return !lhs.toLowerCase().includes(rhs.toLowerCase());
    case 'is_empty':
      return lhs === '';
    case 'is_not_empty':
      return lhs !== '';
    case 'gt': {
      const a = Number(lhs);
      const b = Number(rhs);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      return a > b;
    }
    case 'lt': {
      const a = Number(lhs);
      const b = Number(rhs);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      return a < b;
    }
    default:
      return true; // Unknown operator — fail open (visible).
  }
}

/**
 * Decide whether a given field should render given the current form data.
 *
 * Returns `true` if no condition is set (always visible).
 * If a referenced source field is missing from the schema entirely we treat
 * the rule as failed-open (visible) so a broken rule never silently hides
 * required questions.
 */
export function evaluateConditional(
  field: FormField,
  formData: Record<string, unknown>,
  allFields: FormField[]
): boolean {
  const norm = normalizeConditional(field.conditional);
  if (!norm) return true;

  const validIds = new Set(allFields.map((f) => f.id));
  const usable = norm.rules.filter((r) => validIds.has(r.fieldId));
  if (usable.length === 0) return true;

  if (norm.logic === 'any') {
    return usable.some((r) => evaluateRule(r, formData));
  }
  return usable.every((r) => evaluateRule(r, formData));
}

/**
 * Available operators surfaced to the rule editor UI. Order matters (UX).
 */
export const CONDITION_OPERATORS: Array<{ value: ConditionOperator; label: string }> = [
  { value: 'equals', label: 'sama dengan' },
  { value: 'not_equals', label: 'tidak sama dengan' },
  { value: 'contains', label: 'mengandungi' },
  { value: 'not_contains', label: 'tidak mengandungi' },
  { value: 'is_empty', label: 'kosong' },
  { value: 'is_not_empty', label: 'tidak kosong' },
  { value: 'gt', label: 'lebih besar dari' },
  { value: 'lt', label: 'lebih kecil dari' },
];

/**
 * Whether an operator requires a value input.
 */
export function operatorNeedsValue(op: ConditionOperator): boolean {
  return op !== 'is_empty' && op !== 'is_not_empty';
}
