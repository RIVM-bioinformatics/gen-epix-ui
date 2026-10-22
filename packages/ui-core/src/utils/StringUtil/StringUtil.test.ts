import { StringUtil } from './StringUtil';

describe('StringUtil', () => {
  describe('clean', () => {
    it('does not fail', () => {
      expect(StringUtil.clean(null)).toBeNull();
      expect(StringUtil.clean('')).toBe('');
      expect(StringUtil.clean(undefined)).toBe(undefined);
    });
    it('returns a cleaned value', () => {
      expect(StringUtil.clean('A A')).toBe('AA');
      expect(StringUtil.clean('A💊A')).toBe('AA');
      expect(StringUtil.clean('!@#$%&*()AA)(*&%$#@!')).toBe('AA');
      expect(StringUtil.clean('^AA^')).toBe('^AA^');
      expect(StringUtil.clean('_AA_')).toBe('_AA_');
    });
  });

  describe('createUuid', () => {
    it('returns a unique uuid', () => {
      const testSize = 100000;
      const ids: string[] = [];
      for (let i = 0; i < testSize; i++) {
        ids.push(StringUtil.createUuid());
      }
      expect([...new Set(ids)].length).toBe(testSize);
    });
  });

  describe('createHash', () => {
    it('returns a unique hash', () => {
      const testSize = 100000;
      const hashes: string[] = [];
      for (let i = 0; i < testSize; i++) {
        hashes.push(StringUtil.createHash(StringUtil.createUuid()));
      }
      expect([...new Set(hashes)].length).toBe(testSize);
      expect(StringUtil.createHash('foo')).toEqual(StringUtil.createHash('foo'));
      expect(StringUtil.createHash('foo')).not.toEqual(StringUtil.createHash('bar'));
    });

    it('handles empty strings and seeds deterministically', () => {
      expect(StringUtil.createHash('')).toBe(StringUtil.createHash(''));
      expect(StringUtil.createHash('foo', 1)).toBe(StringUtil.createHash('foo', 1));
      expect(StringUtil.createHash('foo', 1)).not.toBe(StringUtil.createHash('foo', 2));
    });
  });

  describe('createSlug', () => {
    it.each([
      ['  Crème brûlée / épidémie!  ', 'creme-brulee-epidemie'],
      ['already--slug', 'already-slug'],
      ['one\t two\nthree', 'one-two-three'],
      ['', ''],
    ])('normalizes %j to %j', (input, expected) => {
      expect(StringUtil.createSlug(input)).toBe(expected);
    });
  });

  describe('toString', () => {
    it('converts to string', () => {
      expect(StringUtil.toString(undefined)).toEqual('');
      expect(StringUtil.toString(null)).toEqual('');
      expect(StringUtil.toString('')).toEqual('');
      expect(StringUtil.toString('foo')).toEqual('foo');
      expect(StringUtil.toString(1)).toEqual('1');
    });
  });

  describe('advancedSortComperator', () => {
    it('sorts correctly', () => {
      expect(['Lab2', 'Lab11', 'Lab1'].sort(StringUtil.advancedSortComperator)).toEqual(['Lab1', 'Lab2', 'Lab11']);
      expect(['A1', 'Lab11', 'Lab1'].sort(StringUtil.advancedSortComperator)).toEqual(['A1', 'Lab1', 'Lab11']);
      expect(() => [null, undefined, 'Lab11', 'Lab1'].sort(StringUtil.advancedSortComperator)).not.toThrow();
      expect([null, undefined, 'Lab11', 'Lab1'].sort(StringUtil.advancedSortComperator)).toEqual(['Lab1', 'Lab11', null, undefined]);
    });

    it('orders empty strings, numeric chunks, text chunks, and differing segment counts', () => {
      expect(StringUtil.advancedSortComperator('', 'a')).toBe(1);
      expect(StringUtil.advancedSortComperator('a', '')).toBe(-1);
      expect(StringUtil.advancedSortComperator('2a', 'aa')).toBeLessThan(0);
      expect(StringUtil.advancedSortComperator('aa', '2a')).toBeGreaterThan(0);
      expect(StringUtil.advancedSortComperator('A1', 'A1B')).toBeLessThan(0);
      expect(StringUtil.advancedSortComperator('A1B', 'A1')).toBeGreaterThan(0);
      expect(StringUtil.advancedSortComperator('Lab1', 'Lab1')).toBe(0);
    });

    it('treats numerically equivalent chunks as equal', () => {
      expect(StringUtil.advancedSortComperator('A1', 'A01')).toBe(0);
      expect(StringUtil.advancedSortComperator('A01', 'A1')).toBe(0);
    });
  });

  describe('sortComperator', () => {
    it('delegates to locale string ordering', () => {
      expect(StringUtil.sortComperator('alpha', 'beta')).toBeLessThan(0);
      expect(StringUtil.sortComperator('same', 'same')).toBe(0);
    });
  });
});
