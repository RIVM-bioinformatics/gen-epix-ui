import {
  describe,
  expect,
  it,
} from 'vitest';
import type { AutoCompleteOption } from '@gen-epix/ui-core-form/models/form.models';

import { FILTER_MODE } from '../abstracts/FilterAbstract';

import { MultiSelectFilter } from './MultiSelectFilter';

const createOptions = (): AutoCompleteOption[] => [
  { label: 'Alpha', value: 'alpha' },
  { label: 'Beta', value: 'beta' },
];

const createFilter = (options: AutoCompleteOption[] = createOptions(), maxNumOptionsExpanded?: number): MultiSelectFilter => new MultiSelectFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'multi-select-filter',
  label: 'Options',
  maxNumOptionsExpanded,
  options,
});

const MAXIMUM_CASES: Array<[number | undefined, number]> = [
  [undefined, 5],
  [0, 0],
  [1000, 1000],
  [Number.NaN, 5],
];

describe('MultiSelectFilter', () => {
  it.each(MAXIMUM_CASES)('uses expansion threshold %s', (configuredMaximum, expectedMaximum) => {
    expect(createFilter(undefined, configuredMaximum).maxNumOptionsExpanded).toBe(expectedMaximum);
  });

  it('initializes with empty independent values and the provided options', () => {
    const firstFilter = createFilter();
    const secondFilter = createFilter();

    expect(firstFilter.filterValue).toEqual([]);
    expect(firstFilter.initialFilterValue).toEqual([]);
    expect(firstFilter.filterValue).not.toBe(firstFilter.initialFilterValue);
    expect(firstFilter.options).toEqual(createOptions());

    firstFilter.filterValue.push('alpha');
    expect(secondFilter.filterValue).toEqual([]);
  });

  it('presents no selected options as an empty string', () => {
    expect(createFilter().getPresentationValue()).toBe('');
    expect(createFilter([]).getPresentationValue()).toBe('');
  });

  it('uses current values for omitted, undefined, or null input and preserves selection order', () => {
    const filter = createFilter();
    filter.filterValue = ['beta', 'alpha'];

    expect(filter.getPresentationValue()).toBe('Beta, Alpha');
    expect(filter.getPresentationValue(undefined)).toBe('Beta, Alpha');
    expect(filter.getPresentationValue(null)).toBe('Beta, Alpha');
    expect(filter.getPresentationValue(['alpha', 'beta', 'alpha'])).toBe('Alpha, Beta, Alpha');
  });

  it('renders unknown selected values as empty labels', () => {
    expect(createFilter().getPresentationValue(['unknown'])).toBe('');
  });

  it('does not filter rows when the filter value is unset, malformed, or empty', () => {
    const filter = createFilter();

    filter.setFilterValue(null);
    expect(filter.matchRowValue('alpha')).toBe(true);

    filter.setFilterValue('not-an-array');
    expect(filter.matchRowValue('alpha')).toBe(true);

    filter.setFilterValue([]);
    expect(filter.matchRowValue('alpha')).toBe(true);
  });

  it.each([
    ['alpha', true],
    ['beta', false],
  ])('matches a string row value %s against the selected values', (rowValue, expectedResult) => {
    const filter = createFilter();
    filter.filterValue = ['alpha'];

    expect(filter.matchRowValue(rowValue)).toBe(expectedResult);
  });

  it.each([
    [['alpha', 'beta'], true],
    [['beta'], false],
    [[], false],
  ])('matches array row values by intersection', (rowValue, expectedResult) => {
    const filter = createFilter();
    filter.filterValue = ['alpha'];

    expect(filter.matchRowValue(rowValue)).toBe(expectedResult);
  });

  it('serializes only changed selections as a backend string-set filter', () => {
    const filter = createFilter();

    expect(filter.toBackendFilter()).toBeUndefined();

    filter.filterValue = ['beta', 'alpha'];
    expect(filter.toBackendFilter()).toEqual({
      key: 'multi-select-filter',
      members: ['beta', 'alpha'],
      type: 'STRING_SET',
    });
  });
});
