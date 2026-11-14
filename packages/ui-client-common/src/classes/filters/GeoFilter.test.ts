import {
  describe,
  expect,
  it,
} from 'vitest';
import type { AutoCompleteOption } from '@gen-epix/ui-core-form/models/form.models';

import { FILTER_MODE } from '../abstracts/FilterAbstract';

import { GeoFilter } from './GeoFilter';

const OPTIONS: AutoCompleteOption[] = [
  { label: 'Alpha', value: 'alpha' },
  { label: 'Beta', value: 'beta' },
];

const createFilter = (options: AutoCompleteOption[] = OPTIONS): GeoFilter => new GeoFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'geo-filter',
  label: 'Geography',
  options,
});

describe('GeoFilter', () => {
  it('initializes with empty independent filter values and the provided options', () => {
    const firstFilter = createFilter();
    const secondFilter = createFilter();

    expect(firstFilter.filterValue).toEqual([]);
    expect(firstFilter.initialFilterValue).toEqual([]);
    expect(firstFilter.filterValue).not.toBe(firstFilter.initialFilterValue);
    expect(firstFilter.options).toBe(OPTIONS);
    expect(firstFilter.supportsMissingValuesFilter).toBe(true);

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
    const filter = createFilter();

    expect(filter.getPresentationValue(['unknown'])).toBe('');
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
  ])('matches row value %s against a selected geography', (rowValue, expectedResult) => {
    const filter = createFilter();
    filter.filterValue = ['alpha'];

    expect(filter.matchRowValue(rowValue)).toBe(expectedResult);
  });

  it('serializes only changed selections as a backend string-set filter', () => {
    const filter = createFilter();

    expect(filter.toBackendFilter()).toBeUndefined();

    filter.filterValue = ['beta', 'alpha'];
    expect(filter.toBackendFilter()).toEqual({
      key: 'geo-filter',
      members: ['beta', 'alpha'],
      type: 'STRING_SET',
    });
  });
});
