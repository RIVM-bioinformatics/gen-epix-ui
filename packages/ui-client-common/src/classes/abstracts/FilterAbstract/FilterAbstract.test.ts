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

  it('stores the assigned filter value without replacing its reference', () => {
    const filter = createFilter();
    const value = { selected: ['one', 'two'] };

    filter.setFilterValue(value);
    expect(filter.filterValue).toBe(value);

    filter.setFilterValue(null);
    expect(filter.filterValue).toBeNull();
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
});
