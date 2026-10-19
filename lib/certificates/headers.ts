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
