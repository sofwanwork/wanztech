import { describe, it, expect } from 'vitest';
import { parseCSV, pickField } from '@/lib/csv/parse';

describe('parseCSV — basic cases', () => {
  it('returns empty result for empty input', () => {
    expect(parseCSV('')).toEqual({ headers: [], rows: [] });
    expect(parseCSV('   ')).toEqual({ headers: [], rows: [] });
  });

  it('parses a simple comma-delimited file', () => {
    const out = parseCSV('name,email\nAli,ali@example.com\nAbu,abu@example.com');
    expect(out.headers).toEqual(['name', 'email']);
    expect(out.rows).toEqual([
      { name: 'Ali', email: 'ali@example.com' },
      { name: 'Abu', email: 'abu@example.com' },
    ]);
  });

  it('handles CRLF line endings', () => {
    const out = parseCSV('a,b\r\n1,2\r\n3,4');
    expect(out.rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('strips a UTF-8 BOM', () => {
    const out = parseCSV('\uFEFFname,age\nAli,30');
    expect(out.headers).toEqual(['name', 'age']);
    expect(out.rows[0]).toEqual({ name: 'Ali', age: '30' });
  });

  it('skips fully blank lines', () => {
    const out = parseCSV('a,b\n\n1,2\n\n');
    expect(out.rows).toEqual([{ a: '1', b: '2' }]);
  });

  it('produces empty strings for trailing-empty cells', () => {
    const out = parseCSV('a,b,c\n1,,3');
    expect(out.rows[0]).toEqual({ a: '1', b: '', c: '3' });
  });
});

describe('parseCSV — quoted fields', () => {
  it('preserves commas inside quotes', () => {
    const out = parseCSV('name,city\n"Ali bin Abu","Kuala Lumpur, MY"');
    expect(out.rows[0]).toEqual({ name: 'Ali bin Abu', city: 'Kuala Lumpur, MY' });
  });

  it('decodes escaped quotes ("")', () => {
    const out = parseCSV('q\n"He said ""hi"""');
    expect(out.rows[0]).toEqual({ q: 'He said "hi"' });
  });

  it('preserves newlines inside quoted fields', () => {
    const out = parseCSV('note\n"line one\nline two"');
    expect(out.rows[0]).toEqual({ note: 'line one\nline two' });
  });
});

describe('pickField', () => {
  const row = { Name: 'Ali', 'No IC': '901234' };

  it('matches by exact header (case-insensitive)', () => {
    expect(pickField(row, ['name'])).toBe('Ali');
  });

  it('falls through candidates until a non-empty value is found', () => {
    expect(pickField(row, ['fullname', 'name'])).toBe('Ali');
  });

  it('returns undefined when nothing matches', () => {
    expect(pickField(row, ['email'])).toBeUndefined();
  });

  it('treats empty cell as no match', () => {
    expect(pickField({ Name: '', Backup: 'Abu' }, ['Name', 'Backup'])).toBe('Abu');
  });
});
