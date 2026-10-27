import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isSuperAdmin, getAdminEmails, PRIMARY_ADMIN_EMAIL } from '@/lib/auth/admin';

describe('Admin Authentication & Authorization Guards', () => {
  const originalEnv = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    delete process.env.ADMIN_EMAILS;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_EMAILS = originalEnv;
    } else {
      delete process.env.ADMIN_EMAILS;
    }
  });

  it('verifies that PRIMARY_ADMIN_EMAIL is sofwanjailani.work@gmail.com', () => {
    expect(PRIMARY_ADMIN_EMAIL).toBe('sofwanjailani.work@gmail.com');
  });

  it('allows access strictly for sofwanjailani.work@gmail.com', () => {
    expect(isSuperAdmin('sofwanjailani.work@gmail.com')).toBe(true);
  });

  it('handles case-insensitivity correctly', () => {
    expect(isSuperAdmin('SOFWANJAILANI.WORK@GMAIL.COM')).toBe(true);
    expect(isSuperAdmin('SofwanJailani.Work@Gmail.Com')).toBe(true);
  });

  it('handles leading and trailing whitespace safely', () => {
    expect(isSuperAdmin('  sofwanjailani.work@gmail.com  ')).toBe(true);
    expect(isSuperAdmin('\tsofwanjailani.work@gmail.com\n')).toBe(true);
  });

  it('strictly blocks unauthorized emails', () => {
    expect(isSuperAdmin('user@example.com')).toBe(false);
    expect(isSuperAdmin('admin@klikform.com')).toBe(false);
    expect(isSuperAdmin('sofwan@gmail.com')).toBe(false);
    expect(isSuperAdmin('sofwanjailani@gmail.com')).toBe(false);
    expect(isSuperAdmin('fake.sofwanjailani.work@gmail.com')).toBe(false);
  });

  it('safely handles empty, null, and undefined inputs', () => {
    expect(isSuperAdmin('')).toBe(false);
    expect(isSuperAdmin('   ')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });

  it('supports additional emails via ADMIN_EMAILS environment variable while keeping primary intact', () => {
    process.env.ADMIN_EMAILS = 'secondadmin@example.com, third@klikform.com';
    const list = getAdminEmails();

    expect(list).toContain('sofwanjailani.work@gmail.com');
    expect(list).toContain('secondadmin@example.com');
    expect(list).toContain('third@klikform.com');

    expect(isSuperAdmin('secondadmin@example.com')).toBe(true);
    expect(isSuperAdmin('sofwanjailani.work@gmail.com')).toBe(true);
    expect(isSuperAdmin('stranger@example.com')).toBe(false);
  });

  it('guarantees PRIMARY_ADMIN_EMAIL cannot be targeted for client deletion', () => {
    const isTargetSafe = (targetEmail: string) => {
      return targetEmail.toLowerCase().trim() !== PRIMARY_ADMIN_EMAIL.toLowerCase().trim();
    };

    expect(isTargetSafe('sofwanjailani.work@gmail.com')).toBe(false);
    expect(isTargetSafe('SOFWANJAILANI.WORK@GMAIL.COM')).toBe(false);
    expect(isTargetSafe('client@example.com')).toBe(true);
  });
});
