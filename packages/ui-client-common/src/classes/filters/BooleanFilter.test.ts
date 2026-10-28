import {
  describe,
  expect,
  it,
} from 'vitest';
import i18next from 'i18next';

import { FILTER_MODE } from '../abstracts/FilterAbstract';

import { BooleanFilter } from './BooleanFilter';

const createFilter = (): BooleanFilter => new BooleanFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'boolean-filter',
  label: 'Boolean filter',
});

const createTranslator = async () => {
  const i18n = i18next.createInstance();
  await i18n.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          ['No']: 'translated:No',
          ['Yes']: 'translated:Yes',
        },
      },
    },
  });
  return i18n.t;
};
const NO_FILTER_VALUE_MATCH_CASES: Array<[null | undefined, boolean]> = [
  [null, true],
  [null, false],
  [undefined, true],
  [undefined, false],
];
const ACTIVE_FILTER_MATCH_CASES: Array<[boolean, boolean | null | undefined, boolean]> = [
  [true, true, true],
  [true, false, false],
  [true, null, false],
  [true, undefined, false],
  [false, false, true],
  [false, true, false],
  [false, null, false],
  [false, undefined, false],
];

describe('BooleanFilter', () => {
  it('initializes with no active filter value', () => {
    const filter = createFilter();

    expect(filter.filterValue).toBeNull();
    expect(filter.initialFilterValue).toBeNull();
    expect(filter.supportsMissingValuesFilter).toBe(true);
  });

  it('uses the current value when the presentation value is omitted, undefined, or null', () => {
    const filter = createFilter();
    filter.filterValue = true;

    expect(filter.getPresentationValue()).toBe('Yes');
    expect(filter.getPresentationValue(undefined)).toBe('Yes');
    expect(filter.getPresentationValue(null)).toBe('Yes');
  });

  it('uses an explicitly provided false value instead of the current value', () => {
    const filter = createFilter();
    filter.filterValue = true;

    expect(filter.getPresentationValue(false)).toBe('No');
  });

  it.each([
    [true, 'translated:Yes'],
    [false, 'translated:No'],
  ])('translates the presentation value for %s', async (value, expectedValue) => {
    const filter = createFilter();

    expect(filter.getPresentationValue(value, await createTranslator())).toBe(expectedValue);
  });

  it.each(NO_FILTER_VALUE_MATCH_CASES)('matches any row when the filter value is %s', (filterValue, rowValue) => {
    const filter = createFilter();
    filter.filterValue = filterValue;

    expect(filter.matchRowValue(rowValue)).toBe(true);
  });

  it.each(ACTIVE_FILTER_MATCH_CASES)('matches row value %s against filter value %s', (filterValue, rowValue, expectedResult) => {
    const filter = createFilter();
    filter.filterValue = filterValue;

    expect(filter.matchRowValue(rowValue)).toBe(expectedResult);
  });

  it('throws when asked to serialize a backend filter', () => {
    const filter = createFilter();

    expect(() => filter.toBackendFilter()).toThrowError(new Error('Not implemented'));
  });
});
