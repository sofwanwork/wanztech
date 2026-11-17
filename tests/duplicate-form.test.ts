import { describe, it, expect } from 'vitest';
import { buildDuplicatedTitle, cloneFormForDuplication } from '@/lib/forms/duplicate';
import type { Form } from '@/lib/types';

describe('buildDuplicatedTitle', () => {
  it('appends (Copy) and increments copy counter cleanly', () => {
    expect(buildDuplicatedTitle('genz')).toBe('genz (Copy)');
    expect(buildDuplicatedTitle('genz (Copy)')).toBe('genz (Copy 2)');
    expect(buildDuplicatedTitle('genz (Copy 2)')).toBe('genz (Copy 3)');
    expect(buildDuplicatedTitle('')).toBe('Untitled Form (Copy)');
  });
});

describe('cloneFormForDuplication', () => {
  const sourceForm: Form = {
    id: 'form-orig-1',
    userId: 'user-123',
    title: 'Workshop Registration',
    description: '<p>Welcome</p>',
    coverImage: 'https://example.com/cover.png',
    thankYouMessage: '<p>Thanks!</p>',
    redirectButtons: [{ text: 'Visit Site', url: 'https://klikform.com' }],
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/ORIG_SHEET',
    allowMultipleSubmissions: false,
    receiveEmailNotifications: true,
    isActive: true,
    shortCode: 'abc123',
    createdAt: '2026-01-01T00:00:00.000Z',
    theme: {
      primaryColor: '#4c1d95',
      backgroundPattern: 'dots',
    },
    fields: [
      {
        id: 'f-email',
        type: 'email',
        label: 'Email',
        required: true,
      },
      {
        id: 'f-role',
        type: 'select',
        label: 'Category',
        required: true,
        options: ['Participant', 'Speaker'],
      },
      {
        id: 'f-topic',
        type: 'text',
        label: 'Talk Topic',
        required: false,
        conditional: {
          fieldId: 'f-role',
          value: 'Speaker',
          rules: [{ fieldId: 'f-role', operator: 'equals', value: 'Speaker' }],
          logic: 'all',
        },
      },
      {
        id: 'f-prod',
        type: 'product',
        label: 'Merch',
        required: false,
        products: [{ id: 'prod-1', name: 'Shirt', price: 30, currency: 'MYR' }],
      },
    ],
    eCertificateEnabled: true,
    eCertificateTemplate: 'tpl-1',
    eCertificateCategory: {
      fieldId: 'f-role',
      map: { Participant: 'tpl-part', Speaker: 'tpl-spk' },
    },
    attendanceSettings: {
      enabled: true,
      checkInOut: {
        enabled: true,
        identifierFieldId: 'f-email',
        totalDays: 2,
      },
      rotatingQr: {
        enabled: true,
        intervalSeconds: 30,
        secret: 'orig-secret-xyz',
      },
    },
    editLinkSettings: {
      enabled: true,
      expiryDays: 7,
      emailFieldId: 'f-email',
    },
    respondentNotification: {
      enabled: true,
      emailFieldId: 'f-email',
      includeSummary: true,
    },
    pdpaSettings: {
      enabled: true,
      consentText: 'I agree',
    },
    qrSettings: {
      dotsColor: '#4c1d95',
    },
  };

  it('deep-clones form settings, remaps field IDs & cross-references, and isolates sheet/shortCode/secret', () => {
    let seq = 0;
    const cloned = cloneFormForDuplication(sourceForm, {
      newId: 'form-copy-2',
      newGoogleSheetUrl: 'https://docs.google.com/spreadsheets/d/NEW_SHEET',
      nowIso: '2026-11-17T14:00:00.000Z',
      generateId: () => `new-id-${++seq}`,
    });

    expect(cloned.id).toBe('form-copy-2');
    expect(cloned.title).toBe('Workshop Registration (Copy)');
    expect(cloned.shortCode).toBeUndefined();
    expect(cloned.googleSheetUrl).toBe('https://docs.google.com/spreadsheets/d/NEW_SHEET');
    expect(cloned.createdAt).toBe('2026-11-17T14:00:00.000Z');
    expect(cloned.attendanceSettings?.rotatingQr?.secret).toBeUndefined();

    // New field IDs assigned (f-email -> new-id-1, f-role -> new-id-2, f-topic -> new-id-3, f-prod -> new-id-4)
    expect(cloned.fields.map((f) => f.id)).toEqual([
      'new-id-1',
      'new-id-2',
      'new-id-3',
      'new-id-4',
    ]);
    expect(cloned.fields[3].products?.[0].id).toBe('new-id-5');

    // Cross-references updated to new field IDs
    expect(cloned.fields[2].conditional?.fieldId).toBe('new-id-2');
    expect(cloned.fields[2].conditional?.rules?.[0].fieldId).toBe('new-id-2');
    expect(cloned.attendanceSettings?.checkInOut?.identifierFieldId).toBe('new-id-1');
    expect(cloned.editLinkSettings?.emailFieldId).toBe('new-id-1');
    expect(cloned.respondentNotification?.emailFieldId).toBe('new-id-1');
    expect(cloned.eCertificateCategory?.fieldId).toBe('new-id-2');

    // Mutating cloned nested arrays/objects does not mutate sourceForm
    cloned.fields[1].options?.push('VIP');
    if (cloned.redirectButtons?.[0]) {
      cloned.redirectButtons[0].text = 'Changed';
    }
    expect(sourceForm.fields[1].options).toEqual(['Participant', 'Speaker']);
    expect(sourceForm.redirectButtons?.[0].text).toBe('Visit Site');
  });

  it('defaults googleSheetUrl to empty string when no new sheet URL is provided', () => {
    const cloned = cloneFormForDuplication(sourceForm, {
      newId: 'form-copy-3',
      generateId: () => 'id-x',
    });
    expect(cloned.googleSheetUrl).toBe('');
  });
});
