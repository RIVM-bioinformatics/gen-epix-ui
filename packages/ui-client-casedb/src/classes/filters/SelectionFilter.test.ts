import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import i18next from 'i18next';
import { FILTER_MODE } from '@gen-epix/ui-client-common/classes/abstracts/FilterAbstract';

import { SelectionFilter } from './SelectionFilter';

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          '{{numCases}} case(s)': '{{numCases}} case(s)',
        },
      },
    },
  });
});

const createFilter = (): SelectionFilter => new SelectionFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'selection-filter',
  label: 'Selected rows',
});

describe('SelectionFilter', () => {
  it('initializes independent empty selections and hides in the sidebar', () => {
    const firstFilter = createFilter();
    const secondFilter = createFilter();

    expect(firstFilter.filterValue).toEqual([]);
    expect(firstFilter.initialFilterValue).toEqual([]);
    expect(firstFilter.filterValue).not.toBe(firstFilter.initialFilterValue);
    expect(firstFilter.showInSidebar).toBe(false);

    firstFilter.filterValue.push('case-id');
    expect(secondFilter.filterValue).toEqual([]);
  });

  it.each([
    [0, '0 case(s)'],
    [2, '2 case(s)'],
  ])('presents the selected case count', (selectedCount, expectedValue) => {
    const filter = createFilter();
    filter.filterValue = Array.from({ length: selectedCount }, (_, index) => `case-${index}`);

    expect(filter.getPresentationValue()).toBe(expectedValue);
  });

  it('matches every row when no cases are selected', () => {
    const filter = createFilter();

    expect(filter.matchRowValue('case-id')).toBe(true);
  });

  it('matches no row when cases are selected', () => {
    const filter = createFilter();
    filter.filterValue = ['case-id'];

    expect(filter.matchRowValue('case-id')).toBe(false);
  });

  it('does not create a backend filter', () => {
    expect(createFilter().toBackendFilter()).toBeUndefined();
  });
});
