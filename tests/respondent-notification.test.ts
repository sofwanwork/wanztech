import { describe, it, expect } from 'vitest';
import {
  getRespondentConfirmationEmail,
  getNewSubmissionEmail,
} from '@/lib/email';

describe('getRespondentConfirmationEmail', () => {
  it('returns a subject containing the form title', () => {
    const { subject } = getRespondentConfirmationEmail('Pendaftaran Bengkel');
    expect(subject).toContain('Pendaftaran Bengkel');
    expect(subject).toMatch(/^✅/);
  });

  it('uses the default acknowledgement message when none provided', () => {
    const { html } = getRespondentConfirmationEmail('Borang A');
    expect(html).toContain('telah kami terima');
    expect(html).toContain('Borang A');
  });

  it('uses the custom message when provided', () => {
    const { html } = getRespondentConfirmationEmail(
      'Borang A',
      'Jumpa anda di majlis nanti!'
    );
    expect(html).toContain('Jumpa anda di majlis nanti!');
    // default message should be replaced, not appended
    expect(html).not.toContain('telah kami terima');
  });

  it('omits the summary table when no summary is given', () => {
    const { html } = getRespondentConfirmationEmail('Borang A', 'Hi');
    expect(html).not.toContain('Ringkasan jawapan anda');
  });

  it('renders a summary table when a summary is provided', () => {
    const { html } = getRespondentConfirmationEmail('Borang A', undefined, {
      Nama: 'Ali',
      Emel: 'ali@example.com',
    });
    expect(html).toContain('Ringkasan jawapan anda');
    expect(html).toContain('Nama');
    expect(html).toContain('Ali');
    expect(html).toContain('ali@example.com');
  });

  it('escapes HTML in respondent-controlled values to prevent injection', () => {
    const { html } = getRespondentConfirmationEmail(
      'Borang <script>',
      '<img src=x onerror=alert(1)>',
      { 'Komen </td>': '<b>bold</b>' }
    );
    // Raw markup from untrusted input must be escaped.
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<b>bold</b>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(html).toContain('&lt;script&gt;');
  });

  it('caps the summary table at 12 rows to keep the email tidy', () => {
    const big: Record<string, string> = {};
    for (let i = 0; i < 30; i++) big[`Field ${i}`] = `Value ${i}`;
    const { html } = getRespondentConfirmationEmail('Borang A', undefined, big);
    expect(html).toContain('Field 0');
    expect(html).toContain('Field 11');
    expect(html).not.toContain('Field 12');
  });
});

describe('getNewSubmissionEmail (owner notification) HTML escaping', () => {
  it('escapes respondent-controlled submission data', () => {
    const { html } = getNewSubmissionEmail('Owner', 'My Form', {
      '<b>Field</b>': '<img src=x onerror=alert(1)>',
    });
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<b>Field</b>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;Field&lt;/b&gt;');
  });

  it('escapes the owner name and form title', () => {
    const { html } = getNewSubmissionEmail(
      '<script>x</script>',
      '<i>Title</i>',
      {}
    );
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('<i>Title</i>');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('&lt;i&gt;Title&lt;/i&gt;');
  });
});
