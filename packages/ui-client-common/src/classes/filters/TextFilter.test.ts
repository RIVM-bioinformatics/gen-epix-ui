import {
  describe,
  expect,
  it,
} from 'vitest';

import { FILTER_MODE } from '../abstracts/FilterAbstract';

import { TextFilter } from './TextFilter';

const createFilter = (): TextFilter => new TextFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'text-filter',
  label: 'Text',
});

describe('TextFilter', () => {
  it('initializes with an empty current and initial value', () => {
    const filter = createFilter();

    expect(filter.filterValue).toBe('');
    expect(filter.initialFilterValue).toBe('');
  });

  it('presents the current value when input is omitted, undefined, or null', () => {
    const filter = createFilter();
    filter.filterValue = 'current value';

    expect(filter.getPresentationValue()).toBe('current value');
    expect(filter.getPresentationValue(undefined)).toBe('current value');
    expect(filter.getPresentationValue(null)).toBe('current value');
  });

  it('uses explicitly provided values, including an empty string', () => {
    const filter = createFilter();
    filter.filterValue = 'current value';

    expect(filter.getPresentationValue('provided value')).toBe('provided value');
    expect(filter.getPresentationValue('')).toBe('');

    filter.setFilterValue(null);
    expect(filter.getPresentationValue()).toBe('');
  });

  it('matches any row when the filter is empty', () => {
    const filter = createFilter();

    expect(filter.matchRowValue('')).toBe(true);
    expect(filter.matchRowValue('anything')).toBe(true);
  });

  it('matches non-empty values by case-insensitive substring', () => {
    const filter = createFilter();
    filter.filterValue = 'EpIx';

    expect(filter.matchRowValue('Gen-EpiX')).toBe(true);
    expect(filter.matchRowValue('gen-epix')).toBe(true);
    expect(filter.matchRowValue('Gen-Epi')).toBe(false);
    expect(filter.matchRowValue('')).toBe(false);
  });

  it('preserves whitespace in substring matching', () => {
    const filter = createFilter();
    filter.filterValue = ' two ';

    expect(filter.matchRowValue('one two three')).toBe(true);
    expect(filter.matchRowValue('one two')).toBe(false);
  });

  it('omits an unchanged filter from the backend request', () => {
    expect(createFilter().toBackendFilter()).toBeUndefined();
  });

  it('wraps a changed filter value in a backend regex pattern', () => {
    const filter = createFilter();
    filter.filterValue = 'a.b';

    expect(filter.toBackendFilter()).toEqual({
      key: 'text-filter',
      pattern: '.*a.b.*',
      type: 'REGEX',
    });
  });
});
