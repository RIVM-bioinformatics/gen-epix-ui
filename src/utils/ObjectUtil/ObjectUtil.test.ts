import {
  describe,
  it,
  expect,
} from 'vitest';

import { ObjectUtil } from './ObjectUtil';

describe('ObjectUtil', () => {
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
  });
});
