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


  describe('parse', () => {
    it('should parse decimal formats with dots', () => {
      expect(NumberUtil.parse('1.0')).toBe(1.0);
      expect(NumberUtil.parse('1.5')).toBe(1.5);
      expect(NumberUtil.parse('0.001')).toBe(0.001);
    });

    it('should parse decimal formats with commas', () => {
      expect(NumberUtil.parse('1,0')).toBe(1.0);
      expect(NumberUtil.parse('1,5')).toBe(1.5);
      expect(NumberUtil.parse('123,456')).toBe(123.456);
      expect(NumberUtil.parse('0,001')).toBe(0.001);
    });

    it('should parse thousands separators correctly', () => {
      expect(NumberUtil.parse('1.000')).toBe(1);
      expect(NumberUtil.parse('1,000')).toBe(1);
      expect(NumberUtil.parse('123,456')).toBe(123.456);
      expect(NumberUtil.parse('1.234.567')).toBe(1234567);
      expect(NumberUtil.parse('1,234,567')).toBe(1234567);
      expect(NumberUtil.parse('1,234,567.5')).toBe(1234567.5);
      expect(NumberUtil.parse('1 234.567')).toBe(1234.567);
      expect(NumberUtil.parse('1 234 567')).toBe(1234567);
      expect(NumberUtil.parse('1 234 567.5')).toBe(1234567.5);
    });

    it('should parse mixed formats with thousands and decimals', () => {
      expect(NumberUtil.parse('1,234.56')).toBe(1234.56);
      expect(NumberUtil.parse('1.234,56')).toBe(1234.56);
      expect(NumberUtil.parse('123,456.789')).toBe(123456.789);
      expect(NumberUtil.parse('123.456,789')).toBe(123456.789);
      expect(NumberUtil.parse('123 456.789')).toBe(123456.789);
      expect(NumberUtil.parse('123 456,789')).toBe(123456.789);
    });

    it('should parse negative numbers', () => {
      expect(NumberUtil.parse('-1.0')).toBe(-1.0);
      expect(NumberUtil.parse('-1,0')).toBe(-1.0);
      expect(NumberUtil.parse('-123.456')).toBe(-123.456);
      expect(NumberUtil.parse('-1,234.56')).toBe(-1234.56);
      expect(NumberUtil.parse('-1,000')).toBe(-1);
    });

    it('should parse whole numbers without separators', () => {
      expect(NumberUtil.parse('123')).toBe(123);
      expect(NumberUtil.parse('0')).toBe(0);
      expect(NumberUtil.parse('999')).toBe(999);
      expect(NumberUtil.parse('-456')).toBe(-456);
    });

    it('should handle whitespace', () => {
      expect(NumberUtil.parse(' 123.45 ')).toBe(123.45);
      expect(NumberUtil.parse('  1,234.56  ')).toBe(1234.56);
      expect(NumberUtil.parse('\t123\t')).toBe(123);
    });

    it('should handle edge cases and invalid inputs', () => {
      expect(NumberUtil.parse('')).toBeNaN();
      expect(NumberUtil.parse('   ')).toBeNaN();
      expect(NumberUtil.parse('abc')).toBeNaN();
      expect(NumberUtil.parse('12.34.56.78')).toBe(12345678);
      expect(NumberUtil.parse('1,2,3,4')).toBe(1234);
    });

    it('should handle type safety', () => {
      expect(NumberUtil.parse(null)).toBeNaN();
      expect(NumberUtil.parse(undefined)).toBeNaN();
      expect(NumberUtil.parse(123 as unknown as string)).toBeNaN();
    });

    it('should handle precision edge cases', () => {
      expect(NumberUtil.parse('1.1234')).toBe(1.1234);
      expect(NumberUtil.parse('1,1234')).toBe(1.1234);
      expect(NumberUtil.parse('123.45,67')).toBe(12345.67);
      expect(NumberUtil.parse('0.0')).toBe(0.0);
      expect(NumberUtil.parse('0,0')).toBe(0.0);
      expect(NumberUtil.parse(' ')).toBe(NaN);
      expect(NumberUtil.parse('')).toBe(NaN);

    });
  });
});
