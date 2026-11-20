import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { setupUiCoreForm } from '../../setup/setup';

import { SchemaUtil } from './SchemaUtil';

beforeAll(() => {
  setupUiCoreForm();
});

describe('SchemaUtil', () => {
  describe.each([
    { field: 'code', getSchema: () => SchemaUtil.code },
    { field: 'label', getSchema: () => SchemaUtil.label },
    { field: 'name', getSchema: () => SchemaUtil.name },
  ])('$field', ({ getSchema }) => {
    it('requires extended alphanumeric text with a maximum length of 100', () => {
      const schema = getSchema();
      const testNames = schema.describe().tests.map((test) => test.name);

      expect(testNames).toContain('extendedAlphaNumeric');
      expect(testNames).toContain('required');
      expect(schema.describe().tests.find((test) => test.name === 'max')?.params)
        .toMatchObject({ max: 100 });
      const maximumLengthValue = 'a'.repeat(100);

      expect(schema.validateSync(maximumLengthValue)).toBe(maximumLengthValue);
      expect(() => schema.validateSync(`${maximumLengthValue}a`)).toThrow();
      expect(() => schema.validateSync('')).toThrow();
    });
  });

  it('allows optional free-form descriptions up to 1000 characters', () => {
    const schema = SchemaUtil.description;
    const description = schema.describe();
    const testNames = description.tests.map((test) => test.name);

    expect(description.optional).toBe(true);
    expect(testNames).toContain('freeFormText');
    expect(description.tests.find((test) => test.name === 'max')?.params)
      .toMatchObject({ max: 1000 });
    const maximumLengthDescription = 'a'.repeat(1000);

    expect(schema.validateSync(undefined)).toBeUndefined();
    expect(schema.validateSync(maximumLengthDescription)).toBe(maximumLengthDescription);
    expect(() => schema.validateSync(`${maximumLengthDescription}a`)).toThrow();
  });

  describe('isoString', () => {
    it('transforms a valid Date to an ISO string', () => {
      const date = new Date('2026-10-21T12:34:56.000Z');

      expect(SchemaUtil.isoString.cast(date)).toBe('2026-10-21T12:34:56.000Z');
    });

    it('returns undefined for an invalid Date', () => {
      expect(SchemaUtil.isoString.cast(new Date(Number.NaN))).toBeUndefined();
    });
  });

  it('creates a nullable number schema', () => {
    expect(SchemaUtil.number.describe().nullable).toBe(true);
    expect(SchemaUtil.number.cast(null)).toBeNull();
    expect(SchemaUtil.number.validateSync(undefined)).toBeUndefined();
  });

  describe('rank', () => {
    it('accepts non-negative integers including zero', () => {
      expect(SchemaUtil.rank.validateSync(0)).toBe(0);
      expect(SchemaUtil.rank.validateSync(5)).toBe(5);
      expect(SchemaUtil.rank.validateSync('5')).toBe(5);
    });

    it.each([-1, 1.5, null])('rejects %s', (value) => {
      expect(() => SchemaUtil.rank.validateSync(value)).toThrow();
    });

    it('rejects an undefined value', () => {
      expect(() => SchemaUtil.rank.validateSync(undefined)).toThrow();
    });
  });
});
