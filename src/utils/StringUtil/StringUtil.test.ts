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
    });
  });
});
