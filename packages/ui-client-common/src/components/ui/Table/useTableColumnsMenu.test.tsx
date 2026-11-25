import {
  describe,
  expect,
  it,
} from 'vitest';
import { page } from 'vitest/browser';
import type { MenuItemData } from '@gen-epix/ui-core-components/models/nested-menu.models';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import type { TableEvent } from '../../../classes/TableEventBus';
import type {
  HasCellDataFn,
  TableColumn,
  TableColumnDimension,
} from '../../../models/table.models';
import { TABLE_COLUMN_FROZEN } from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { useTableColumnsMenu } from './useTableColumnsMenu';

type TestRow = {
  id: string;
  name: string;
};

type TestStore = ReturnType<typeof createTableStore<TestRow>>;

const createColumns = ({
  ageVisible = false,
  nameVisible = true,
  withCellColor = true,
}: {
  ageVisible?: boolean;
  nameVisible?: boolean;
  withCellColor?: boolean;
} = {}): TableColumn<TestRow>[] => [
  {
    ...(withCellColor ? { cellColorGetter: () => 'rgb(255, 0, 0)' } : {}),
    headerName: 'Name',
    id: 'name',
    isInitiallyVisible: nameVisible,
    type: 'text',
    valueGetter: ({ row }) => row.name,
  },
  {
    headerName: 'Age',
    id: 'age',
    isInitiallyVisible: ageVisible,
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

const renderMenuItems = (idPrefix: string, items: MenuItemData[]) => (
  <ul>
    {items.map((item) => {
      const itemId = `${idPrefix}-${item.label}`;
      return (
        <li key={itemId}>
          <button
            type={'button'}
            {...TestIdUtil.createAttributes(itemId)}
            data-checked={item.checked}
            onClick={item.callback}
          >
            {item.label}
            {item.rightIcon}
          </button>
          {item.items && renderMenuItems(itemId, item.items)}
        </li>
      );
    })}
  </ul>
);

const UseTableColumnsMenuHarness = ({
  hasCellData,
}: {
  readonly hasCellData?: HasCellDataFn<TestRow>;
}) => {
  const menu = useTableColumnsMenu<TestRow>({ hasCellData });
  return (
    <div>
      <h2>
        {menu.label}
      </h2>
      {renderMenuItems('menu', menu.items ?? [])}
    </div>
  );
};

const renderHook = async (store: TestStore, hasCellData?: HasCellDataFn<TestRow>) => {
  await renderComponent(
    <TableStoreContextProvider store={store}>
      <UseTableColumnsMenuHarness hasCellData={hasCellData} />
    </TableStoreContextProvider>,
  );
};

const getMenuItem = (itemId: string) => page.getByTestId(itemId);

describe('useTableColumnsMenu', () => {
  it('should render the default menu items without the condensed toggle when no column supports condensing', async () => {
    const store = await createStore({ columns: createColumns({ withCellColor: false }) });
    await renderHook(store);

    await expect.element(page.getByRole('heading', { name: 'Columns' })).toBeInTheDocument();
    await expect.element(getMenuItem('menu-Column editor')).toBeInTheDocument();
    await expect.element(getMenuItem('menu-Reset')).toBeInTheDocument();
    await expect.element(getMenuItem('menu-Show all')).toBeInTheDocument();
    await expect.element(getMenuItem('menu-Hide all')).toBeInTheDocument();
    await expect.element(getMenuItem('menu-Hide columns without data')).toBeInTheDocument();
    await expect.element(getMenuItem('menu-Condensed')).not.toBeInTheDocument();
    await expect.element(getMenuItem('menu-Name')).toHaveAttribute('data-checked', 'true');
    await expect.element(getMenuItem('menu-Age')).toHaveAttribute('data-checked', 'false');
    await expect.element(getMenuItem('menu-Select')).not.toBeInTheDocument();
  });

  it('should show the condensed toggle unchecked and emit condensedChange when clicked', async () => {
    const store = await createStore({ isCondensed: false });
    const condensedChangePayloads = listenTo(store, 'condensedChange');
    await renderHook(store);

    await expect.element(getMenuItem('menu-Condensed')).toHaveAttribute('data-checked', 'false');
    await getMenuItem('menu-Condensed').click();

    expect(condensedChangePayloads).toEqual([true]);
  });

  it('should show the condensed toggle checked and emit condensedChange with false when condensed', async () => {
    const store = await createStore({ isCondensed: true });
    const condensedChangePayloads = listenTo(store, 'condensedChange');
    await renderHook(store);

    await expect.element(getMenuItem('menu-Condensed')).toHaveAttribute('data-checked', 'true');
    await getMenuItem('menu-Condensed').click();

    expect(condensedChangePayloads).toEqual([false]);
  });

  it('should emit openColumnsEditorDialog with the hasCellData callback when the column editor is clicked', async () => {
    const store = await createStore();
    const openColumnsEditorDialogPayloads = listenTo(store, 'openColumnsEditorDialog');
    const hasCellData = () => true;
    await renderHook(store, hasCellData);

    await getMenuItem('menu-Column editor').click();

    expect(openColumnsEditorDialogPayloads).toHaveLength(1);
    expect(openColumnsEditorDialogPayloads[0]).toBe(hasCellData);
  });

  it('should emit reset when reset is clicked', async () => {
    const store = await createStore();
    const resetPayloads = listenTo(store, 'reset');
    await renderHook(store);

    await getMenuItem('menu-Reset').click();

    expect(resetPayloads).toHaveLength(1);
  });

  it('should emit all column ids when show all is clicked', async () => {
    const store = await createStore();
    const columnVisibilityChangePayloads = listenTo(store, 'columnVisibilityChange');
    await renderHook(store);

    await getMenuItem('menu-Show all').click();

    expect(columnVisibilityChangePayloads).toEqual([['name', 'age', 'select']]);
  });

  it('should emit only frozen column ids when hide all is clicked', async () => {
    const store = await createStore();
    const columnVisibilityChangePayloads = listenTo(store, 'columnVisibilityChange');
    await renderHook(store);

    await getMenuItem('menu-Hide all').click();

    expect(columnVisibilityChangePayloads).toEqual([['select']]);
  });

  it('should toggle an individual column on or off when its item is clicked', async () => {
    const store = await createStore();
    const columnVisibilityChangePayloads = listenTo(store, 'columnVisibilityChange');
    await renderHook(store);

    await getMenuItem('menu-Age').click();
    await getMenuItem('menu-Name').click();

    expect(columnVisibilityChangePayloads).toEqual([
      ['name', 'select', 'age'],
      ['select'],
    ]);
  });

  it('should emit only frozen column ids when hide columns without data is clicked and no cell has data', async () => {
    const store = await createStore();
    const columnVisibilityChangePayloads = listenTo(store, 'columnVisibilityChange');
    await renderHook(store, () => false);

    await getMenuItem('menu-Hide columns without data').click();

    expect(columnVisibilityChangePayloads).toEqual([['select']]);
  });

  it('should keep columns with data when hide columns without data is clicked', async () => {
    const store = await createStore();
    const columnVisibilityChangePayloads = listenTo(store, 'columnVisibilityChange');
    await renderHook(store, (_row, column) => column.id === 'name');

    await getMenuItem('menu-Hide columns without data').click();

    expect(columnVisibilityChangePayloads).toEqual([['name', 'select']]);
  });

  it('should group columns under a mixed dimension item when only some of its columns are visible', async () => {
    const dimensions: TableColumnDimension[] = [{ columnIds: ['name', 'age'], id: 'details', label: 'Details' }];
    const store = await createStore({ dimensions });
    await renderHook(store);

    await expect.element(getMenuItem('menu-Details')).toHaveAttribute('data-checked', 'mixed');
    await expect.element(page.getByTestId('IndeterminateCheckBoxIcon')).toBeInTheDocument();
    await expect.element(getMenuItem('menu-Details-Name')).toHaveAttribute('data-checked', 'true');
    await expect.element(getMenuItem('menu-Details-Age')).toHaveAttribute('data-checked', 'false');
    await expect.element(getMenuItem('menu-Name')).not.toBeInTheDocument();
  });

  it('should show all columns of a mixed dimension when its item is clicked and toggle a dimension child when clicked', async () => {
    const dimensions: TableColumnDimension[] = [{ columnIds: ['name', 'age'], id: 'details', label: 'Details' }];
    const store = await createStore({ dimensions });
    const columnVisibilityChangePayloads = listenTo(store, 'columnVisibilityChange');
    await renderHook(store);

    await getMenuItem('menu-Details').click();
    await getMenuItem('menu-Details-Age').click();

    expect(columnVisibilityChangePayloads).toEqual([
      ['name', 'select', 'age'],
      ['name', 'select', 'age'],
    ]);
  });

  it('should show a fully visible dimension as checked and hide all its columns when clicked', async () => {
    const dimensions: TableColumnDimension[] = [{ columnIds: ['name', 'age'], id: 'details', label: 'Details' }];
    const store = await createStore({ columns: createColumns({ ageVisible: true }), dimensions });
    const columnVisibilityChangePayloads = listenTo(store, 'columnVisibilityChange');
    await renderHook(store);

    await expect.element(getMenuItem('menu-Details')).toHaveAttribute('data-checked', 'true');
    await getMenuItem('menu-Details').click();

    expect(columnVisibilityChangePayloads).toEqual([['select']]);
  });

  it('should show a hidden dimension as unchecked and show all its columns when clicked', async () => {
    const dimensions: TableColumnDimension[] = [{ columnIds: ['name', 'age'], id: 'details', label: 'Details' }];
    const store = await createStore({ columns: createColumns({ nameVisible: false }), dimensions });
    const columnVisibilityChangePayloads = listenTo(store, 'columnVisibilityChange');
    await renderHook(store);

    await expect.element(getMenuItem('menu-Details')).toHaveAttribute('data-checked', 'false');
    await getMenuItem('menu-Details').click();

    expect(columnVisibilityChangePayloads).toEqual([['select', 'name', 'age']]);
  });

  it('should use an empty label for a dimension column id without a matching column', async () => {
    const dimensions: TableColumnDimension[] = [{ columnIds: ['name', 'missing'], id: 'details', label: 'Details' }];
    const store = await createStore({ dimensions });
    await renderHook(store);

    await expect.element(getMenuItem('menu-Details')).toHaveAttribute('data-checked', 'mixed');
    await expect.element(getMenuItem('menu-Details-')).toHaveAttribute('data-checked', 'false');
  });
});
