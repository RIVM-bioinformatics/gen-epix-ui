// @vitest-environment node

import { ValidationUtil } from './ValidationUtil';

describe('ValidationUtil', () => {
  describe('edge cases', () => {
    it('should return true for undefined, null and empty string when not required', () => {
      expect(ValidationUtil.validate('ALPHA', undefined as unknown as string)).toBe(true);
      expect(ValidationUtil.validate('ALPHA', null as unknown as string)).toBe(true);
      expect(ValidationUtil.validate('ALPHA', '')).toBe(true);
    });

    it('should return false for undefined, null and empty string when required', () => {
      expect(ValidationUtil.validate('ALPHA', undefined as unknown as string, true)).toBe(false);
      expect(ValidationUtil.validate('ALPHA', null as unknown as string, true)).toBe(false);
      expect(ValidationUtil.validate('ALPHA', '', true)).toBe(false);
    });

    it('should return false for whitespace-only strings regardless of isRequired', () => {
      expect(ValidationUtil.validate('ALPHA', '   ')).toBe(false);
      expect(ValidationUtil.validate('ALPHA', ' \n\t ')).toBe(false);
      expect(ValidationUtil.validate('ALPHA', '   ', true)).toBe(false);
      expect(ValidationUtil.validate('ALPHA', ' \n\t ', true)).toBe(false);
    });

    it('should convert numbers to strings before validating', () => {
      expect(ValidationUtil.validate('DECIMAL_0', 123)).toBe(true);
      expect(ValidationUtil.validate('DECIMAL_0', -5)).toBe(true);
      expect(ValidationUtil.validate('DECIMAL_0', 0)).toBe(true);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 42)).toBe(true);
    });
  });

  describe('validate general', () => {
    it('should return true on correct input', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA', 'abcxyz')).toBe(true);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'abcxyz123')).toBe(true);
      expect(ValidationUtil.validate('ALPHA', 'ábçxÿz')).toBe(true);
      expect(ValidationUtil.validate('ALPHA_NUMERIC', 'ábçxÿz890')).toBe(true);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', 'abc-xyz, ábç-xÿz.;:123')).toBe(true);
      expect(ValidationUtil.validate('FREE_FORM_TEXT', 'ábçxÿz890!@#$%^  \n \t')).toBe(true);
      expect(ValidationUtil.validate('URL', 'http://example.com')).toBe(true);
      expect(ValidationUtil.validate('REGEX', 'H\\d+')).toBe(true);
    });
    it('should return false on incorrect input', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA', 'ábçxÿz')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA', '123')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'ábçxÿz123')).toBe(false);
      expect(ValidationUtil.validate('ALPHA', '!@#$%^')).toBe(false);
      expect(ValidationUtil.validate('ALPHA', '!@#$%^ \n\t')).toBe(false);
      expect(ValidationUtil.validate('ALPHA_NUMERIC', '!@#$%^ \n\t')).toBe(false);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', '!@#$%^ 123 \n\t')).toBe(false);
      expect(ValidationUtil.validate('URL', 'xxxx')).toBe(false);
      expect(ValidationUtil.validate('REGEX', '[')).toBe(false);
    });
    it('should return false on empty strings', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA', '  ')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA', '  ')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', '  ')).toBe(false);
      expect(ValidationUtil.validate('ALPHA', '  ')).toBe(false);
      expect(ValidationUtil.validate('ALPHA', '  \n\t')).toBe(false);
      expect(ValidationUtil.validate('ALPHA_NUMERIC', '  \n\t')).toBe(false);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', '  \n\t')).toBe(false);
      expect(ValidationUtil.validate('URL', '  \n\t')).toBe(false);
      expect(ValidationUtil.validate('REGEX', '  \n\t')).toBe(false);
    });
  });

  describe('validate DECIMAL_0', () => {
    it('should return true for integers', () => {
      expect(ValidationUtil.validate('DECIMAL_0', '0')).toBe(true);
      expect(ValidationUtil.validate('DECIMAL_0', '123')).toBe(true);
      expect(ValidationUtil.validate('DECIMAL_0', '-42')).toBe(true);
      expect(ValidationUtil.validate('DECIMAL_0', '+7')).toBe(true);
    });

    it('should return false for non-integers', () => {
      expect(ValidationUtil.validate('DECIMAL_0', '1.5')).toBe(false);
      expect(ValidationUtil.validate('DECIMAL_0', '1,5')).toBe(false);
      expect(ValidationUtil.validate('DECIMAL_0', 'abc')).toBe(false);
      expect(ValidationUtil.validate('DECIMAL_0', '1e5')).toBe(false);
    });
  });

  describe('validate DECIMAL_1', () => {
    it('should return true for values with exactly one decimal place', () => {
      expect(ValidationUtil.validate('DECIMAL_1', '1.2')).toBe(true);
      expect(ValidationUtil.validate('DECIMAL_1', '123.4')).toBe(true);
      expect(ValidationUtil.validate('DECIMAL_1', '-1.5')).toBe(true);
      expect(ValidationUtil.validate('DECIMAL_1', '+0.9')).toBe(true);
    });

    it('should return false for values without a decimal place or with multiple decimal digits', () => {
      expect(ValidationUtil.validate('DECIMAL_1', '123')).toBe(false);
      expect(ValidationUtil.validate('DECIMAL_1', '1.23')).toBe(false);
      expect(ValidationUtil.validate('DECIMAL_1', '1.')).toBe(false);
    });
  });

  describe('validate STRICT_ALPHA', () => {
    it('should return true for ASCII letters only', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA', 'abc')).toBe(true);
      expect(ValidationUtil.validate('STRICT_ALPHA', 'ABC')).toBe(true);
      expect(ValidationUtil.validate('STRICT_ALPHA', 'AbCdEf')).toBe(true);
    });

    it('should return false for digits, spaces and accented characters', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA', 'abc1')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA', 'abc ')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA', 'àbc')).toBe(false);
    });
  });

  describe('validate STRICT_ALPHA_NUMERIC', () => {
    it('should return true for ASCII letters and digits', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'abc123')).toBe(true);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'ABC')).toBe(true);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', '007')).toBe(true);
    });

    it('should return false for spaces, accented characters and special characters', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'abc 123')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'àbc123')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'abc-123')).toBe(false);
    });
  });

  describe('validate ALPHA', () => {
    it('should return true for letters including accented/extended Latin characters and spaces', () => {
      expect(ValidationUtil.validate('ALPHA', 'hello world')).toBe(true);
      expect(ValidationUtil.validate('ALPHA', 'àáâãäåæçèéêëì')).toBe(true);
      expect(ValidationUtil.validate('ALPHA', 'ŠŒŽšœžŸ')).toBe(true);
    });

    it.each(['!', '"', '#', '$', '%', '&', '(', ')', '*', ',', '.', '/', ':', ';', '?', '@', '[', '\\', ']', '^', '_', '{', '}', '|', '+', '<', '=', '>', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9])(
      'should fail on special character: %s',
      (char) => {
        expect(ValidationUtil.validate('ALPHA', char)).toBe(false);
      },
    );
  });

  describe('validate ALPHA_NUMERIC', () => {
    it('should return true for letters, digits and spaces', () => {
      expect(ValidationUtil.validate('ALPHA_NUMERIC', 'hello world 123')).toBe(true);
      expect(ValidationUtil.validate('ALPHA_NUMERIC', 'àáâ 890')).toBe(true);
    });

    it('should return false for special characters', () => {
      expect(ValidationUtil.validate('ALPHA_NUMERIC', 'hello!')).toBe(false);
      expect(ValidationUtil.validate('ALPHA_NUMERIC', 'test@123')).toBe(false);
      expect(ValidationUtil.validate('ALPHA_NUMERIC', 'abc\n123')).toBe(false);
    });
  });

  describe('validate EXTENDED_ALPHA_NUMERIC', () => {
    it('should return true for letters, digits, spaces and common punctuation', () => {
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', 'hello world 123')).toBe(true);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', 'abc-xyz')).toBe(true);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', 'test: value; other.')).toBe(true);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', '(brackets) <angle>')).toBe(true);
    });

    it('should return false for characters outside the allowed set', () => {
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', 'test\n')).toBe(false);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', 'test\t')).toBe(false);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', 'test!')).toBe(false);
    });
  });

  describe('validate FREE_FORM_TEXT', () => {
    it('should return true for printable ASCII, Latin characters and whitespace', () => {
      expect(ValidationUtil.validate('FREE_FORM_TEXT', 'Hello World!')).toBe(true);
      expect(ValidationUtil.validate('FREE_FORM_TEXT', 'Test 123 @#$%')).toBe(true);
      expect(ValidationUtil.validate('FREE_FORM_TEXT', 'résumé naïve')).toBe(true);
      expect(ValidationUtil.validate('FREE_FORM_TEXT', 'line1\nline2\ttabbed')).toBe(true);
    });

    it('should return false for characters above U+00FF', () => {
      expect(ValidationUtil.validate('FREE_FORM_TEXT', '€100')).toBe(false);
      expect(ValidationUtil.validate('FREE_FORM_TEXT', '👍')).toBe(false);
    });
  });

  describe('validate EMAIL', () => {
    it('should return true for valid email addresses', () => {
      expect(ValidationUtil.validate('EMAIL', 'user@example.com')).toBe(true);
      expect(ValidationUtil.validate('EMAIL', 'firstname.lastname@company.co.uk')).toBe(true);
      expect(ValidationUtil.validate('EMAIL', 'user+tag@example.org')).toBe(true);
      expect(ValidationUtil.validate('EMAIL', 'user123@sub.domain.io')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(ValidationUtil.validate('EMAIL', 'notanemail')).toBe(false);
      expect(ValidationUtil.validate('EMAIL', '@example.com')).toBe(false);
      expect(ValidationUtil.validate('EMAIL', 'user@')).toBe(false);
      expect(ValidationUtil.validate('EMAIL', 'user@domain')).toBe(false);
      expect(ValidationUtil.validate('EMAIL', 'user @example.com')).toBe(false);
    });
  });

  describe('validate UUID4', () => {
    it('should return true for valid UUIDs', () => {
      expect(ValidationUtil.validate('UUID4', '123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(ValidationUtil.validate('UUID4', '550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(ValidationUtil.validate('UUID4', '550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(ValidationUtil.validate('UUID4', 'not-a-uuid')).toBe(false);
      expect(ValidationUtil.validate('UUID4', '123e4567-e89b-12d3-a456-42661417400')).toBe(false);
      expect(ValidationUtil.validate('UUID4', '123e4567e89b12d3a456426614174000')).toBe(false);
    });
  });

  describe('validate LAT_LONG', () => {
    it('should return true for valid coordinates', () => {
      expect(ValidationUtil.validate('LAT_LONG', '51.5074, -0.1278')).toBe(true);
      expect(ValidationUtil.validate('LAT_LONG', '0, 0')).toBe(true);
      expect(ValidationUtil.validate('LAT_LONG', '90, 180')).toBe(true);
      expect(ValidationUtil.validate('LAT_LONG', '-90, -180')).toBe(true);
      expect(ValidationUtil.validate('LAT_LONG', '45.123456, 90.654321')).toBe(true);
    });

    it('should return false for out-of-range or malformed coordinates', () => {
      expect(ValidationUtil.validate('LAT_LONG', '91, 0')).toBe(false);
      expect(ValidationUtil.validate('LAT_LONG', '0, 181')).toBe(false);
      expect(ValidationUtil.validate('LAT_LONG', 'abc, def')).toBe(false);
      expect(ValidationUtil.validate('LAT_LONG', '51.5074')).toBe(false);
    });
  });

  describe('validate TIME_WEEK', () => {
    it('should return true for valid ISO week values', () => {
      expect(ValidationUtil.validate('TIME_WEEK', '2026-W01')).toBe(true);
      expect(ValidationUtil.validate('TIME_WEEK', '2026-W52')).toBe(true);
      expect(ValidationUtil.validate('TIME_WEEK', '2026-W53')).toBe(true);
      expect(ValidationUtil.validate('TIME_WEEK', '2026-w10')).toBe(true);
    });

    it('should return false for invalid week values', () => {
      expect(ValidationUtil.validate('TIME_WEEK', '2026-W54')).toBe(false);
      expect(ValidationUtil.validate('TIME_WEEK', '2026-W60')).toBe(false);
      expect(ValidationUtil.validate('TIME_WEEK', '2026-1')).toBe(false);
      expect(ValidationUtil.validate('TIME_WEEK', '26-W01')).toBe(false);
    });
  });

  describe('validate TIME_MONTH', () => {
    it('should return true for valid year-month values', () => {
      expect(ValidationUtil.validate('TIME_MONTH', '2026-01')).toBe(true);
      expect(ValidationUtil.validate('TIME_MONTH', '2026-12')).toBe(true);
      expect(ValidationUtil.validate('TIME_MONTH', '1999-06')).toBe(true);
    });

    it('should return false for invalid month values', () => {
      expect(ValidationUtil.validate('TIME_MONTH', '2026-00')).toBe(false);
      expect(ValidationUtil.validate('TIME_MONTH', '2026-13')).toBe(false);
      expect(ValidationUtil.validate('TIME_MONTH', '2026-1')).toBe(false);
      expect(ValidationUtil.validate('TIME_MONTH', '26-01')).toBe(false);
    });
  });

  describe('validate TIME_QUARTER', () => {
    it('should return true for valid quarter values', () => {
      expect(ValidationUtil.validate('TIME_QUARTER', '2026-Q1')).toBe(true);
      expect(ValidationUtil.validate('TIME_QUARTER', '2026-Q4')).toBe(true);
      expect(ValidationUtil.validate('TIME_QUARTER', '2026-q2')).toBe(true);
    });

    it('should return false for invalid quarter values', () => {
      expect(ValidationUtil.validate('TIME_QUARTER', '2026-Q0')).toBe(false);
      expect(ValidationUtil.validate('TIME_QUARTER', '2026-Q5')).toBe(false);
      expect(ValidationUtil.validate('TIME_QUARTER', '2026-1')).toBe(false);
      expect(ValidationUtil.validate('TIME_QUARTER', '26-Q1')).toBe(false);
    });
  });

  describe('validate TIME_YEAR', () => {
    it('should return true for valid 4-digit years', () => {
      expect(ValidationUtil.validate('TIME_YEAR', '2026')).toBe(true);
      expect(ValidationUtil.validate('TIME_YEAR', '1999')).toBe(true);
      expect(ValidationUtil.validate('TIME_YEAR', '0000')).toBe(true);
    });

    it('should return false for invalid year values', () => {
      expect(ValidationUtil.validate('TIME_YEAR', '999')).toBe(false);
      expect(ValidationUtil.validate('TIME_YEAR', '20261')).toBe(false);
      expect(ValidationUtil.validate('TIME_YEAR', 'abc')).toBe(false);
    });
  });

  describe('validate URL', () => {
    it('should return true for valid URLs', () => {
      expect(ValidationUtil.validate('URL', 'http://example.com')).toBe(true);
      expect(ValidationUtil.validate('URL', 'https://example.com')).toBe(true);
      expect(ValidationUtil.validate('URL', 'https://sub.example.com/path?query=1&other=2')).toBe(true);
      expect(ValidationUtil.validate('URL', 'example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(ValidationUtil.validate('URL', 'xxxx')).toBe(false);
      expect(ValidationUtil.validate('URL', 'ftp://')).toBe(false);
      expect(ValidationUtil.validate('URL', 'http://')).toBe(false);
    });
  });

  describe('validate REGEX', () => {
    it('should return true for valid regular expressions', () => {
      expect(ValidationUtil.validate('REGEX', 'H\\d+')).toBe(true);
      expect(ValidationUtil.validate('REGEX', '^[a-z]+$')).toBe(true);
      expect(ValidationUtil.validate('REGEX', '.*')).toBe(true);
      expect(ValidationUtil.validate('REGEX', '(foo|bar)')).toBe(true);
    });

    it('should return false for invalid regular expressions', () => {
      expect(ValidationUtil.validate('REGEX', '[')).toBe(false);
      expect(ValidationUtil.validate('REGEX', '(unclosed')).toBe(false);
      expect(ValidationUtil.validate('REGEX', '*')).toBe(false);
    });
  });
});
