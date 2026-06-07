import type { FormField } from '@/lib/types';

/**
 * Multi-page form support. A field of type `pagebreak` acts as a delimiter:
 * fields before it form page 0, fields after it (up to the next pagebreak)
 * form page 1, and so on. The pagebreak markers themselves are NOT rendered as
 * input fields — they only split the layout.
 *
 * All functions here are pure and deterministic so they can be unit-tested
 * without React.
 */

/**
 * Split a flat field list into pages, dropping the `pagebreak` markers.
 * A form with no pagebreaks yields a single page containing every field.
 * Always returns at least one page (possibly empty) so callers can index [0].
 */
export function splitIntoPages(fields: FormField[]): FormField[][] {
  const pages: FormField[][] = [[]];
  for (const field of fields) {
    if (field.type === 'pagebreak') {
      pages.push([]);
      continue;
    }
    pages[pages.length - 1].push(field);
  }
  return pages;
}

/** Whether the form is split across more than one page. */
export function isMultiPage(fields: FormField[]): boolean {
  return fields.some((f) => f.type === 'pagebreak');
}

/**
 * Given pages already filtered to *visible* fields, return the index of the
 * next page (after `current`) that has at least one field, or `null` if there
 * is none. Used to skip pages whose every field was hidden by conditional
 * logic. `direction` is +1 (Next) or -1 (Back).
 */
export function findAdjacentNonEmptyPage(
  visiblePages: FormField[][],
  current: number,
  direction: 1 | -1
): number | null {
  for (let i = current + direction; i >= 0 && i < visiblePages.length; i += direction) {
    if (visiblePages[i].length > 0) return i;
  }
  return null;
}

/** Index of the last page that contains at least one visible field. */
export function lastNonEmptyPageIndex(visiblePages: FormField[][]): number {
  for (let i = visiblePages.length - 1; i >= 0; i--) {
    if (visiblePages[i].length > 0) return i;
  }
  return 0;
}
