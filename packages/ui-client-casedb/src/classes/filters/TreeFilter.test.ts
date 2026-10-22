import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import i18next from 'i18next';
import { FILTER_MODE } from '@gen-epix/ui-client-common/classes/abstracts/FilterAbstract';

import { TreeFilter } from './TreeFilter';

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          'Selected tree node ({{nodeName}})': 'Selected tree node ({{nodeName}})',
        },
      },
    },
  });
});

const createFilter = (): TreeFilter => new TreeFilter({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: 'priority',
  id: 'tree-filter',
  label: 'Tree',
});

describe('TreeFilter', () => {
  it('initializes without an active node and hides in the sidebar', () => {
    const filter = createFilter();

    expect(filter.filterValue).toBeNull();
    expect(filter.initialFilterValue).toBeNull();
    expect(filter.showInSidebar).toBe(false);
  });

  it.each([
    [null, 'Selected tree node ()'],
    ['node-a', 'Selected tree node (node-a)'],
  ])('presents the selected tree node %s', (nodeName, expectedValue) => {
    const filter = createFilter();
    filter.filterValue = nodeName;

    expect(filter.getPresentationValue()).toBe(expectedValue);
  });

  it('does not exclude any row values', () => {
    const filter = createFilter();

    expect(filter.matchRowValue()).toBe(true);
  });

  it('does not create a backend filter', () => {
    expect(createFilter().toBackendFilter()).toBeUndefined();
  });
});
