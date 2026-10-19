/** Matches common IC / NRIC / KP column headers (MY + EN variants). */
export function isIcHeader(h: string): boolean {
  const lower = h.toLowerCase().trim();
  return (
    lower === 'ic' ||
    lower === 'no ic' ||
    lower === 'no. ic' ||
    lower === 'no.ic' ||
    lower === 'ic number' ||
    lower === 'nric' ||
    lower === 'kp' ||
    lower === 'no kp' ||
    lower === 'no. kp' ||
    lower === 'no.kp' ||
    lower.includes('kad pengenalan') ||
    lower.includes('nric') ||
    lower.includes('mykad') ||
    lower.includes('nombor kp') ||
    lower.includes('no. kp') ||
    lower.includes('no kp') ||
    /\bic\b/.test(lower) ||
    /\bkp\b/.test(lower)
  );
}

/** Matches common Email column headers (MY + EN variants). */
export function isEmailHeader(h: string): boolean {
  const lower = h.toLowerCase().trim();
  return (
    lower === 'email' ||
    lower === 'e-mel' ||
    lower === 'e-mail' ||
    lower === 'emel' ||
    lower === 'mail' ||
    lower.includes('email') ||
    lower.includes('emel') ||
    lower.includes('e-mail') ||
    lower.includes('e-mel') ||
    /\b(email|emel|mail)\b/i.test(lower)
  );
}

export type CertificateVerificationMode = 'both' | 'ic_only' | 'email_only';

interface MinimalFormField {
  type?: string;
  label?: string;
  validation?: {
    pattern?: string;
  };
}

/**
 * Detects whether a form collects only IC, only Email, or both.
 * Used by the public certificate check portal to dynamically adapt labels,
 * helper texts, placeholders, and validation prompts.
 */
export function detectVerificationMode(fields?: MinimalFormField[] | null): CertificateVerificationMode {
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return 'both';
  }

  const hasEmail = fields.some(
    (f) => f && (f.type === 'email' || isEmailHeader(f.label || ''))
  );

  const hasIc = fields.some(
    (f) =>
      f &&
      (isIcHeader(f.label || '') ||
        (f.validation?.pattern &&
          (f.validation.pattern.includes('[0-9]{6}-[0-9]{2}-[0-9]{4}') ||
            f.validation.pattern.includes('[0-9]{12}'))))
  );

  if (hasEmail && hasIc) return 'both';
  if (hasEmail && !hasIc) return 'email_only';
  if (!hasEmail && hasIc) return 'ic_only';

  return 'both';
}

