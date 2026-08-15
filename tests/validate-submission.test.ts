import { describe, it, expect } from 'vitest';
import { validateSubmission, isLayoutOnlyField } from '@/lib/forms/validate-submission';
import type { FormField } from '@/lib/types/forms';

function field(overrides: Partial<FormField>): FormField {
  return {
    id: 'f1',
    type: 'text',
    label: 'Field 1',
    required: false,
    ...overrides,
  };
}

describe('isLayoutOnlyField', () => {
  it('flags separator, image and pagebreak as layout-only', () => {
    expect(isLayoutOnlyField(field({ type: 'separator' }))).toBe(true);
    expect(isLayoutOnlyField(field({ type: 'image' }))).toBe(true);
    expect(isLayoutOnlyField(field({ type: 'pagebreak' }))).toBe(true);
    expect(isLayoutOnlyField(field({ type: 'text' }))).toBe(false);
    expect(isLayoutOnlyField(field({ type: 'email' }))).toBe(false);
  });
});

describe('validateSubmission — required', () => {
  it('rejects a missing required field with a label-based message', () => {
    const fields = [field({ id: 'name', label: 'Full Name', required: true })];
    const result = validateSubmission(fields, { 'Full Name': '' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Full Name is required.');
  });

  it('accepts 0 and false as present values for required fields', () => {
    const fields = [
      field({ id: 'age', label: 'Age', type: 'number', required: true }),
    ];
    const result = validateSubmission(fields, { Age: 0 });
    expect(result.ok).toBe(true);
  });

  it('skips required check for layout-only fields', () => {
    const fields = [
      field({ id: 'sep1', label: 'Divider', type: 'separator', required: true }),
    ];
    const result = validateSubmission(fields, {});
    expect(result.ok).toBe(true);
  });
});

describe('validateSubmission — conditional visibility', () => {
  const fields: FormField[] = [
    field({ id: 'has_ic', label: 'Ada IC?', type: 'radio', options: ['Ya', 'Tidak'] }),
    field({
      id: 'ic_no',
      label: 'No. IC',
      required: true,
      conditional: { fieldId: 'has_ic', value: 'Ya' },
    }),
  ];

  it('rejects a required field that is VISIBLE under current answers', () => {
    const result = validateSubmission(fields, { 'Ada IC?': 'Ya', 'No. IC': '' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('No. IC is required.');
  });

  it('allows a required field HIDDEN by conditional logic to be empty', () => {
    // The exact regression this module fixes: server used to reject these.
    const result = validateSubmission(fields, { 'Ada IC?': 'Tidak', 'No. IC': '' });
    expect(result.ok).toBe(true);
  });

  it('works when the client sends values keyed by field id instead of label', () => {
    const result = validateSubmission(fields, { has_ic: 'Ya', ic_no: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('No. IC is required.');
  });

  it('multi-rule any/all logic is respected (rules array shape)', () => {
    const multi: FormField[] = [
      field({ id: 'a', label: 'A' }),
      field({ id: 'b', label: 'B' }),
      field({
        id: 'c',
        label: 'C',
        required: true,
        conditional: {
          rules: [
            { fieldId: 'a', operator: 'equals', value: 'x' },
            { fieldId: 'b', operator: 'equals', value: 'y' },
          ],
          logic: 'any',
        },
      }),
    ];
    // a=x → rule 1 true → visible (any) → required enforced
    expect(validateSubmission(multi, { A: 'x', B: 'zzz', C: '' }).ok).toBe(false);
    // neither matches → hidden → allowed empty
    expect(validateSubmission(multi, { A: 'q', B: 'zzz', C: '' }).ok).toBe(true);
  });
});

describe('validateSubmission — string constraints', () => {
  it('enforces minLength', () => {
    const fields = [
      field({ id: 't', label: 'Notes', validation: { minLength: 5 } }),
    ];
    const result = validateSubmission(fields, { Notes: 'abc' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Notes is too short.');
  });

  it('enforces maxLength', () => {
    const fields = [
      field({ id: 't', label: 'Notes', validation: { maxLength: 3 } }),
    ];
    const result = validateSubmission(fields, { Notes: 'abcdef' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Notes is too long.');
  });

  it('enforces pattern', () => {
    const fields = [
      field({
        id: 'e',
        label: 'Email',
        validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
      }),
    ];
    expect(validateSubmission(fields, { Email: 'not-an-email' }).ok).toBe(false);
    expect(validateSubmission(fields, { Email: 'a@b.co' }).ok).toBe(true);
  });

  it('skips pattern checks when the stored regex is invalid (no crash)', () => {
    const fields = [
      field({ id: 'e', label: 'Weird', validation: { pattern: '([unclosed' } }),
    ];
    const result = validateSubmission(fields, { Weird: 'anything' });
    expect(result.ok).toBe(true);
  });

  it('caps regex input length (ReDoS guard) — long input does not hang', () => {
    const evil = 'a'.repeat(50_000);
    const fields = [
      field({ id: 'e', label: 'Long', validation: { pattern: '^(a+)+$' } }),
    ];
    // Classic catastrophic backtracking input; the 1000-char cap keeps it fast.
    const start = Date.now();
    const result = validateSubmission(fields, { Long: evil });
    const ms = Date.now() - start;
    expect(ms).toBeLessThan(2000);
    expect(result.ok).toBe(true); // 1000 a's matches ^(a+)+$ — fine either way
  });
});
