import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  act,
  renderHook,
} from '@testing-library/react';

import { DEFAULT_FILTER_GROUP } from '../../classes/abstracts/FilterAbstract';
import type {
  FilterDimension,
  Filters,
} from '../../models/filter.models';
import type { TableColumn } from '../../models/table.models';
import { createTableStore } from '../../stores/tableStore';
import { TableUtil } from '../../utils/TableUtil';

import { useInitializeTableStore } from './useInitializeTableStore';

type TestRow = {
  id: string;
};

const MISSING_TABLE_INPUT_CASES: Array<[null | TableColumn<TestRow>[], null | TestRow[]]> = [
  [null, []],
  [[], null],
];

const createTestStore = () => {
  const store = createTableStore<TestRow>({
    idSelectorCallback: row => row.id,
  });
  const setColumns = vi.fn((_columns: TableColumn<TestRow>[]) => undefined);
  const setBaseData = vi.fn((_rows: TestRow[]) => undefined);
  const setFilters = vi.fn((_filters: Filters, _dimensions: FilterDimension[], _priorities: string[]) => undefined);
  const initialize = vi.fn(async (_signal: AbortSignal) => Promise.resolve());
  store.setState({
    initialize,
    setBaseData,
    setColumns,
    setFilters,
  });

  return {
    initialize,
    setBaseData,
    setColumns,
    setFilters,
    store,
  };
};

describe('useInitializeTableStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets columns and base data and initializes the store with an abort signal', () => {
    const { initialize, setBaseData, setColumns, store } = createTestStore();
    const columns: TableColumn<TestRow>[] = [];
    const rows: TestRow[] = [{ id: 'row-1' }];
    const { unmount } = renderHook(() => useInitializeTableStore({
      columns,
      rows,
      store,
    }));
    const signal = initialize.mock.calls[0]?.[0];

    expect(setColumns).toHaveBeenCalledExactlyOnceWith(columns);
    expect(setBaseData).toHaveBeenCalledExactlyOnceWith(rows);
    expect(initialize).toHaveBeenCalledOnce();
    expect(signal).toBeInstanceOf(AbortSignal);

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it('creates column filters and assigns the default filter group when requested', () => {
    const { setFilters, store } = createTestStore();
    const columns: TableColumn<TestRow>[] = [];
    const rows: TestRow[] = [{ id: 'row-1' }];
    const filters: Filters = [];
    const createFiltersSpy = vi.spyOn(TableUtil, 'createFiltersFromColumns').mockReturnValue(filters);

    renderHook(() => useInitializeTableStore({
      columns,
      context: null,
      createFiltersFromColumns: true,
      rows,
      store,
    }));

    expect(createFiltersSpy).toHaveBeenCalledExactlyOnceWith(columns, rows, null);
    expect(setFilters).toHaveBeenCalledExactlyOnceWith(filters, [], [DEFAULT_FILTER_GROUP]);
  });

  it('skips filter creation unless requested', () => {
    const { setFilters, store } = createTestStore();
    const createFiltersSpy = vi.spyOn(TableUtil, 'createFiltersFromColumns');

    renderHook(() => useInitializeTableStore({
      columns: [],
      rows: [],
      store,
    }));

    expect(createFiltersSpy).not.toHaveBeenCalled();
    expect(setFilters).not.toHaveBeenCalled();
  });

  it.each(MISSING_TABLE_INPUT_CASES)('does not initialize when columns or rows are missing', (columns, rows) => {
    const { initialize, setBaseData, setColumns, store } = createTestStore();

    renderHook(() => useInitializeTableStore({
      columns,
      rows,
      store,
    }));

    expect(setColumns).not.toHaveBeenCalled();
    expect(setBaseData).not.toHaveBeenCalled();
    expect(initialize).not.toHaveBeenCalled();
  });

  it('aborts the previous initialization before rerunning the effect', () => {
    const { initialize, store } = createTestStore();
    const columns: TableColumn<TestRow>[] = [];
    const { rerender, unmount } = renderHook(
      ({ rows }: { rows: TestRow[] }) => useInitializeTableStore({
        columns,
        rows,
        store,
      }),
      { initialProps: { rows: [{ id: 'row-1' }] } },
    );
    const firstSignal = initialize.mock.calls[0]?.[0];

    act(() => {
      rerender({ rows: [{ id: 'row-2' }] });
    });

    const secondSignal = initialize.mock.calls[1]?.[0];
    expect(initialize).toHaveBeenCalledTimes(2);
    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);

    unmount();

    expect(secondSignal?.aborted).toBe(true);
  });
});
