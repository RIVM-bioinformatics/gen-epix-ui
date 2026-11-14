import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
  FilterAbstract,
} from './FilterAbstract';
import type { FilterAbstractKwArgs } from './FilterAbstract';

class TestFilter extends FilterAbstract<unknown> {}

const createFilter = (overrides: Partial<FilterAbstractKwArgs> = {}): TestFilter => new TestFilter({
  filterMode: FILTER_MODE.BACKEND,
  filterPriority: 'priority',
  id: 'filter-id',
  label: 'Filter label',
  ...overrides,
});

describe('FilterAbstract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports the filter modes and default group', () => {
    expect(FILTER_MODE).toEqual({
      BACKEND: 'BACKEND',
      FRONTEND: 'FRONTEND',
    });
    expect(DEFAULT_FILTER_GROUP).toBe('DEFAULT');
  });

  it('sets metadata and defaults an absent filter dimension to null', () => {
    const filter = createFilter();

    expect(filter.id).toBe('filter-id');
    expect(filter.label).toBe('Filter label');
    expect(filter.filterMode).toBe(FILTER_MODE.BACKEND);
    expect(filter.filterPriority).toBe('priority');
    expect(filter.filterDimensionId).toBeNull();
    expect(filter.showInSidebar).toBe(true);
    expect(filter.supportsMissingValuesFilter).toBe(false);
  });

  it.each(['dimension-id', ''])('preserves the provided filter dimension %j', (filterDimensionId) => {
    const filter = createFilter({
      filterDimensionId,
      filterMode: FILTER_MODE.FRONTEND,
    });

    expect(filter.filterDimensionId).toBe(filterDimensionId);
    expect(filter.filterMode).toBe(FILTER_MODE.FRONTEND);
  });

  it('parses valid URL search parameter JSON', () => {
    const filter = createFilter();

    expect(filter.fromURLSearchParameterValue('{"ids":[1,null],"active":true}')).toEqual({
      active: true,
      ids: [1, null],
    });
    expect(filter.fromURLSearchParameterValue('null')).toBeNull();
  });

  it('restores missing-value state from a URL envelope and clears it for legacy values', () => {
    const filter = createFilter();
    filter.setIncludeMissingValues(true);

    expect(filter.fromURLSearchParameterValue('{"genEpixFilterState":1,"genEpixFilterValue":"value","includeMissingValues":true}')).toBe('value');
    expect(filter.includeMissingValues).toBe(true);

    expect(filter.fromURLSearchParameterValue('"legacy value"')).toBe('legacy value');
    expect(filter.includeMissingValues).toBe(false);
  });

  it.each([
    ['[]', []],
    ['{"genEpixFilterState":2,"genEpixFilterValue":"value","includeMissingValues":true}', {
      genEpixFilterState: 2,
      genEpixFilterValue: 'value',
      includeMissingValues: true,
    }],
    ['{"genEpixFilterState":1,"includeMissingValues":true}', {
      genEpixFilterState: 1,
      includeMissingValues: true,
    }],
    ['{"genEpixFilterState":1,"genEpixFilterValue":"value"}', {
      genEpixFilterState: 1,
      genEpixFilterValue: 'value',
    }],
    ['{"genEpixFilterState":1,"genEpixFilterValue":"value","includeMissingValues":false}', {
      genEpixFilterState: 1,
      genEpixFilterValue: 'value',
      includeMissingValues: false,
    }],
  ])('does not interpret legacy or invalid state %s as a missing-value envelope', (value, expectedValue) => {
    const filter = createFilter();
    filter.setIncludeMissingValues(true);

    expect(filter.fromURLSearchParameterValue(value)).toEqual(expectedValue);
    expect(filter.includeMissingValues).toBe(false);
  });

  it.each(['', '   ', 'not-json'])('logs and returns null for invalid JSON %j', (value) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const filter = createFilter();

    expect(filter.fromURLSearchParameterValue(value)).toBeNull();
    expect(errorSpy).toHaveBeenCalledExactlyOnceWith('Error parsing search parameter value:', expect.any(SyntaxError));
  });

  it('uses the current value when the comparison value is omitted or undefined', () => {
    const filter = createFilter();
    filter.initialFilterValue = { status: 'open' };
    filter.filterValue = { status: 'open' };

    expect(filter.isInitialFilterValue()).toBe(true);
    expect(filter.isInitialFilterValue(undefined)).toBe(true);

    filter.filterValue = { status: 'closed' };
    expect(filter.isInitialFilterValue()).toBe(false);
  });

  it('compares an explicitly provided value, including null, instead of the current value', () => {
    const filter = createFilter();
    filter.initialFilterValue = 'initial';
    filter.filterValue = 'current';

    expect(filter.isInitialFilterValue('initial')).toBe(true);
    expect(filter.isInitialFilterValue(null)).toBe(false);
  });

  it('distinguishes an active value from an active missing-value selection', () => {
    const filter = createFilter();
    filter.initialFilterValue = 'initial';
    filter.filterValue = 'initial';

    expect(filter.isFilterActive()).toBe(false);
    expect(filter.isFilterActive('initial', true)).toBe(true);
    expect(filter.isFilterActive('changed', false)).toBe(true);
  });

  it('stores the assigned filter value without replacing its reference', () => {
    const filter = createFilter();
    const value = { selected: ['one', 'two'] };

    filter.setFilterValue(value);
    expect(filter.filterValue).toBe(value);

    filter.setFilterValue(null);
    expect(filter.filterValue).toBeNull();
  });

  it.each([
    [null, true],
    [undefined, true],
    ['', true],
    [[], true],
    [['value'], false],
    [0, false],
    [false, false],
    [' ', false],
  ])('identifies whether %j represents a missing value', (value, expectedResult) => {
    expect(FilterAbstract.isMissingValue(value)).toBe(expectedResult);
  });

  it('matches values unchanged when missing-value selection is disabled', () => {
    const filter = createFilter();
    const matchRowValue = vi.fn((value: unknown) => value === 'matched');

    expect(filter.matchRowValueIncludingMissingValues(null, matchRowValue)).toBe(false);
    expect(filter.matchRowValueIncludingMissingValues('matched', matchRowValue)).toBe(true);
    expect(matchRowValue).toHaveBeenCalledTimes(2);
  });

  it('matches only missing rows when Missing is the only selection', () => {
    const filter = createFilter();
    filter.initialFilterValue = 'initial';
    filter.filterValue = 'initial';
    filter.setIncludeMissingValues(true);
    const matchRowValue = vi.fn(() => true);

    expect(filter.matchRowValueIncludingMissingValues(null, matchRowValue)).toBe(true);
    expect(filter.matchRowValueIncludingMissingValues('value', matchRowValue)).toBe(false);
    expect(matchRowValue).not.toHaveBeenCalled();
  });

  it('matches missing rows alongside selected values', () => {
    const filter = createFilter();
    filter.initialFilterValue = 'initial';
    filter.filterValue = 'selected';
    filter.setIncludeMissingValues(true);
    const matchRowValue = vi.fn((value: unknown) => value === 'selected');

    expect(filter.matchRowValueIncludingMissingValues(undefined, matchRowValue)).toBe(true);
    expect(filter.matchRowValueIncludingMissingValues('selected', matchRowValue)).toBe(true);
    expect(filter.matchRowValueIncludingMissingValues('other', matchRowValue)).toBe(false);
    expect(matchRowValue).toHaveBeenCalledTimes(2);
  });

  it('builds Exists and nested OR backend filters for missing values', () => {
    const filter = createFilter();
    const valueFilter = {
      key: 'filter-id',
      pattern: 'value',
      type: 'REGEX',
    };

    expect(filter.toBackendFilterWithMissingValues(valueFilter)).toBe(valueFilter);

    filter.setIncludeMissingValues(true);
    expect(filter.toBackendFilterWithMissingValues()).toEqual({
      invert: true,
      key: 'filter-id',
      type: 'EXISTS',
    });
    expect(filter.toBackendFilterWithMissingValues(valueFilter)).toEqual({
      filters: [
        valueFilter,
        {
          invert: true,
          key: 'filter-id',
          type: 'EXISTS',
        },
      ],
      operator: 'OR',
      type: 'COMPOSITE',
    });
  });

  it.each([
    ['plain text', '"plain text"'],
    [null, 'null'],
    [{ selected: ['one', 'two'] }, '{"selected":["one","two"]}'],
  ])('serializes %j as JSON', (filterValue, expectedValue) => {
    const filter = createFilter();
    filter.setFilterValue(filterValue);

    expect(filter.toURLSearchParameterValue()).toBe(expectedValue);
  });

  const valuesThatCannotBeSerialized: Array<[string, unknown]> = [
    ['undefined', undefined],
    ['a function', (): undefined => undefined],
    ['a symbol', Symbol('filter')],
  ];

  it.each(valuesThatCannotBeSerialized)('throws when %s cannot be represented as JSON', (_description, filterValue) => {
    const filter = createFilter();
    filter.setFilterValue(filterValue);

    expect(() => filter.toURLSearchParameterValue()).toThrowError(
      new TypeError('Filter value cannot be serialized as JSON.'),
    );
  });

  it('serializes missing-value state without changing the legacy value representation', () => {
    const filter = createFilter();
    filter.setFilterValue('selected');
    filter.setIncludeMissingValues(true);

    expect(JSON.parse(filter.toURLSearchParameterValue())).toEqual({
      genEpixFilterState: 1,
      genEpixFilterValue: 'selected',
      includeMissingValues: true,
    });

    filter.setIncludeMissingValues(false);
    expect(filter.toURLSearchParameterValue()).toBe('"selected"');
  });

  it('throws when the serialized missing-value envelope cannot be represented as JSON', () => {
    const filter = createFilter();
    filter.setFilterValue('selected');
    filter.setIncludeMissingValues(true);
    vi.spyOn(JSON, 'stringify')
      .mockReturnValueOnce('"selected"')
      .mockReturnValueOnce(undefined);

    expect(() => filter.toURLSearchParameterValue()).toThrowError(
      new TypeError('Filter value cannot be serialized as JSON.'),
    );
  });

  it('encodes dots in missing-value form field names', () => {
    const filter = createFilter({ id: 'filter.with.dots' });

    expect(filter.includeMissingValuesFormFieldName).toBe('__includeMissingValues_filter%2Ewith%2Edots');
  });
});
