import {
  describe,
  expect,
  it,
} from 'vitest';

import { DataUtil } from './DataUtil';

type MixedItem = {
  rank?: number;
  value: number | string;
};

type RankedItem = {
  label?: null | string;
  rank?: number;
  score?: null | number;
};

describe('DataUtil', () => {
  describe('rankSortComperatorFactory', () => {
    it('sorts by rank with missing ranks treated as zero', () => {
      const compare = DataUtil.rankSortComperatorFactory<keyof RankedItem, RankedItem>();

      expect(compare({ rank: -1 }, { rank: 1 })).toBeLessThan(0);
      expect(compare({}, { rank: 1 })).toBeLessThan(0);
      expect(compare({ rank: 2 }, {})).toBeGreaterThan(0);
      expect(compare({}, {})).toBe(0);
    });

    it('uses a property as a secondary string or number sort key', () => {
      const compareByLabel = DataUtil.rankSortComperatorFactory<'label', RankedItem>('label');
      const compareByScore = DataUtil.rankSortComperatorFactory<'score', RankedItem>('score');

      expect(compareByLabel({ label: 'alpha', rank: 1 }, { label: 'beta', rank: 1 })).toBeLessThan(0);
      expect(compareByScore({ rank: 1, score: 2 }, { rank: 1, score: 10 })).toBeLessThan(0);
      expect(compareByLabel({ label: 'same', rank: 1 }, { label: 'same', rank: 1 })).toBe(0);
      expect(compareByLabel({ label: 'z', rank: 0 }, { label: 'a', rank: 1 })).toBeLessThan(0);
    });

    it('sorts nullish secondary values before defined values', () => {
      const compare = DataUtil.rankSortComperatorFactory<'label', RankedItem>('label');

      expect(compare({ label: null }, { label: 'alpha' })).toBeLessThan(0);
      expect(compare({ label: 'alpha' }, { label: null })).toBeGreaterThan(0);
      expect(compare({ label: undefined }, { label: 'alpha' })).toBeLessThan(0);
      expect(compare({ label: 'alpha' }, { label: undefined })).toBeGreaterThan(0);
      expect(compare({ label: null }, { label: undefined })).toBeLessThan(0);
    });

    it('uses a selector function for secondary string ordering', () => {
      const compare = DataUtil.rankSortComperatorFactory<keyof RankedItem, RankedItem>((item) => item.label ?? '');

      expect(compare({ label: 'alpha' }, { label: 'beta' })).toBeLessThan(0);
      expect(compare({ label: 'same' }, { label: 'same' })).toBe(0);
    });

    it('returns zero for unsupported mixed secondary value types', () => {
      const compare = DataUtil.rankSortComperatorFactory<'value', MixedItem>('value');

      expect(compare({ value: 'alpha' }, { value: 1 })).toBe(0);
    });
  });
});
