/**
 * Pure anti-bot signup validation and email normalization helpers.
 * Zero server-only imports so it can be unit tested directly and reused cleanly.
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'dispostable.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.org',
  'maildrop.cc',
  'mailinator.com',
  'mohmal.com',
  'sharklasers.com',
  'temp-mail.org',
  'tempail.com',
  'tempmail.com',
  'tempmailo.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
]);

const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._ -]+$/;

export interface SignupValidationInput {
  username: string;
  email: string;
  password: string;
  honeypot?: string;
}

export interface SignupValidationResult {
  valid: boolean;
  error?: string;
  normalizedUsername?: string;
  normalizedEmail?: string;
}

/**
 * Normalize an email for canonical duplicate/pattern inspection.
 * Strips dots and +aliases for Gmail/Googlemail addresses.
 */
export function normalizeEmailForComparison(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex <= 0) return trimmed;

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (!GMAIL_DOMAINS.has(domain)) {
    return trimmed;
  }

  const withoutPlus = localPart.split('+')[0];
  const withoutDots = withoutPlus.replace(/\./g, '');
  return `${withoutDots}@gmail.com`;
}

/**
 * Detect automated Gmail dot-trick spam addresses (e.g. `n.o.ro.l.u.t.i.s.u.852@gmail.com`).
 */
export function isSuspiciousGmailDotTrick(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex <= 0) return false;

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!GMAIL_DOMAINS.has(domain)) return false;

  const dotMatches = localPart.match(/\./g);
  const dotCount = dotMatches ? dotMatches.length : 0;

  // Legitimate users rarely exceed 3 dots in a Gmail address
  if (dotCount >= 4) return true;

  // Catch short dot-split obfuscation like `a.b.c.xyz` (3+ single-char segments)
  const segments = localPart.split('.');
  const singleCharSegments = segments.filter((seg) => seg.length === 1).length;
  if (segments.length >= 4 && singleCharSegments >= 3) return true;

  return false;
}

/**
 * Detect high-entropy random mixed-case single-token bot usernames
 * (e.g. `ycOzLIsSbljRGtmsuabUn`, `yeYzuerhImrxFLnUx`, `ODYnMJtcKYQrQuCbvi`).
 */
export function isSuspiciousBotUsername(username: string): boolean {
  const trimmed = username.trim();
  // Legitimate multi-word names or separator usernames (spaces, _, ., -) pass
  if (/[\s._-]/.test(trimmed)) return false;
  if (trimmed.length < 12) return false;

  let uppercaseCount = 0;
  let lowercaseCount = 0;
  let lowerToUpperTransitions = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isLower = ch >= 'a' && ch <= 'z';

    if (isUpper) {
      uppercaseCount++;
      if (i > 0) {
        const prev = trimmed[i - 1];
        if (prev >= 'a' && prev <= 'z') {
          lowerToUpperTransitions++;
        }
      }
    } else if (isLower) {
      lowercaseCount++;
    }
  }

  return uppercaseCount >= 5 && lowercaseCount >= 5 && lowerToUpperTransitions >= 3;
}

/**
 * Validate user-supplied signup credentials before calling Supabase Auth.
 */
export function validateSignupInput(input: SignupValidationInput): SignupValidationResult {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { valid: false, error: 'Unable to complete registration. Please try again.' };
  }

  const normalizedUsername = input.username.trim().replace(/\s+/g, ' ');
  const normalizedEmail = input.email.trim().toLowerCase();

  if (normalizedUsername.length < 3 || normalizedUsername.length > 40) {
    return { valid: false, error: 'Username must be between 3 and 40 characters.' };
  }

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return {
      valid: false,
      error: 'Username may only contain letters, numbers, spaces, dots, hyphens, and underscores.',
    };
  }

  if (isSuspiciousBotUsername(normalizedUsername)) {
    return {
      valid: false,
      error: 'Please choose a standard readable username without random mixed capitalization.',
    };
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  const domain = normalizedEmail.slice(normalizedEmail.lastIndexOf('@') + 1);
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, error: 'Disposable or temporary email addresses are not allowed.' };
  }

  if (isSuspiciousGmailDotTrick(normalizedEmail)) {
    return {
      valid: false,
      error: 'Please use a standard email address without excessive dots.',
    };
  }

  if (!input.password || input.password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters.' };
  }

  return {
    valid: true,
    normalizedUsername,
    normalizedEmail,
  };
}
