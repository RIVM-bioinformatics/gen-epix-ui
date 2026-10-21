import {
  describe,
  expect,
  it,
} from 'vitest';

import { ObjectUtil } from './ObjectUtil';

describe('ObjectUtil', () => {
  describe('deepNullifyEmptyStrings', () => {
    it('replaces empty strings in nested objects and arrays without mutating the input', () => {
      const input = {
        empty: '',
        nested: {
          empty: '',
          text: 'value',
        },
        values: ['', 0, false, null],
      };

      expect(ObjectUtil.deepNullifyEmptyStrings(input)).toEqual({
        empty: null,
        nested: {
          empty: null,
          text: 'value',
        },
        values: [null, 0, false, null],
      });
      expect(input.empty).toBe('');
      expect(input.nested.empty).toBe('');
      expect(input.values[0]).toBe('');
    });

    it.each([null, 0, false, 'text'])('preserves non-empty JSON primitives: %s', (value) => {
      expect(ObjectUtil.deepNullifyEmptyStrings(value)).toBe(value);
    });

    it('returns a null value unchanged', () => {
      expect(ObjectUtil.deepNullifyEmptyStrings(null)).toBeNull();
    });
  });

  describe('getObjectDiff', () => {
    it('should return the keys that are different between two objects', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 4, d: 5 };

      const diff = ObjectUtil.getObjectDiff(obj1, obj2);
      expect(diff).toEqual(['b', 'c', 'd']);
    });

    it('should return an empty array if the objects are equal', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };

      const diff = ObjectUtil.getObjectDiff(obj1, obj2);
      expect(diff).toEqual([]);
    });

    it('should return all keys if one object is empty', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = {};

      const diff = ObjectUtil.getObjectDiff(obj1, obj2);
      expect(diff).toEqual(['a', 'b', 'c']);
    });

    it('should return all keys if the other object is empty', () => {
      const obj1 = {};
      const obj2 = { a: 1, b: 2, c: 3 };

      const diff = ObjectUtil.getObjectDiff(obj1, obj2);
      expect(diff).toEqual(['a', 'b', 'c']);
    });

    describe('mergeWithUndefined', () => {
      it('overwrites defined values and removes nullish overrides without mutating inputs', () => {
        const first: Record<string, unknown> = {
          keep: 1,
          removeNull: 2,
          removeUndefined: 3,
          replace: 4,
        };
        const second: Record<string, unknown> = {
          keep: 0,
          removeNull: null,
          removeUndefined: undefined,
          replace: '',
        };

        expect(ObjectUtil.mergeWithUndefined(first, second)).toEqual({
          keep: 0,
          replace: '',
        });
        expect(first).toEqual({
          keep: 1,
          removeNull: 2,
          removeUndefined: 3,
          replace: 4,
        });
        expect(second).toEqual({
          keep: 0,
          removeNull: null,
          removeUndefined: undefined,
          replace: '',
        });
      });

      it('returns an empty object when both inputs are empty', () => {
        expect(ObjectUtil.mergeWithUndefined({}, {})).toEqual({});
      });
    });
  });
});
