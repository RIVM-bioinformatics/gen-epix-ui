import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';

import { FILTER_MODE } from '../abstracts/FilterAbstract';

import { DateFilter } from './DateFilter';
import type { DateFilterKwArgs } from './DateFilter';

const parseDate = (value: string): Date => new Date(value.includes('T') ? value : `${value}T12:00:00.000Z`);

const createFilter = (overrides: Partial<DateFilterKwArgs> = {}): DateFilter => new DateFilter({
  dateParser: parseDate,
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'date-filter',
  label: 'Date filter',
  maxDate: new Date('2025-12-31T12:00:00.000Z'),
  minDate: new Date('2020-01-01T12:00:00.000Z'),
  ...overrides,
});

const createDate = (value: string): Date => new Date(`${value}T12:00:00.000Z`);

const INVALID_DATE_PARSER_CASES: Array<[string, [Date, Date]]> = [
  ['[]', [null, null]],
  ['["2024-01-01"]', [null, null]],
  ['["2024-01-01","2024-01-02","2024-01-03"]', [null, null]],
  ['["","2024-01-02"]', [null, createDate('2024-01-02')]],
  ['["not-a-date","2024-01-02"]', [null, createDate('2024-01-02')]],
  ['[null,"2024-01-02"]', [null, createDate('2024-01-02')]],
  ['[123,"2024-01-02"]', [null, createDate('2024-01-02')]],
];

const RANGE_MATCH_CASES: Array<[string, boolean]> = [
  ['2024-01-01', false],
  ['2024-01-02', true],
  ['2024-01-03', true],
  ['2024-01-04', true],
  ['2024-01-05', false],
];

describe('DateFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes dates, parser, and default formats and backend type', () => {
    const filter = createFilter();

    expect(filter.filterValue).toEqual([null, null]);
    expect(filter.initialFilterValue).toEqual([null, null]);
    expect(filter.filterValue).not.toBe(filter.initialFilterValue);
    expect(filter.dateParser).toBe(parseDate);
    expect(filter.minDate).toEqual(new Date('2020-01-01T12:00:00.000Z'));
    expect(filter.maxDate).toEqual(new Date('2025-12-31T12:00:00.000Z'));
    expect(filter.dateFormat).toBe(DATE_FORMAT.DATE);
    expect(filter.backendFilterType).toBe('DATE_RANGE');
    expect(filter.supportsMissingValuesFilter).toBe(true);
  });

  it('preserves configured filter dimension, date format, and backend type', () => {
    const filter = createFilter({
      backendFilterType: 'PARTIAL_DATE_RANGE',
      dateFormat: DATE_FORMAT.DATE_TIME,
      filterDimensionId: 'date-dimension',
    });

    expect(filter.filterDimensionId).toBe('date-dimension');
    expect(filter.dateFormat).toBe(DATE_FORMAT.DATE_TIME);
    expect(filter.backendFilterType).toBe('PARTIAL_DATE_RANGE');
  });

  it('keeps default range arrays independent between instances', () => {
    const firstFilter = createFilter();
    const secondFilter = createFilter();
    const selectedDate = createDate('2024-01-02');

    firstFilter.filterValue[0] = selectedDate;
    firstFilter.initialFilterValue[1] = selectedDate;

    expect(secondFilter.filterValue).toEqual([null, null]);
    expect(secondFilter.initialFilterValue).toEqual([null, null]);
  });

  it('parses two valid URL dates and preserves empty bounds', () => {
    const filter = createFilter();

    expect(filter.fromURLSearchParameterValue(JSON.stringify([
      createDate('2024-01-02').toISOString(),
      createDate('2024-01-04').toISOString(),
    ]))).toEqual([
      createDate('2024-01-02'),
      createDate('2024-01-04'),
    ]);
    expect(filter.fromURLSearchParameterValue('["","2024-01-04"]')).toEqual([
      null,
      createDate('2024-01-04'),
    ]);
  });

  it.each(INVALID_DATE_PARSER_CASES)('returns null bounds for invalid range input %s', (value, expectedValue) => {
    const filter = createFilter();

    expect(filter.fromURLSearchParameterValue(value)).toEqual(expectedValue);
  });

  it.each(['not-json', '{}'])('logs and returns null bounds for malformed JSON %j', (value) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const filter = createFilter();

    expect(filter.fromURLSearchParameterValue(value)).toEqual([null, null]);
    expect(errorSpy).toHaveBeenCalledExactlyOnceWith(`Error parsing search parameter value for label Date filter and value ${value}`, expect.any(Error));
  });

  it('logs parser failures and returns null bounds', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const filter = createFilter({
      dateParser: () => {
        throw new Error('Invalid date input');
      },
    });

    expect(filter.fromURLSearchParameterValue('["2024-01-02","2024-01-04"]')).toEqual([null, null]);
    expect(errorSpy).toHaveBeenCalledExactlyOnceWith('Error parsing search parameter value for label Date filter and value ["2024-01-02","2024-01-04"]', expect.any(Error));
  });

  it('formats the current or explicitly provided date range and displays empty bounds', () => {
    const filter = createFilter();
    filter.filterValue = [createDate('2024-01-02'), createDate('2024-01-04')];

    expect(filter.getPresentationValue()).toBe('2024-01-02 - 2024-01-04');
    expect(filter.getPresentationValue(undefined)).toBe('2024-01-02 - 2024-01-04');
    expect(filter.getPresentationValue(null)).toBe('2024-01-02 - 2024-01-04');
    expect(filter.getPresentationValue([null, createDate('2024-01-04')])).toBe('... - 2024-01-04');
    expect(filter.getPresentationValue([createDate('2024-01-02'), null])).toBe('2024-01-02 - ...');
    expect(filter.getPresentationValue([])).toBe('... - ...');
  });

  it('displays ellipses for invalid bound dates independently', () => {
    const filter = createFilter();
    const invalidDate = new Date(Number.NaN);

    expect(filter.getPresentationValue([invalidDate, createDate('2024-01-04')])).toBe('... - 2024-01-04');
    expect(filter.getPresentationValue([createDate('2024-01-02'), invalidDate])).toBe('2024-01-02 - ...');
  });

  it('matches rows when there is no active range', () => {
    const filter = createFilter();

    expect(filter.matchRowValue('not-a-date')).toBe(true);
    filter.filterValue = null;
    expect(filter.matchRowValue('')).toBe(true);
  });

  it('matches both date bounds inclusively', () => {
    const filter = createFilter();
    filter.filterValue = [createDate('2024-01-02'), createDate('2024-01-04')];

    for (const [rowValue, expectedResult] of RANGE_MATCH_CASES) {
      expect(filter.matchRowValue(rowValue)).toBe(expectedResult);
    }
  });

  it('matches lower-only and upper-only date ranges inclusively', () => {
    const filter = createFilter();
    filter.filterValue = [createDate('2024-01-02'), null];
    expect(filter.matchRowValue('2024-01-01')).toBe(false);
    expect(filter.matchRowValue('2024-01-02')).toBe(true);
    expect(filter.matchRowValue('2024-01-03')).toBe(true);

    filter.filterValue = [null, createDate('2024-01-04')];
    expect(filter.matchRowValue('2024-01-03')).toBe(true);
    expect(filter.matchRowValue('2024-01-04')).toBe(true);
    expect(filter.matchRowValue('2024-01-05')).toBe(false);
  });

  it('rejects empty and invalid row dates when a range is active', () => {
    const filter = createFilter();
    filter.filterValue = [createDate('2024-01-02'), createDate('2024-01-04')];

    expect(filter.matchRowValue('')).toBe(false);
    expect(filter.matchRowValue('not-a-date')).toBe(false);
  });

  it('propagates parser failures while matching a row', () => {
    const filter = createFilter({
      dateParser: () => {
        throw new Error('Invalid row date');
      },
    });
    filter.filterValue = [createDate('2024-01-02'), null];

    expect(() => filter.matchRowValue('2024-01-03')).toThrowError(new Error('Invalid row date'));
  });

  it('omits an unchanged range from the backend filter', () => {
    const filter = createFilter();

    expect(filter.toBackendFilter()).toBeUndefined();
  });

  it('serializes valid backend bounds using the standard date format', () => {
    const filter = createFilter({
      backendFilterType: 'PARTIAL_DATE_RANGE',
      dateFormat: DATE_FORMAT.DATE_TIME,
    });
    filter.filterValue = [createDate('2024-01-02'), createDate('2024-01-04')];

    expect(filter.toBackendFilter()).toEqual({
      key: 'date-filter',
      lower_bound: '2024-01-02',
      lower_bound_censor: '>=',
      type: 'PARTIAL_DATE_RANGE',
      upper_bound: '2024-01-04',
      upper_bound_censor: '<=',
    });
  });

  it('serializes either valid one-sided backend bound', () => {
    const filter = createFilter();
    filter.filterValue = [createDate('2024-01-02'), null];

    expect(filter.toBackendFilter()).toEqual({
      key: 'date-filter',
      lower_bound: '2024-01-02',
      lower_bound_censor: '>=',
      type: 'DATE_RANGE',
      upper_bound: undefined,
      upper_bound_censor: undefined,
    });

    filter.filterValue = [null, createDate('2024-01-04')];
    expect(filter.toBackendFilter()).toEqual({
      key: 'date-filter',
      lower_bound: undefined,
      lower_bound_censor: undefined,
      type: 'DATE_RANGE',
      upper_bound: '2024-01-04',
      upper_bound_censor: '<=',
    });
  });

  it('omits invalid backend bounds while retaining the valid bound', () => {
    const filter = createFilter();
    const invalidDate = new Date(Number.NaN);
    filter.filterValue = [invalidDate, createDate('2024-01-04')];

    expect(filter.toBackendFilter()).toEqual({
      key: 'date-filter',
      lower_bound: undefined,
      lower_bound_censor: undefined,
      type: 'DATE_RANGE',
      upper_bound: '2024-01-04',
      upper_bound_censor: '<=',
    });

    filter.filterValue = [createDate('2024-01-02'), invalidDate];
    expect(filter.toBackendFilter()).toEqual({
      key: 'date-filter',
      lower_bound: '2024-01-02',
      lower_bound_censor: '>=',
      type: 'DATE_RANGE',
      upper_bound: undefined,
      upper_bound_censor: undefined,
    });
  });

  it('serializes the current range for a URL search parameter', () => {
    const filter = createFilter();
    filter.filterValue = [createDate('2024-01-02'), null];

    expect(filter.toURLSearchParameterValue()).toBe(
      JSON.stringify([createDate('2024-01-02'), null]),
    );
  });

  it('round-trips missing-value state with the selected date range', () => {
    const filter = createFilter();
    filter.filterValue = [createDate('2024-01-02'), createDate('2024-01-04')];
    filter.setIncludeMissingValues(true);
    const restoredFilter = createFilter();

    expect(restoredFilter.fromURLSearchParameterValue(filter.toURLSearchParameterValue())).toEqual([
      createDate('2024-01-02'),
      createDate('2024-01-04'),
    ]);
    expect(restoredFilter.includeMissingValues).toBe(true);
  });
});
