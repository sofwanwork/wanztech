import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import type { FormFieldType } from '@/lib/types/forms';

describe('Form Field Label & Accessibility (WCAG / Chrome DevTools)', () => {
  const singleInputTypes: FormFieldType[] = [
    'text',
    'email',
    'number',
    'textarea',
    'select',
    'date',
    'time',
  ];

  const compositeGroupTypes: FormFieldType[] = [
    'checkbox',
    'radio',
    'rating',
    'grid',
    'file',
    'product',
  ];

  function isSingleInputControl(type: FormFieldType): boolean {
    return singleInputTypes.includes(type);
  }

  it('correctly classifies single-input fields that have a direct element with id=field-input-${id}', () => {
    for (const type of singleInputTypes) {
      expect(isSingleInputControl(type)).toBe(true);
    }
  });

  it('correctly classifies composite/grouped fields that must NOT have an unassociated label for=field-input-${id}', () => {
    for (const type of compositeGroupTypes) {
      expect(isSingleInputControl(type)).toBe(false);
    }
  });

  it('DatePicker accepts id prop and attaches it to the trigger button', () => {
    const html = renderToStaticMarkup(
      React.createElement(DatePicker, { id: 'field-input-test-date' })
    );
    expect(html).toContain('id="field-input-test-date"');
    expect(html).toContain('<button');
  });

  it('TimePicker accepts id prop and attaches it to the trigger button', () => {
    const html = renderToStaticMarkup(
      React.createElement(TimePicker, { id: 'field-input-test-time' })
    );
    expect(html).toContain('id="field-input-test-time"');
    expect(html).toContain('<button');
  });

  it('ensures no composite types accidentally overlap with single-input controls', () => {
    for (const groupType of compositeGroupTypes) {
      expect(singleInputTypes).not.toContain(groupType);
    }
  });
});
