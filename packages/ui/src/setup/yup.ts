import type {
  StringSchema,
  TestFunction,
} from 'yup';
import {
  addMethod,
  setLocale,
  string,
} from 'yup';
import { t } from 'i18next';

import { ValidationUtil } from '../utils/ValidationUtil';

type CustomValidation = {
  assertCallback: (value: string, ...args: unknown[]) => boolean;
  message: ((...args: unknown[]) => string) | string;
  name: string;
};

export const setupYup = () => {
  setLocale({
    array: {
      max: t('Should contain at most ${max} option(s)'),
      min: t('Should contain at least ${min} option(s)'),
    },
    boolean: {},
    date: {
      max: t('Should be before ${max}'),
      min: t('Should be later than ${min}'),
    },
    mixed: {
      default: t('Value is invalid'),
      notNull: t('Field is mandatory'),
      notOneOf: t('Value is invalid'),
      notType: t('Field is mandatory'),
      oneOf: t('Field is mandatory'),
      required: t('Field is mandatory'),
    },
    number: {
      integer: t('Should be an integer'),
      lessThan: t('Should be less than ${less}'),
      max: t('Should be lower or equal to ${max}'),
      min: t('Should be greater or equal to ${min}'),
      moreThan: t('Should be higher than ${more}'),
      negative: t('Should be negative digit'),
      positive: t('Should be a positive digit'),
    },
    object: {
      noUnknown: t('This value is invalid'),
    },
    string: {
      email: t('Should be a valid email address'),
      length: t('Should be precisely ${length} characters long'),
      lowercase: t('Should only contain lowercase characters'),
      matches: t('This value is invalid.'),
      max: t('Should contain at most ${max} characters'),
      min: t('Should contain at least ${min} characters'),
      trim: t('Should not contain leading or trailing spaces'),
      uppercase: t('Should only contain uppercase characters'),
      url: t('Should be a valid URL'),
    },
  });

  const customValidations: CustomValidation[] = [
    {
      assertCallback: (value: string) => ValidationUtil.validate('STRICT_ALPHA', value),
      message: () => t`Only letters (without diacritics) are allowed.`,
      name: 'strictAlpha',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('STRICT_ALPHA_NUMERIC', value),
      message: () => t`Only digits and letters (without diacritics) are allowed.`,
      name: 'strictAlphaNumeric',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('ALPHA', value),
      message: () => t`Only letters (including diacritics) are allowed.`,
      name: 'alpha',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('ALPHA_NUMERIC', value),
      message: () => t`Only digits and letters (including diacritics) are allowed.`,
      name: 'alphaNumeric',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('EXTENDED_ALPHA_NUMERIC', value),
      message: () => t`Only digits, letters (including diacritics) and punctuation marks are allowed.`,
      name: 'extendedAlphaNumeric',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('FREE_FORM_TEXT', value),
      message: () => t`Only freeform text characters are allowed.`,
      name: 'freeFormText',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('EMAIL', value),
      message: () => t`Only a valid email address is allowed.`,
      name: 'email',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('URL', value),
      message: () => t`Only a valid url is allowed.`,
      name: 'url',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('REGEX', value),
      message: () => t`Only a valid regex is allowed.`,
      name: 'regex',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('UUID4', value),
      message: () => t`Only a valid UUID is allowed.`,
      name: 'uuid4',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('LAT_LONG', value),
      message: () => t`Only valid latitude and longitude coordinates are allowed. For example: 13.7368, 100.5627`,
      name: 'latLong',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('TIME_WEEK', value),
      message: () => t`Only a valid time week is allowed. For example: 2021-W01`,
      name: 'timeWeek',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('TIME_QUARTER', value),
      message: () => t`Only a valid time quarter notation is allowed. For example: 2021-Q1`,
      name: 'timeQuarter',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('TIME_MONTH', value),
      message: () => t`Only a valid time month notation is allowed. For example: 2021-01`,
      name: 'timeMonth',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('TIME_YEAR', value),
      message: () => t`Only a valid time year notation is allowed. For example: 2021`,
      name: 'timeYear',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_0', value),
      message: () => t`Only a valid number is allowed. (signed, 0 decimal places)`,
      name: 'decimal0',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_1', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 1 decimal place, use '.' as decimal separator)`,
      name: 'decimal1',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_2', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 2 decimal place, use '.' as decimal separator)`,
      name: 'decimal2',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_3', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 3 decimal place, use '.' as decimal separator)`,
      name: 'decimal3',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_4', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 4 decimal place, use '.' as decimal separator)`,
      name: 'decimal4',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_5', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 5 decimal place, use '.' as decimal separator)`,
      name: 'decimal5',
    },
    {
      assertCallback: (value: string) => ValidationUtil.validate('DECIMAL_6', value),
      message: () => t`Only a valid number is allowed. (signed, maximum 6 decimal place, use '.' as decimal separator)`,
      name: 'decimal6',
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
