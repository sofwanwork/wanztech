import { describe, it, expect } from 'vitest';
import {
  splitIntoPages,
  isMultiPage,
  findAdjacentNonEmptyPage,
  lastNonEmptyPageIndex,
} from '@/lib/forms/pagination';
import type { FormField } from '@/lib/types';

function f(id: string, type: FormField['type'] = 'text'): FormField {
  return { id, type, label: id, required: false };
}

describe('splitIntoPages', () => {
  it('returns a single page when there are no pagebreaks', () => {
    const pages = splitIntoPages([f('a'), f('b'), f('c')]);
    expect(pages).toHaveLength(1);
    expect(pages[0].map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('splits at each pagebreak and drops the markers', () => {
    const pages = splitIntoPages([
      f('a'),
      f('pb1', 'pagebreak'),
      f('b'),
      f('c'),
      f('pb2', 'pagebreak'),
      f('d'),
    ]);
    expect(pages).toHaveLength(3);
    expect(pages[0].map((x) => x.id)).toEqual(['a']);
    expect(pages[1].map((x) => x.id)).toEqual(['b', 'c']);
    expect(pages[2].map((x) => x.id)).toEqual(['d']);
    // markers removed
    expect(pages.flat().some((x) => x.type === 'pagebreak')).toBe(false);
  });

  it('handles a leading/trailing pagebreak (empty pages)', () => {
    const pages = splitIntoPages([f('pb', 'pagebreak'), f('a'), f('pb2', 'pagebreak')]);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toEqual([]);
    expect(pages[1].map((x) => x.id)).toEqual(['a']);
    expect(pages[2]).toEqual([]);
  });

  it('always returns at least one page for an empty form', () => {
    expect(splitIntoPages([])).toEqual([[]]);
  });
});

describe('isMultiPage', () => {
  it('detects the presence of a pagebreak', () => {
    expect(isMultiPage([f('a'), f('b')])).toBe(false);
    expect(isMultiPage([f('a'), f('pb', 'pagebreak'), f('b')])).toBe(true);
  });
});

describe('findAdjacentNonEmptyPage', () => {
  const pages = [[f('a')], [], [f('b')], []];

  it('skips empty pages going forward', () => {
    expect(findAdjacentNonEmptyPage(pages, 0, 1)).toBe(2);
  });

  it('skips empty pages going backward', () => {
    expect(findAdjacentNonEmptyPage(pages, 2, -1)).toBe(0);
  });

  it('returns null when no further non-empty page exists', () => {
    expect(findAdjacentNonEmptyPage(pages, 2, 1)).toBeNull();
    expect(findAdjacentNonEmptyPage(pages, 0, -1)).toBeNull();
  });
});

describe('lastNonEmptyPageIndex', () => {
  it('returns the index of the last page with visible fields', () => {
    expect(lastNonEmptyPageIndex([[f('a')], [f('b')], []])).toBe(1);
  });

  it('defaults to 0 when every page is empty', () => {
    expect(lastNonEmptyPageIndex([[], []])).toBe(0);
  });
});

describe('pagebreak insertion between questions', () => {
  it('inserts page break immediately after targeted question', () => {
    const fields = [f('q1'), f('q2'), f('q3')];
    const afterIndex = 1; // user clicks on q2
    const updated = [...fields];
    updated.splice(afterIndex + 1, 0, f('pb', 'pagebreak'));

    expect(updated.map((x) => x.id)).toEqual(['q1', 'q2', 'pb', 'q3']);
    const pages = splitIntoPages(updated);
    expect(pages).toHaveLength(2);
    expect(pages[0].map((x) => x.id)).toEqual(['q1', 'q2']);
    expect(pages[1].map((x) => x.id)).toEqual(['q3']);
  });

  it('detects when the immediate next field is already a pagebreak', () => {
    const fields = [f('q1'), f('pb', 'pagebreak'), f('q2')];
    const hasNextPageBreak = (idx: number) => fields[idx + 1]?.type === 'pagebreak';

    expect(hasNextPageBreak(0)).toBe(true);  // q1 has pagebreak below it
    expect(hasNextPageBreak(1)).toBe(false); // pb has q2 below it
    expect(hasNextPageBreak(2)).toBe(false); // q2 is at end
  });
});

