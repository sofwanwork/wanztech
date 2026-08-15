/**
 * Pure server-side validation of form submissions.
 *
 * Extracted from submitFormAction so it can be unit-tested and so both the
 * new-submission path and the edit path share one implementation.
 *
 * Fixes two long-standing gaps:
 *  1. Conditional logic was ignored server-side: a required field hidden by
 *     conditional rules was rejected with "X is required" even though the
 *     respondent never saw it. We now reuse the SAME pure evaluator the
 *     public client uses (`evaluateConditional`), keyed by field id.
 *  2. Layout-only fields (separator/image/pagebreak) are skipped like the
 *     client does.
 */

import { evaluateConditional } from '@/lib/forms/conditions';
import type { FormField } from '@/lib/types/forms';

export interface SubmissionValidationResult {
  ok: boolean;
  /** First error message (respondent-facing), null when ok. */
  error: string | null;
}

/** Layout-only field types never carry data. */
export function isLayoutOnlyField(field: FormField): boolean {
  return field.type === 'separator' || field.type === 'image' || field.type === 'pagebreak';
}

const MAX_REGEX_INPUT = 1000;

/**
 * Validate a submission against the form schema.
 *
 * @param fields      form schema
 * @param inputData   submitted values keyed by field LABEL (what the public
 *                    client sends) — field.id is also accepted as fallback
 * @param formDataById current values keyed by field ID, used to evaluate
 *                    conditional visibility. When omitted, conditions are
 *                    evaluated against inputData re-keyed by id.
 */
export function validateSubmission(
  fields: FormField[],
  inputData: Record<string, unknown>
): SubmissionValidationResult {
  // Re-key by field id so conditional evaluation matches the client runtime.
  const byId: Record<string, unknown> = {};
  for (const field of fields) {
    const value = inputData[field.label] ?? inputData[field.id];
    if (value !== undefined) byId[field.id] = value;
  }

  for (const field of fields) {
    if (isLayoutOnlyField(field)) continue;

    const value = inputData[field.label] ?? inputData[field.id];

    // Required check — only enforced when the field is VISIBLE under the
    // current answers (same evaluator as the client, so no mismatch).
    if (field.required && !value && value !== 0 && value !== false) {
      if (evaluateConditional(field, byId, fields)) {
        return { ok: false, error: `${field.label} is required.` };
      }
      continue; // hidden by conditional logic — allowed to be empty
    }

    if (typeof value === 'string') {
      if (field.validation?.minLength && value.length < field.validation.minLength) {
        return { ok: false, error: `${field.label} is too short.` };
      }
      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        return { ok: false, error: `${field.label} is too long.` };
      }
      if (field.validation?.pattern) {
        try {
          // Security: cap length before running a user-supplied regex (ReDoS).
          const testValue =
            value.length > MAX_REGEX_INPUT ? value.slice(0, MAX_REGEX_INPUT) : value;
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(testValue)) {
            return { ok: false, error: `${field.label} format is invalid.` };
          }
        } catch {
          console.warn(`Invalid regex pattern for field "${field.label}". Skipping pattern check.`);
        }
      }
    }
  }

  return { ok: true, error: null };
}
