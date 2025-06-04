// @vitest-environment node

import { ValidationUtil } from './ValidationUtil';

describe('ValidationUtil', () => {
  describe('validate general', () => {
    it('should return true on correct input', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA', 'abcxyz')).toBe(true);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'abcxyz123')).toBe(true);
      expect(ValidationUtil.validate('ALPHA', 'ábçxÿz')).toBe(true);
      expect(ValidationUtil.validate('ALPHA_NUMERIC', 'ábçxÿz890')).toBe(true);
      expect(ValidationUtil.validate('EXTENDED_ALPHA', 'abc-xyz, ábç-xÿz.;:')).toBe(true);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', 'abc-xyz, ábç-xÿz.;:123')).toBe(true);
      expect(ValidationUtil.validate('FREE_FORM_TEXT', 'ábçxÿz890!@#$%^  \n \t')).toBe(true);
    });
    it('should return false on incorrect input', () => {
      expect(ValidationUtil.validate('STRICT_ALPHA', 'ábçxÿz')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA', '123')).toBe(false);
      expect(ValidationUtil.validate('STRICT_ALPHA_NUMERIC', 'ábçxÿz123')).toBe(false);
      expect(ValidationUtil.validate('ALPHA', '!@#$%^')).toBe(false);
      expect(ValidationUtil.validate('ALPHA', '!@#$%^ \n\t')).toBe(false);
      expect(ValidationUtil.validate('ALPHA_NUMERIC', '!@#$%^ \n\t')).toBe(false);
      expect(ValidationUtil.validate('EXTENDED_ALPHA', '!@#$%^ \n\t')).toBe(false);
      expect(ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', '!@#$%^ 123 \n\t')).toBe(false);
    });
  });

  describe('validate ALPHA', () => {
    it.each(['!', '"', '#', '$', '%', '&', '(', ')', '*', ',', '.', '/', ':', ';', '?', '@', '[', '\\', ']', '^', '_', '{', '}', '|', '+', '<', '=', '>', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9])(
      'should fail on special character: %s',
      (char) => {
        expect(ValidationUtil.validate('ALPHA', char)).toBe(false);
      },
    );
  });

  describe('validate EXTENDED_ALPHA', () => {
    it.each(['!', '"', '$', '%', '*', '@', '[', ']', '\\', '^', '_', '{', '|', '}', '+', '<', '=', '>'])(
      'should fail on special character: %s',
      (char) => {
        expect(ValidationUtil.validate('EXTENDED_ALPHA', char)).toBe(false);
      },
    );
  });
});
