import {
  describe,
  expect,
  it,
} from 'vitest';
import { page } from 'vitest/browser';

import type { TableEvent } from '../../../classes/TableEventBus';
import type {
  TableColumn,
  TableColumnDimension,
} from '../../../models/table.models';
import { TABLE_COLUMN_FROZEN } from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableMenu } from './TableMenu';

type TestRow = {
  id: string;
  name: string;
};

type TestStore = ReturnType<typeof createTableStore<TestRow>>;

const createColumns = ({ withCellColor = true }: { withCellColor?: boolean } = {}): TableColumn<TestRow>[] => [
  {
    ...(withCellColor ? { cellColorGetter: () => 'rgb(255, 0, 0)' } : {}),
    headerName: 'Name',
    id: 'name',
    isInitiallyVisible: true,
    type: 'text',
    valueGetter: ({ row }) => row.name,
  },
  {
    headerName: 'Age',
    id: 'age',
    isInitiallyVisible: false,
    type: 'text',
    valueGetter: () => undefined,
  },
  {
    frozen: TABLE_COLUMN_FROZEN.LEFT,
    headerName: 'Select',
    id: 'select',
    isInitiallyVisible: true,
    type: 'text',
    valueGetter: () => undefined,
  },
];

const createStore = async ({
  columns = createColumns(),
  dimensions,
  isCondensed = false,
}: {
  columns?: TableColumn<TestRow>[];
  dimensions?: TableColumnDimension[];
  isCondensed?: boolean;
} = {}): Promise<TestStore> => {
  const store = createTableStore<TestRow>({
    defaultSortByField: 'name',
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: () => true,
  });
  store.getState().setColumns(columns);
  if (dimensions) {
    store.getState().setColumnDimensions(dimensions);
  }
  store.getState().setBaseData([{ id: 'row-0', name: 'Name 0' }]);
  store.getState().setIsCondensed(isCondensed);
  await store.getState().initialize(new AbortController().signal);
  return store;
};

const listenTo = <TName extends keyof TableEvent<TestRow>>(store: TestStore, eventName: TName) => {
  const payloads: TableEvent<TestRow>[TName][] = [];
  store.getState().eventBus.addEventListener(eventName, (payload) => {
    payloads.push(payload);
  });
  return payloads;
};

const sortedIds = (ids: string[]) => [...ids].sort();

const renderMenu = async (store: TestStore) => {
  await renderComponent(
    <TableStoreContextProvider store={store}>
      <TableMenu />
    </TableStoreContextProvider>,
  );
  await page.getByRole('button', { name: 'Columns' }).click();
};

describe('TableMenu', () => {
  it('should render a button labeled Columns that opens the menu', async () => {
    const store = await createStore();
    await renderMenu(store);

    await expect.element(page.getByRole('menuitem', { name: 'Column editor' })).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'Reset' })).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'Show all' })).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'Hide all' })).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'Hide columns without data' })).toBeVisible();
  });

  it('should emit openColumnsEditorDialog when the column editor is clicked', async () => {
    const store = await createStore();
    const dialogEvents = listenTo(store, 'openColumnsEditorDialog');
    await renderMenu(store);

    await page.getByRole('menuitem', { name: 'Column editor' }).click();

    expect(dialogEvents).toHaveLength(1);
  });

  it('should emit reset when reset is clicked', async () => {
    const store = await createStore();
    const resetEvents = listenTo(store, 'reset');
    await renderMenu(store);

    await page.getByRole('menuitem', { name: 'Reset' }).click();

    expect(resetEvents).toHaveLength(1);
  });

  it('should emit all column ids as visible when show all is clicked', async () => {
    const store = await createStore();
    const visibilityEvents = listenTo(store, 'columnVisibilityChange');
    await renderMenu(store);

    await page.getByRole('menuitem', { name: 'Show all' }).click();

    expect(visibilityEvents).toEqual([['name', 'age', 'select']]);
  });

  it('should emit only the frozen column ids as visible when hide all is clicked', async () => {
    const store = await createStore();
    const visibilityEvents = listenTo(store, 'columnVisibilityChange');
    await renderMenu(store);

    await page.getByRole('menuitem', { name: 'Hide all' }).click();

    expect(visibilityEvents).toEqual([['select']]);
  });

  it('should emit the visible columns that have data when hide columns without data is clicked', async () => {
    const store = await createStore();
    const visibilityEvents = listenTo(store, 'columnVisibilityChange');
    await renderMenu(store);

    await page.getByRole('menuitem', { name: 'Hide columns without data' }).click();

    expect(visibilityEvents).toHaveLength(1);
    expect(visibilityEvents[0]).not.toContain('age');
    expect(visibilityEvents[0]).toContain('name');
  });

  it('should emit a toggled column visibility when a column is clicked', async () => {
    const store = await createStore();
    const visibilityEvents = listenTo(store, 'columnVisibilityChange');
    await renderMenu(store);

    await page.getByRole('menuitemcheckbox', { name: 'Age' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Name' }).click();

    expect(visibilityEvents).toHaveLength(2);
    expect(sortedIds(visibilityEvents[0])).toEqual(['age', 'name', 'select']);
    expect(sortedIds(visibilityEvents[1])).toEqual(['select']);
  });

  it('should emit true when condensed is clicked while not condensed', async () => {
    const store = await createStore();
    const condensedEvents = listenTo(store, 'condensedChange');
    await renderMenu(store);

    await page.getByRole('menuitemcheckbox', { name: 'Condensed' }).click();

    expect(condensedEvents).toEqual([true]);
  });

  it('should emit false when condensed is clicked while condensed', async () => {
    const store = await createStore({ isCondensed: true });
    const condensedEvents = listenTo(store, 'condensedChange');
    await renderMenu(store);

    await page.getByRole('menuitemcheckbox', { name: 'Condensed' }).click();

    expect(condensedEvents).toEqual([false]);
  });

  it('should not show the condensed toggle when no column supports cell colors', async () => {
    const store = await createStore({ columns: createColumns({ withCellColor: false }) });
    await renderMenu(store);

    await expect.element(page.getByRole('menuitem', { name: 'Column editor' })).toBeVisible();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Condensed' })).not.toBeInTheDocument();
  });

  it('should add all missing dimension columns when a partially visible dimension is clicked', async () => {
    const store = await createStore({
      dimensions: [
        { columnIds: ['name', 'age'], id: 'demographics', label: 'Demographics' },
      ],
    });
    const visibilityEvents = listenTo(store, 'columnVisibilityChange');
    await renderMenu(store);

    await page.getByRole('menuitemcheckbox', { name: 'Demographics' }).click();

    expect(visibilityEvents).toHaveLength(1);
    expect(sortedIds(visibilityEvents[0])).toEqual(['age', 'name', 'select']);
  });

  it('should remove all dimension columns when a fully visible dimension is clicked', async () => {
    const store = await createStore({
      dimensions: [
        { columnIds: ['name', 'select'], id: 'visible', label: 'Visible' },
      ],
    });
    const visibilityEvents = listenTo(store, 'columnVisibilityChange');
    await renderMenu(store);

    await page.getByRole('menuitemcheckbox', { name: 'Visible' }).click();

    expect(visibilityEvents).toEqual([[]]);
  });

  it('should toggle a single column inside a dimension', async () => {
    const store = await createStore({
      dimensions: [
        { columnIds: ['name', 'age'], id: 'demographics', label: 'Demographics' },
      ],
    });
    const visibilityEvents = listenTo(store, 'columnVisibilityChange');
    await renderMenu(store);

    await page.getByRole('menuitemcheckbox', { name: 'Demographics' }).hover();
    await page.getByRole('menuitemcheckbox', { name: 'Age' }).click();

    expect(visibilityEvents).toHaveLength(1);
    expect(sortedIds(visibilityEvents[0])).toEqual(['age', 'name', 'select']);
  });
});
