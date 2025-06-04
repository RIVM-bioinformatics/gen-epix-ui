import {
  describe,
  it,
  expect,
} from 'vitest';

import { NumberUtil } from './NumberUtil';

describe('NumberUtil', () => {
  describe('toStringWithPrecision', () => {
    it('should return a string with the correct precision', () => {
      expect(NumberUtil.toStringWithPrecision(123.456, 0.01)).toBe('123.45');
      expect(NumberUtil.toStringWithPrecision(123.4, 0.01)).toBe('123.40');
      expect(NumberUtil.toStringWithPrecision(123, 0.01)).toBe('123.00');
      expect(NumberUtil.toStringWithPrecision(123.456, 0.1)).toBe('123.4');
      expect(NumberUtil.toStringWithPrecision(123.456, 1)).toBe('123');
    });

    it('should return an empty string if the value is not a number', () => {
      expect(NumberUtil.toStringWithPrecision(NaN, 0.01)).toBe('');
      expect(NumberUtil.toStringWithPrecision(undefined as unknown as number, 0.01)).toBe('');
      expect(NumberUtil.toStringWithPrecision(null as unknown as number, 0.01)).toBe('');
    });

    it('should handle cases where the base has no decimal part', () => {
      expect(NumberUtil.toStringWithPrecision(123.456, 1)).toBe('123');
      expect(NumberUtil.toStringWithPrecision(123.456, 10)).toBe('123');
    });
  });
});
