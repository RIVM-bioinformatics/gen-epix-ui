import type {
  StringSchema,
  TestFunction,
} from 'yup';
import {
  setLocale,
  addMethod,
  string,
} from 'yup';
import { t } from 'i18next';

import { ValidationUtil } from '../utils/ValidationUtil';

type CustomValidation = {
  name: string;
  assertCallback: (value: string, ...args: unknown[]) => boolean;
  message: string | ((...args: unknown[]) => string);
};

export const setupYup = () => {
  setLocale({
    mixed: {
      default: 'Value is invalid',
      required: 'Field is mandatory',
      oneOf: 'Field is mandatory',
      notOneOf: 'Value is invalid',
      notType: 'Field is mandatory',
      notNull: 'Field is mandatory',
    },
    string: {
      length: 'Should be precisely ${length} characters long',
      min: 'Should contain at least ${min} characters',
      max: 'Should contain at most ${max} characters',
      matches: 'This value is invalid.',
      email: 'Should be a valid email address',
      url: 'Should be a valid URL',
      trim: 'Should not contain leading or trailing spaces',
      lowercase: 'Should only contain lowercase characters',
      uppercase: 'Should only contain uppercase characters',
    },
    number: {
      min: 'Should be greater or equal to ${min}',
      max: 'Should be lower or equal to ${max}',
      lessThan: 'Should be less than ${less}',
      moreThan: 'Should be higher than ${more}',
      positive: 'Should be a positive digit',
      negative: 'Should be negative digit',
      integer: 'Should be an integer',
    },
    date: {
      min: 'Should be later than ${min}',
      max: 'Should be before ${max}',
    },
    boolean: {},
    object: {
      noUnknown: 'This value is invalid',
    },
    array: {
      min: 'Should contain at least ${min} option(s)',
      max: 'Should contain at most ${max} option(s)',
    },
  });

  const customValidations: CustomValidation[] = [
    {
      name: 'code',
      assertCallback: (value: string) => ValidationUtil.validate('CODE', value),
      message: () => t`Only digits, letters (without diacritics) and '.' are allowed.`,
    },
    {
      name: 'strictAlpha',
      assertCallback: (value: string) => ValidationUtil.validate('STRICT_ALPHA', value),
      message: () => t`Only letters (without diacritics) are allowed.`,
    },
    {
      name: 'strictAlphaNumeric',
      assertCallback: (value: string) => ValidationUtil.validate('STRICT_ALPHA_NUMERIC', value),
      message: () => t`Only digits and letters (without diacritics) are allowed.`,
    },
    {
      name: 'alpha',
      assertCallback: (value: string) => ValidationUtil.validate('ALPHA', value),
      message: () => t`Only letters (including diacritics) are allowed.`,
    },
    {
      name: 'alphaNumeric',
      assertCallback: (value: string) => ValidationUtil.validate('ALPHA_NUMERIC', value),
      message: () => t`Only digits and letters (including diacritics) are allowed.`,
    },
    {
      name: 'extendedAlpha',
      assertCallback: (value: string) => ValidationUtil.validate('EXTENDED_ALPHA', value),
      message: () => t`Only letters (including diacritics) and punctuation marks are allowed.`,
    },
    {
      name: 'extendedAlphaNumeric',
      assertCallback: (value: string) => ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', value),
      message: () => t`Only digits, letters (including diacritics) and punctuation marks are allowed.`,
    },
    {
      name: 'freeFormText',
      assertCallback: (value: string) => ValidationUtil.validate('FREE_FORM_TEXT', value),
      message: () => t`Only freeform text characters are allowed.`,
    },
    {
      name: 'email',
      assertCallback: (value: string) => ValidationUtil.validate('EMAIL', value),
      message: () => t`Only a valid email address is allowed.`,
    },
    {
      name: 'uuid4',
      assertCallback: (value: string) => ValidationUtil.validate('UUID4', value),
      message: () => t`Only a valid UUID is allowed.`,
    },
    {
      name: 'latLong',
      assertCallback: (value: string) => ValidationUtil.validate('LAT_LONG', value),
      message: () => t`Only valid latitude and longitude coordinates are allowed. For example: 13.7368, 100.5627`,
    },
    {
      name: 'timeWeek',
      assertCallback: (value: string) => ValidationUtil.validate('TIME_WEEK', value),
      message: () => t`Only a valid time week is allowed. For example: 2021-W01`,
    },
    {
      name: 'timeQuarter',
      assertCallback: (value: string) => ValidationUtil.validate('TIME_QUARTER', value),
      message: () => t`Only a valid time quarter notation is allowed. For example: 2021-Q1`,
    },
    {
      name: 'timeMonth',
      assertCallback: (value: string) => ValidationUtil.validate('TIME_MONTH', value),
      message: () => t`Only a valid time month notation is allowed. For example: 2021-01`,
    },
    {
      name: 'timeYear',
      assertCallback: (value: string) => ValidationUtil.validate('TIME_YEAR', value),
      message: () => t`Only a valid time year notation is allowed. For example: 2021`,
    },
    {
      name: 'decimal0',
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_0', value),
      message: () => t`Only a valid number is allowed. (signed, 0 decimal places)`,
    },
    {
      name: 'decimal1',
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_1', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 1 decimal place, use '.' as decimal separator)`,
    },
    {
      name: 'decimal2',
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_2', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 2 decimal place, use '.' as decimal separator)`,
    },
    {
      name: 'decimal3',
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_3', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 3 decimal place, use '.' as decimal separator)`,
    },
    {
      name: 'decimal4',
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_4', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 4 decimal place, use '.' as decimal separator)`,
    },
    {
      name: 'decimal5',
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_5', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 5 decimal place, use '.' as decimal separator)`,
    },
    {
      name: 'decimal6',
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_6', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 6 decimal place, use '.' as decimal separator)`,
    },
  ];

  customValidations.forEach((customValidation) => {
    // * Inevitable function inside a forEach
    function method(this: StringSchema, ...args: unknown[]) {
      return this.test(
        customValidation.name,
        () => {
          if (typeof customValidation.message === 'string') {
            return customValidation.message;
          }
          return customValidation.message(...args);
        },
        ((value: string): boolean => customValidation.assertCallback(value as unknown as string, ...args)) as TestFunction,
      );
    }
    addMethod(string, customValidation.name, method);
  });
};
