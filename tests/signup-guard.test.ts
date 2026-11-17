import { describe, it, expect } from 'vitest';
import {
  isSuspiciousBotUsername,
  isSuspiciousGmailDotTrick,
  normalizeEmailForComparison,
  validateSignupInput,
} from '@/lib/auth/signup-guard';

describe('Signup Anti-Bot Guard', () => {
  it('blocks all observed random mixed-case bot usernames', () => {
    const botUsernames = [
      'ycOzLIsSbljRGtmsuabUn',
      'yeYzuerhImrxFLnUx',
      'qlnsNEdMGJbpWgkDv',
      'DqyfUzcTAFWwXuqp',
      'ODYnMJtcKYQrQuCbvi',
    ];

    for (const username of botUsernames) {
      expect(isSuspiciousBotUsername(username)).toBe(true);
      const res = validateSignupInput({
        username,
        email: 'valid.user@gmail.com',
        password: 'password123',
      });
      expect(res.valid).toBe(false);
    }
  });

  it('allows legitimate human and organization usernames', () => {
    const validUsernames = [
      'PT TRANSNETLIWA',
      'SofwanJailani',
      'AhmadFirdausBinAli',
      'sofwan_99',
      'cikgu.aminah',
      'admin-klikform',
    ];

    for (const username of validUsernames) {
      expect(isSuspiciousBotUsername(username)).toBe(false);
      const res = validateSignupInput({
        username,
        email: 'pttransnetliwa@gmail.com',
        password: 'password123',
      });
      expect(res.valid).toBe(true);
    }
  });

  it('blocks Gmail dot-trick spam emails while allowing normal dotted Gmail addresses', () => {
    const botEmails = [
      'n.o.ro.l.u.t.i.s.u.852@gmail.com',
      'no.d.u.q.u.zo.t.u.j7.4.5@gmail.com',
      'a.l.as.te.i.rs2.07@gmail.com',
      'oj.uhom.iz.e.fi.17@gmail.com',
      'w.i.l.e.pa.w.o.t.eca21@gmail.com',
    ];

    for (const email of botEmails) {
      expect(isSuspiciousGmailDotTrick(email)).toBe(true);
      const res = validateSignupInput({
        username: 'validuser',
        email,
        password: 'password123',
      });
      expect(res.valid).toBe(false);
    }

    expect(isSuspiciousGmailDotTrick('sofwan.jailani@gmail.com')).toBe(false);
    expect(isSuspiciousGmailDotTrick('ahmad.ali.99@gmail.com')).toBe(false);
    expect(isSuspiciousGmailDotTrick('pttransnetliwa@gmail.com')).toBe(false);
  });

  it('blocks disposable email domains and honeypot submissions', () => {
    const disposable = validateSignupInput({
      username: 'ahmad_test',
      email: 'testuser@mailinator.com',
      password: 'password123',
    });
    expect(disposable.valid).toBe(false);

    const honeypot = validateSignupInput({
      username: 'ahmad_test',
      email: 'ahmad@gmail.com',
      password: 'password123',
      honeypot: 'https://spam-site.example',
    });
    expect(honeypot.valid).toBe(false);
  });

  it('normalizes Gmail addresses for canonical comparison', () => {
    expect(normalizeEmailForComparison('N.O.Ro.l.u.t.i.s.u.852+spam@gmail.com')).toBe(
      'norolutisu852@gmail.com'
    );
    expect(normalizeEmailForComparison('Sofwan.Jailani@googlemail.com')).toBe(
      'sofwanjailani@gmail.com'
    );
    expect(normalizeEmailForComparison('user.name@company.com.my')).toBe('user.name@company.com.my');
  });
});
