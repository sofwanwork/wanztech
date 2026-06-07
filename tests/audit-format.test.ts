import { describe, it, expect } from 'vitest';
import {
  describeAuditAction,
  describeAuditLog,
  auditActionKind,
} from '@/lib/audit/format';

describe('describeAuditAction', () => {
  it('maps known actions to English labels', () => {
    expect(describeAuditAction('form.create')).toBe('Form created');
    expect(describeAuditAction('form.delete')).toBe('Form deleted');
    expect(describeAuditAction('settings.update')).toBe('Settings updated');
  });

  it('falls back to the raw code for unknown actions', () => {
    expect(describeAuditAction('something.weird')).toBe('something.weird');
  });
});

describe('describeAuditLog', () => {
  it('appends the entity title when present', () => {
    expect(
      describeAuditLog({ action: 'form.create', metadata: { title: 'Signup Form' } })
    ).toBe('Form created: Signup Form');
  });

  it('uses name metadata when title is absent', () => {
    expect(
      describeAuditLog({ action: 'webhook.create', metadata: { name: 'Slack' } })
    ).toBe('Webhook created: Slack');
  });

  it('returns just the label when no name/title metadata', () => {
    expect(describeAuditLog({ action: 'form.delete', metadata: {} })).toBe(
      'Form deleted'
    );
  });

  it('ignores non-string title metadata', () => {
    expect(
      describeAuditLog({ action: 'form.create', metadata: { title: 123 } })
    ).toBe('Form created');
  });
});

describe('auditActionKind', () => {
  it('classifies by suffix', () => {
    expect(auditActionKind('form.create')).toBe('create');
    expect(auditActionKind('form.delete')).toBe('delete');
    expect(auditActionKind('form.update')).toBe('update');
    expect(auditActionKind('mystery')).toBe('other');
  });
});
