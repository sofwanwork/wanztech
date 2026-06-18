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
