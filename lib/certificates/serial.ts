/**
 * Deterministic certificate serial code.
 *
 * Derived from the form id + the respondent's identifier (IC/email) using an
 * FNV-1a 32-bit hash → 8 uppercase hex chars. Because it's pure & deterministic:
 *   - same form + same person  → always the SAME code (consistent re-downloads)
 *   - different form OR person  → different code (unique per certificate)
 *
 * Not a running sequence (certs are generated on-the-fly, not stored), but a
 * stable, verifiable authenticity code.
 */
export function generateCertSerial(formId: string, identifier: string): string {
  const id = (identifier ?? '').trim().toLowerCase();
  // Without an identifier we can't make a per-person code — return empty so the
  // placeholder falls back to its label instead of a code shared by everyone.
  if (!id) return '';

  const input = `${formId ?? ''}|${id}`;
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `SIJIL-${hex}`;
}
