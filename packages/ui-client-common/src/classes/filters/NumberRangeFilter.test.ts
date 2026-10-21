import {
  describe,
  expect,
  it,
} from 'vitest';

import { FILTER_MODE } from '../abstracts/FilterAbstract';

import { NumberRangeFilter } from './NumberRangeFilter';

const createFilter = (min = -100, max = 100): NumberRangeFilter => new NumberRangeFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'number-range-filter',
  label: 'Number range',
  max,
  min,
});

describe('NumberRangeFilter', () => {
  it('initializes with independent empty ranges and configured limits', () => {
    const firstFilter = createFilter(-10, 10);
    const secondFilter = createFilter(-10, 10);

    expect(firstFilter.filterValue).toEqual([null, null]);
    expect(firstFilter.initialFilterValue).toEqual([null, null]);
    expect(firstFilter.filterValue).not.toBe(firstFilter.initialFilterValue);
    expect(firstFilter.min).toBe(-10);
    expect(firstFilter.max).toBe(10);

    firstFilter.filterValue[0] = 1;
    expect(secondFilter.filterValue).toEqual([null, null]);
  });

  it('presents empty, one-sided, ordinary, equal, and non-finite ranges', () => {
    const filter = createFilter();

    expect(filter.getPresentationValue()).toBe('');
    expect(filter.getPresentationValue(undefined)).toBe('');

    filter.filterValue = [1, 10];
    expect(filter.getPresentationValue()).toBe('[1,10[');
    expect(filter.getPresentationValue(null)).toBe('[1,10[');
    expect(filter.getPresentationValue([2, null])).toBe('[2');
    expect(filter.getPresentationValue([null, 10])).toBe('10[');
    expect(filter.getPresentationValue([5, 5])).toBe('[5,5]');
    expect(filter.getPresentationValue([Number.NaN, Number.POSITIVE_INFINITY])).toBe('');
    expect(filter.getPresentationValue([-1000000, 1000000])).toBe('[-1000000,1000000[');
  });

  it('matches any finite row when no range is active and rejects non-finite rows', () => {
    const filter = createFilter();

    expect(filter.matchRowValue(-1000)).toBe(true);
    expect(filter.matchRowValue(0)).toBe(true);
    expect(filter.matchRowValue(1000)).toBe(true);
    expect(filter.matchRowValue(Number.NaN)).toBe(false);
    expect(filter.matchRowValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(filter.matchRowValue(Number.NEGATIVE_INFINITY)).toBe(false);

    filter.setFilterValue(null);
    expect(filter.matchRowValue(5)).toBe(true);
  });

  it('uses an inclusive lower and exclusive upper boundary for ordinary ranges', () => {
    const filter = createFilter();
    filter.filterValue = [0, 10];

    expect(filter.matchRowValue(-1)).toBe(false);
    expect(filter.matchRowValue(0)).toBe(true);
    expect(filter.matchRowValue(9)).toBe(true);
    expect(filter.matchRowValue(10)).toBe(false);
    expect(filter.matchRowValue(11)).toBe(false);
  });

  it('uses a single inclusive value when both bounds are equal', () => {
    const filter = createFilter();
    filter.filterValue = [5, 5];

    expect(filter.matchRowValue(4)).toBe(false);
    expect(filter.matchRowValue(5)).toBe(true);
    expect(filter.matchRowValue(6)).toBe(false);
  });

  it('matches one-sided ranges with the same boundary semantics', () => {
    const filter = createFilter();
    filter.filterValue = [0, null];

    expect(filter.matchRowValue(-1)).toBe(false);
    expect(filter.matchRowValue(0)).toBe(true);
    expect(filter.matchRowValue(1)).toBe(true);

    filter.filterValue = [null, 10];
    expect(filter.matchRowValue(9)).toBe(true);
    expect(filter.matchRowValue(10)).toBe(false);
    expect(filter.matchRowValue(11)).toBe(false);
  });

  it('omits an unchanged range from the backend filter', () => {
    expect(createFilter().toBackendFilter()).toBeUndefined();
  });

  it('serializes one-sided and ordinary backend ranges with censor operators', () => {
    const filter = createFilter();
    filter.filterValue = [2, null];

    expect(filter.toBackendFilter()).toEqual({
      key: 'number-range-filter',
      lower_bound: 2,
      lower_bound_censor: '>=',
      type: 'NUMBER_RANGE',
      upper_bound: undefined,
      upper_bound_censor: undefined,
    });

    filter.filterValue = [null, 10];
    expect(filter.toBackendFilter()).toEqual({
      key: 'number-range-filter',
      lower_bound: undefined,
      lower_bound_censor: undefined,
      type: 'NUMBER_RANGE',
      upper_bound: 10,
      upper_bound_censor: '<',
    });

    filter.filterValue = [2, 10];
    expect(filter.toBackendFilter()).toEqual({
      key: 'number-range-filter',
      lower_bound: 2,
      lower_bound_censor: '>=',
      type: 'NUMBER_RANGE',
      upper_bound: 10,
      upper_bound_censor: '<',
    });
  });

  it('serializes equal bounds with an inclusive upper censor', () => {
    const filter = createFilter();
    filter.filterValue = [0, 0];

    expect(filter.toBackendFilter()).toEqual({
      key: 'number-range-filter',
      lower_bound: 0,
      lower_bound_censor: '>=',
      type: 'NUMBER_RANGE',
      upper_bound: 0,
      upper_bound_censor: '<=',
    });
  });
});
