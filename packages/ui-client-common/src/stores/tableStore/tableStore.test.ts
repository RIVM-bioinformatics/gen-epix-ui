import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  NavigateOptions,
  To,
} from 'react-router-dom';
import { container } from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import {
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '../../classes/abstracts/FilterAbstract';
import { TextFilter } from '../../classes/filters/TextFilter';
import type { FilterDimension } from '../../models/filter.models';
import type {
  TableColumn,
  TableColumnDimension,
  TableColumnNumber,
  TableColumnVisualSettings,
} from '../../models/table.models';

import type {
  CreateTableStoreKwArgs,
  TableStore,
} from './tableStore';
import {
  createTableStore,
  createTableStoreInitialState,
  createTableStorePersistConfiguration,
  updateSearchParams,
} from './tableStore';

container.registerInstance(WindowService, WindowService.getInstance());

type TestNavigateFunction = (destination: number | To, options?: NavigateOptions) => void;

interface TestRow {
  age: number;
  id: string;
  name: string;
}

const INITIAL_LOCATION = `${window.location.pathname}${window.location.search}${window.location.hash}`;
const PERSISTED_STORAGE_KEY = 'GENEPIX-TableStore-unit-test';

const createNavigateFunction = () => vi.fn<TestNavigateFunction>();

const createTestStore = (options: Partial<CreateTableStoreKwArgs<TestRow>> = {}) => createTableStore<TestRow>({
  ...options,
  idSelectorCallback: row => row.id,
});

const createTextFilter = (
  id: string,
  filterPriority = DEFAULT_FILTER_GROUP,
  filterMode = FILTER_MODE.FRONTEND,
  filterDimensionId?: string,
) => new TextFilter({
  filterDimensionId,
  filterMode,
  filterPriority,
  id,
  label: id,
});

const createTextColumn = (id: keyof TestRow): TableColumn<TestRow> => ({
  headerName: id,
  id,
  isInitiallyVisible: true,
  type: 'text',
  widthFlex: 1,
});

const createAgeColumn = (): TableColumnNumber<TestRow> => ({
  comparatorFactory: ({ direction }) => (firstRow, secondRow) => {
    return direction === 'asc' ? firstRow.age - secondRow.age : secondRow.age - firstRow.age;
  },
  headerName: 'Age',
  id: 'age',
  isInitiallyVisible: true,
  type: 'number',
  widthFlex: 1,
});

const createVisualSettings = (id: string, isVisible = true): TableColumnVisualSettings => ({
  id,
  isVisible,
  widthFlex: 1,
  widthPx: 120,
});

const createRows = (): TestRow[] => [
  { age: 1, id: 'row-1', name: 'Alice' },
  { age: 2, id: 'row-2', name: 'Amy' },
  { age: 3, id: 'row-3', name: 'Bob' },
];

const setLocation = (url: string) => {
  window.history.replaceState({}, '', url);
};

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState({}, '', INITIAL_LOCATION);
  localStorage.removeItem(PERSISTED_STORAGE_KEY);
});

describe('createTableStoreInitialState', () => {
  it('creates empty table state and preserves configured defaults without navigation', () => {
    const idSelectorCallback = (row: TestRow) => row.id;
    const initialState = createTableStoreInitialState<TestRow>({
      defaultSortByField: 'name',
      defaultSortDirection: 'desc',
      idSelectorCallback,
    });

    expect(initialState).toMatchObject({
      backendFilters: [],
      baseData: [],
      columnDimensions: null,
      columns: [],
      columnVisualSettingsCondensed: null,
      columnVisualSettingsUncondensed: [],
      filteredData: { [DEFAULT_FILTER_GROUP]: [] },
      filters: [],
      frontendFilterPriorities: [DEFAULT_FILTER_GROUP],
      frontendFilters: { [DEFAULT_FILTER_GROUP]: [] },
      selectedIds: [],
      sortByField: 'name',
      sortDirection: 'desc',
      sortedData: [],
      sortedIds: null,
    });
    expect(initialState.idSelectorCallback).toBe(idSelectorCallback);
  });

  it.each(['asc', 'desc'] as const)('reads a valid %s sort direction from the URL', (sortDirection) => {
    setLocation(`/?sortByField=age&sortDirection=${sortDirection}`);
    const navigatorFunction = createNavigateFunction();

    const initialState = createTableStoreInitialState<TestRow>({
      defaultSortByField: 'name',
      defaultSortDirection: 'asc',
      idSelectorCallback: row => row.id,
      navigatorFunction,
    });

    expect(initialState.sortByField).toBe('age');
    expect(initialState.sortDirection).toBe(sortDirection);
    expect(initialState.navigateFunction).toBe(navigatorFunction);
  });

  it('keeps the configured direction when the URL contains an unsupported direction', () => {
    setLocation('/?sortByField=age&sortDirection=sideways');

    const initialState = createTableStoreInitialState<TestRow>({
      defaultSortByField: 'name',
      defaultSortDirection: 'desc',
      idSelectorCallback: row => row.id,
      navigatorFunction: createNavigateFunction(),
    });

    expect(initialState.sortByField).toBe('age');
    expect(initialState.sortDirection).toBe('desc');
  });

  it('keeps configured sort defaults when navigation is available but URL values are absent', () => {
    setLocation('/');

    const initialState = createTableStoreInitialState<TestRow>({
      defaultSortByField: 'name',
      defaultSortDirection: 'asc',
      idSelectorCallback: row => row.id,
      navigatorFunction: createNavigateFunction(),
    });

    expect(initialState.sortByField).toBe('name');
    expect(initialState.sortDirection).toBe('asc');
  });
});

describe('updateSearchParams', () => {
  it('updates and returns the provided search parameters', () => {
    const searchParams = new URLSearchParams('page=1&sort=old');

    const updatedSearchParams = updateSearchParams('sort', 'new', searchParams);

    expect(updatedSearchParams).toBe(searchParams);
    expect(updatedSearchParams.toString()).toBe('page=1&sort=new');
  });

  it('starts with the current document URL when search parameters are omitted', () => {
    setLocation('/cases?page=2');

    const updatedSearchParams = updateSearchParams('sort', 'name');

    expect(updatedSearchParams.toString()).toBe('page=2&sort=name');
    expect(window.location.search).toBe('?page=2');
  });
});

describe('createTableStorePersistConfiguration', () => {
  it('persists the default table presentation state', () => {
    const store = createTestStore();
    const configuration = createTableStorePersistConfiguration<TestRow, null, TableStore<TestRow>>('cases', 4);

    expect(configuration.name).toBe('GENEPIX-TableStore-cases');
    expect(configuration.version).toBe(4);
    expect(configuration.partialize?.(store.getState())).toEqual({
      columnVisualSettingsCondensed: null,
      columnVisualSettingsUncondensed: [],
      isCondensed: false,
      sortByField: undefined,
      sortDirection: undefined,
    });
  });

  it('merges caller-selected fields into the persisted state', () => {
    const store = createTestStore();
    const configuration = createTableStorePersistConfiguration<TestRow, null, TableStore<TestRow>>(
      'cases',
      5,
      state => ({ selectedIds: state.selectedIds }),
    );

    expect(configuration.partialize?.(store.getState())).toMatchObject({
      isCondensed: false,
      selectedIds: [],
    });
  });

  it('persists a store when a storage name suffix is configured', () => {
    localStorage.removeItem(PERSISTED_STORAGE_KEY);
    const store = createTestStore({
      storageNamePostFix: 'unit-test',
      storageVersion: 7,
    });

    store.getState().setIsCondensed(true);

    const persistedState = localStorage.getItem(PERSISTED_STORAGE_KEY);
    expect(persistedState).toContain('"version":7');
    expect(persistedState).toContain('"isCondensed":true');
    expect(persistedState).not.toContain('"selectedIds"');
  });
});

describe('table store state actions', () => {
  it('updates table metadata, selection, navigation, and current visual settings', () => {
    const store = createTestStore();
    const column = createTextColumn('name');
    const columnDimensions: TableColumnDimension[] = [
      { columnIds: ['name'], id: 'person', label: 'Person' },
    ];
    const uncondensedSettings = [createVisualSettings('name')];
    const condensedSettings = [createVisualSettings('name', false)];
    const updatedUncondensedSettings = [createVisualSettings('name', false)];
    const updatedCondensedSettings = [createVisualSettings('name')];
    const navigatorFunction = createNavigateFunction();

    store.getState().setColumns([column]);
    store.getState().setColumnDimensions(columnDimensions);
    store.getState().setColumnVisualSettingsUncondensed(uncondensedSettings);
    store.getState().setColumnVisualSettingsCondensed(condensedSettings);
    store.getState().setSelectedIds(['row-1']);
    store.getState().setSortedIds(['row-2', 'row-1']);
    store.getState().setNavigateFunction(navigatorFunction);

    expect(store.getState().columns).toEqual([column]);
    expect(store.getState().columnDimensions).toBe(columnDimensions);
    expect(store.getState().selectedIds).toEqual(['row-1']);
    expect(store.getState().sortedIds).toEqual(['row-2', 'row-1']);
    expect(store.getState().getCurrentColumnVisualSettings()).toBe(uncondensedSettings);

    store.getState().setCurrentColumnVisualSettings(updatedUncondensedSettings);
    expect(store.getState().columnVisualSettingsUncondensed).toBe(updatedUncondensedSettings);

    store.getState().setIsCondensed(true);
    expect(store.getState().getCurrentColumnVisualSettings()).toBe(condensedSettings);
    store.getState().setCurrentColumnVisualSettings(updatedCondensedSettings);
    expect(store.getState().columnVisualSettingsCondensed).toBe(updatedCondensedSettings);

    store.getState().setIsCondensed(false);
    expect(store.getState().getCurrentColumnVisualSettings()).toBe(updatedUncondensedSettings);
    expect(store.getState().navigateFunction).toBe(navigatorFunction);
  });

  it('creates condensed settings lazily and retains them when toggled repeatedly', () => {
    const store = createTestStore();
    const uncondensedSettings = [createVisualSettings('name')];
    store.getState().setColumns([createTextColumn('name')]);
    store.getState().setColumnVisualSettingsUncondensed(uncondensedSettings);
    store.getState().setColumnVisualSettingsCondensed(null);

    store.getState().setIsCondensed(true);
    const condensedSettings = store.getState().columnVisualSettingsCondensed;

    expect(condensedSettings).toEqual(uncondensedSettings);
    store.getState().setIsCondensed(true);
    expect(store.getState().columnVisualSettingsCondensed).toBe(condensedSettings);

    store.getState().setIsCondensed(false);
    expect(store.getState().columnVisualSettingsCondensed).toBe(condensedSettings);
  });

  it('resets column settings for both expanded and condensed layouts', () => {
    const store = createTestStore();
    store.getState().setColumns([createTextColumn('name')]);
    store.getState().setColumnVisualSettingsUncondensed([createVisualSettings('stale')]);
    store.getState().setColumnVisualSettingsCondensed([createVisualSettings('stale')]);

    store.getState().resetColumns();

    expect(store.getState().columnVisualSettingsUncondensed.map(setting => setting.id)).toEqual(['name']);
    expect(store.getState().columnVisualSettingsCondensed).toBeNull();

    store.getState().setIsCondensed(true);
    store.getState().resetColumns();

    expect(store.getState().columnVisualSettingsCondensed.map(setting => setting.id)).toEqual(['name']);
  });

  it('selects and unselects IDs without duplicating or removing unrelated values', () => {
    const store = createTestStore();
    store.getState().setSelectedIds(['row-1']);

    store.getState().selectId('row-1');
    store.getState().selectId('row-2');
    expect(store.getState().selectedIds).toEqual(['row-1', 'row-2']);

    store.getState().unselectId('missing');
    store.getState().unselectId('row-1');
    expect(store.getState().selectedIds).toEqual(['row-2']);
  });

  it('merges one visible filter and replaces the complete visibility map', () => {
    const store = createTestStore();

    store.getState().setVisibleFilterWithinDimension('person', 'name');
    store.getState().setVisibleFilterWithinDimension('date', 'created');
    expect(store.getState().visibleFilterWithinDimensions).toEqual({
      date: 'created',
      person: 'name',
    });

    const replacement = { person: 'identifier' };
    store.getState().setVisibleFilterWithinDimensions(replacement);
    expect(store.getState().visibleFilterWithinDimensions).toBe(replacement);
  });
});

describe('table store initialization and events', () => {
  it('initializes with missing visual settings and omits absent sort values from the URL', async () => {
    setLocation('/');
    const navigatorFunction = createNavigateFunction();
    const store = createTestStore({ navigatorFunction });
    const abortController = new AbortController();
    const destroyListener = vi.fn();
    store.getState().addEventListener('destroy', destroyListener);

    await store.getState().initialize(abortController.signal);

    expect(store.getState().globalAbortSignal).toBe(abortController.signal);
    expect(store.getState().isInitialized).toBe(true);
    expect(store.getState().columnVisualSettingsUncondensed).toEqual([]);
    expect(store.getState().columnVisualSettingsCondensed).toBeNull();
    expect(navigatorFunction).not.toHaveBeenCalled();

    abortController.abort();
    expect(destroyListener).toHaveBeenCalledOnce();
  });

  it('keeps valid visual settings and synchronizes configured sort values', async () => {
    const navigatorFunction = createNavigateFunction();
    const store = createTestStore({
      defaultSortByField: 'age',
      defaultSortDirection: 'desc',
      navigatorFunction,
    });
    const columns = [createAgeColumn()];
    const visualSettings = [createVisualSettings('age')];
    store.setState({
      columns,
      columnVisualSettingsCondensed: visualSettings,
      columnVisualSettingsUncondensed: visualSettings,
    });

    await store.getState().initialize(new AbortController().signal);

    expect(store.getState().columnVisualSettingsCondensed).toBe(visualSettings);
    expect(store.getState().columnVisualSettingsUncondensed).toBe(visualSettings);
    expect(navigatorFunction).toHaveBeenCalledTimes(2);
  });

  it('creates condensed settings when condensed mode is active and settings are missing', async () => {
    const store = createTestStore();
    const columns = [createTextColumn('name')];
    const uncondensedSettings = [createVisualSettings('name')];
    store.setState({
      columns,
      columnVisualSettingsCondensed: null,
      columnVisualSettingsUncondensed: uncondensedSettings,
      isCondensed: true,
    });

    await store.getState().initialize(new AbortController().signal);

    expect(store.getState().columnVisualSettingsCondensed).toEqual(uncondensedSettings);
  });

  it('emits destroy before removing event listeners', () => {
    const store = createTestStore();
    const destroyListener = vi.fn();
    const resetListener = vi.fn();

    store.getState().addEventListener('destroy', destroyListener);
    store.getState().addEventListener('reset', resetListener);
    store.getState().destroy();

    expect(destroyListener).toHaveBeenCalledOnce();

    store.getState().emitEvent('destroy');
    store.getState().emitEvent('reset');
    expect(destroyListener).toHaveBeenCalledOnce();
    expect(resetListener).not.toHaveBeenCalled();
  });
});

describe('table store filtering and data actions', () => {
  it('filters base data, skips initial filter values, and refreshes sorted data', async () => {
    const store = createTestStore();
    const initialFilter = createTextFilter('id');
    const nameFilter = createTextFilter('name');
    nameFilter.setFilterValue('a');
    const rows = createRows();

    store.getState().setColumns([createTextColumn('id'), createTextColumn('name')]);
    store.getState().setFilters([initialFilter, nameFilter], [], [DEFAULT_FILTER_GROUP]);
    store.getState().setBaseData(rows);

    expect(store.getState().filteredData[DEFAULT_FILTER_GROUP]).toEqual(rows.slice(0, 2));
    expect(store.getState().sortedData).toEqual(rows.slice(0, 2));

    await store.getState().fetchData();
    expect(store.getState().sortedData).toEqual(rows.slice(0, 2));
  });

  it('uses a column value getter with its row context and index', () => {
    const store = createTestStore();
    const filter = createTextFilter('name');
    filter.setFilterValue('1:');
    const valueGetter = vi.fn(({ row, rowIndex }: { row: TestRow; rowIndex: number }) => `${rowIndex}:${row.name}`);
    const column: TableColumn<TestRow> = {
      headerName: 'Name',
      id: 'name',
      isInitiallyVisible: true,
      type: 'text',
      valueGetter,
    };
    const rows = createRows().slice(0, 2);
    store.setState({
      columns: [column],
      frontendFilters: { [DEFAULT_FILTER_GROUP]: [filter] },
    });

    expect(store.getState().reloadFilterPriorityData(DEFAULT_FILTER_GROUP, rows)).toEqual([rows[1]]);
    expect(valueGetter).toHaveBeenCalledTimes(2);
    expect(valueGetter).toHaveBeenCalledWith(expect.objectContaining({
      dataContext: null,
      row: rows[1],
      rowIndex: 1,
    }));
  });

  it('recomputes from the changed frontend priority and updates selected IDs', async () => {
    const store = createTestStore();
    const nameFilter = createTextFilter('name', 'first');
    const initialIdFilter = createTextFilter('id', 'first');
    const ageFilter = createTextFilter('age', 'second');
    nameFilter.setFilterValue('A');
    const rows = createRows();
    const nameFilterColumn = createTextColumn('name');
    const idFilterColumn = createTextColumn('id');
    const ageFilterColumn = createTextColumn('age');

    store.getState().setColumns([nameFilterColumn, idFilterColumn, ageFilterColumn]);
    store.getState().setFilters(
      [nameFilter, initialIdFilter, ageFilter],
      [],
      ['first', 'second'],
    );
    expect(store.getState().frontendFilters).toEqual({
      first: [nameFilter, initialIdFilter],
      second: [ageFilter],
    });
    store.getState().setBaseData(rows);
    store.getState().setSelectedIds(['row-1', 'row-2', 'row-3', 'missing']);

    await store.getState().setFilterValues({ age: '2', name: undefined });

    expect(store.getState().filteredData.first).toEqual(rows.slice(0, 2));
    expect(store.getState().filteredData.second).toEqual([rows[1]]);
    expect(store.getState().sortedData).toEqual([rows[1]]);
    expect(store.getState().selectedIds).toEqual(['row-2']);
  });

  it('sets backend filters and groups frontend filters by priority', () => {
    const store = createTestStore();
    const backendFilter = createTextFilter('backend', DEFAULT_FILTER_GROUP, FILTER_MODE.BACKEND);
    const firstFrontendFilter = createTextFilter('first', 'first');
    const secondFrontendFilter = createTextFilter('second', 'second');
    const dimensions: FilterDimension[] = [
      {
        allowMultipleVisibleFilters: false,
        allowOnlyPreferredFilter: false,
        description: 'Person filters',
        filterIds: ['first'],
        id: 'person',
        label: 'Person',
        preferredFilterId: 'first',
      },
    ];

    store.getState().setFilters(
      [backendFilter, firstFrontendFilter, secondFrontendFilter],
      dimensions,
      ['first', 'second'],
    );

    expect(store.getState().backendFilters).toEqual([backendFilter]);
    expect(store.getState().frontendFilters).toEqual({
      first: [firstFrontendFilter],
      second: [secondFrontendFilter],
    });
    expect(store.getState().filterDimensions).toBe(dimensions);
  });

  it('reads non-empty filter values from the URL and ignores empty ones', () => {
    setLocation('/?name=%22Alice%22&id=');
    const store = createTestStore({ navigatorFunction: createNavigateFunction() });
    const nameFilter = createTextFilter('name');
    const idFilter = createTextFilter('id');

    store.getState().setFilters([nameFilter, idFilter], [], [DEFAULT_FILTER_GROUP]);

    expect(nameFilter.filterValue).toBe('Alice');
    expect(idFilter.filterValue).toBe('');
  });

  it('updates multiple filter URL values together and removes filters restored to their initial value', async () => {
    setLocation('/?keep=1&name=%22old%22&age=');
    const navigatorFunction = createNavigateFunction();
    const store = createTestStore({ navigatorFunction });
    const nameFilter = createTextFilter('name');
    const ageFilter = createTextFilter('age');

    store.getState().setFilters([nameFilter, ageFilter], [], [DEFAULT_FILTER_GROUP]);
    await store.getState().setFilterValues({ age: '', name: 'Alice' });

    expect(navigatorFunction).toHaveBeenCalledOnce();
    const navigatedTo = navigatorFunction.mock.calls[0]?.[0];
    if (typeof navigatedTo !== 'string') {
      throw new TypeError('Expected navigation to receive a URL string.');
    }
    const searchParams = new URL(navigatedTo, window.location.origin).searchParams;
    expect(searchParams.get('keep')).toBe('1');
    expect(searchParams.get('name')).toBe('"Alice"');
    expect(searchParams.has('age')).toBe(false);
  });

  it('fetches data when backend filter values change', async () => {
    const store = createTestStore();
    const backendFilter = createTextFilter('name', DEFAULT_FILTER_GROUP, FILTER_MODE.BACKEND);
    const fetchData = vi.fn();
    const reloadFilterData = vi.fn();
    const reloadSelectedIds = vi.fn();
    store.getState().setFilters([backendFilter], [], [DEFAULT_FILTER_GROUP]);
    store.setState({
      fetchData,
      reloadFilterData,
      reloadSelectedIds,
    });

    await store.getState().setFilterValues({ name: 'Alice' });

    expect(fetchData).toHaveBeenCalledOnce();
    expect(reloadFilterData).not.toHaveBeenCalled();
    expect(reloadSelectedIds).not.toHaveBeenCalled();
  });

  it('sets a filter in its dimension and resets its sibling filters', async () => {
    const store = createTestStore();
    const firstFilter = createTextFilter('name', DEFAULT_FILTER_GROUP, FILTER_MODE.FRONTEND, 'person');
    const secondFilter = createTextFilter('age', DEFAULT_FILTER_GROUP, FILTER_MODE.FRONTEND, 'person');
    secondFilter.setFilterValue('existing');
    const dimension: FilterDimension = {
      allowMultipleVisibleFilters: false,
      allowOnlyPreferredFilter: false,
      description: 'Person filters',
      filterIds: ['name', 'age'],
      id: 'person',
      label: 'Person',
      preferredFilterId: 'name',
    };
    store.getState().setColumns([createTextColumn('name'), createTextColumn('age')]);
    store.getState().setFilters([firstFilter, secondFilter], [dimension], [DEFAULT_FILTER_GROUP]);

    await store.getState().setFilterValue('name', 'selected');

    expect(firstFilter.filterValue).toBe('selected');
    expect(secondFilter.filterValue).toBe('');
    expect(store.getState().visibleFilterWithinDimensions).toEqual({ person: 'name' });
  });

  it('leaves existing filter values unchanged when an unknown filter ID is set', async () => {
    const store = createTestStore();
    const filter = createTextFilter('name');
    filter.setFilterValue('Alice');
    store.getState().setFilters([filter], [], [DEFAULT_FILTER_GROUP]);

    await store.getState().setFilterValue('missing', 'value');

    expect(filter.filterValue).toBe('Alice');
  });

  it('resets filters to their initial values', async () => {
    const store = createTestStore();
    const filter = createTextFilter('name');
    filter.setFilterValue('Alice');
    const rows = createRows();
    store.getState().setColumns([createTextColumn('name')]);
    store.getState().setFilters([filter], [], [DEFAULT_FILTER_GROUP]);
    store.getState().setBaseData(rows);

    await store.getState().resetFilters();

    expect(filter.filterValue).toBe('');
    expect(store.getState().filteredData[DEFAULT_FILTER_GROUP]).toEqual(rows);
  });
});

describe('table store sorting actions', () => {
  it('uses the filtered data when there is no active sort', () => {
    const store = createTestStore();
    const rows = createRows();
    store.setState({ filteredData: { [DEFAULT_FILTER_GROUP]: rows } });

    store.getState().reloadSortedData();

    expect(store.getState().sortedData).toBe(rows);
  });

  it('sorts rows with a column comparator in the requested direction', async () => {
    const store = createTestStore();
    const rows = createRows();
    store.setState({
      columns: [createAgeColumn()],
      filteredData: { [DEFAULT_FILTER_GROUP]: rows },
      sortByField: 'age',
      sortDirection: 'asc',
    });

    store.getState().reloadSortedData();
    expect(store.getState().sortedData.map(row => row.id)).toEqual(['row-1', 'row-2', 'row-3']);

    await store.getState().setSorting('age', 'desc');
    expect(store.getState().sortedData.map(row => row.id)).toEqual(['row-3', 'row-2', 'row-1']);
  });

  it('preserves row order if a comparator factory is removed during sorting', () => {
    const store = createTestStore();
    const rows = createRows();
    const column: TableColumnNumber<TestRow> = {
      comparatorFactory: () => {
        column.comparatorFactory = undefined;
        return () => -1;
      },
      headerName: 'Age',
      id: 'age',
      isInitiallyVisible: true,
      type: 'number',
      widthFlex: 1,
    };
    store.setState({
      columns: [column],
      filteredData: { [DEFAULT_FILTER_GROUP]: rows },
      sortByField: 'age',
      sortDirection: 'asc',
    });

    store.getState().reloadSortedData();

    expect(store.getState().sortedData.map(row => row.id)).toEqual(['row-1', 'row-2', 'row-3']);
  });

  it('falls back to default sorting when the requested column is unavailable', () => {
    const store = createTestStore({
      defaultSortByField: 'age',
      defaultSortDirection: 'desc',
    });
    const rows = createRows();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    store.setState({
      columns: [createAgeColumn()],
      filteredData: { [DEFAULT_FILTER_GROUP]: rows },
      sortByField: 'missing',
      sortDirection: 'asc',
    });

    store.getState().reloadSortedData();

    expect(warning).toHaveBeenCalledOnce();
    expect(store.getState().sortedData.map(row => row.id)).toEqual(['row-3', 'row-2', 'row-1']);
  });

  it('keeps filtered order when neither requested nor default sort columns have comparators', () => {
    const store = createTestStore();
    const rows = createRows();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    store.setState({
      columns: [],
      filteredData: { [DEFAULT_FILTER_GROUP]: rows },
      sortByField: 'missing',
      sortDirection: 'asc',
    });

    store.getState().reloadSortedData();

    expect(warning).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    expect(store.getState().sortedData).toBe(rows);
  });

  it('sorts by selected IDs and places IDs absent from the order list last', () => {
    const store = createTestStore();
    const rows = createRows();
    store.setState({
      filteredData: { [DEFAULT_FILTER_GROUP]: rows },
      sortedIds: ['row-3', 'row-1'],
    });

    store.getState().reloadSortedData();

    expect(store.getState().sortedData.map(row => row.id)).toEqual(['row-3', 'row-1', 'row-2']);
  });

  it('updates sort state and invokes navigation when a sort is selected', async () => {
    const navigatorFunction = createNavigateFunction();
    const store = createTestStore();
    const rows = createRows();
    store.getState().setNavigateFunction(navigatorFunction);
    store.setState({
      columns: [createAgeColumn()],
      filteredData: { [DEFAULT_FILTER_GROUP]: rows },
    });

    await store.getState().setSorting('age', 'desc');

    expect(navigatorFunction).toHaveBeenCalledTimes(2);
    expect(store.getState().sortByField).toBe('age');
    expect(store.getState().sortDirection).toBe('desc');
    expect(store.getState().sortedData.map(row => row.id)).toEqual(['row-3', 'row-2', 'row-1']);
  });

  it('updates the current URL path when navigation is configured', async () => {
    setLocation('/cases?existing=1');
    const navigatorFunction = createNavigateFunction();
    const store = createTestStore();
    store.getState().setNavigateFunction(navigatorFunction);

    await store.getState().updateUrl(new URLSearchParams('page=2'));

    expect(navigatorFunction).toHaveBeenCalledExactlyOnceWith('/cases?page=2', { replace: true });
  });
});
