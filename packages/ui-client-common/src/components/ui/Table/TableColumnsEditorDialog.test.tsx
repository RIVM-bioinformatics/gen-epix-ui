import { createRef } from 'react';
import type { ReactNode } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import {
  FIXED_COLUMN_ID,
  TABLE_COLUMN_FROZEN,
} from '../../../models/table.models';
import type {
  HasCellDataFn,
  TableColumn,
  TableColumnSelectable,
  TableColumnText,
  TableColumnVisualSettings,
} from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableColumnsEditorDialog } from './TableColumnsEditorDialog';
import type {
  TableColumnsEditorDialogItem,
  TableColumnsEditorDialogRefMethods,
} from './TableColumnsEditorDialog';

type TestDataContext = {
  label: string;
};

type TestRow = {
  id: string;
  name: string;
};

type TestStore = ReturnType<typeof createStore>;

const DATA_CONTEXT: TestDataContext = {
  label: 'Context',
};
const ROWS: TestRow[] = [
  { id: 'row-1', name: 'Alpha' },
  { id: 'row-2', name: 'Beta' },
];
const COLUMN_IDS_WITH_DATA = ['name', 'code'];
const MISSING_COLUMN_ID = 'missing-column';
const DIALOG_TITLE = 'Change column order and visibility';

const createStore = () => createTableStore<TestRow, TestDataContext>({
  defaultSortByField: 'name',
  idSelectorCallback: (row) => row.id,
  isRowEnabledCallback: () => true,
});

const hasCellData: HasCellDataFn<TestRow, TestDataContext> = (_row, column) => COLUMN_IDS_WITH_DATA.includes(column.id);

const createColumn = (
  overrides: Partial<TableColumnText<TestRow, TestDataContext>> & Pick<TableColumnText<TestRow, TestDataContext>, 'id'>,
): TableColumnText<TestRow, TestDataContext> => ({
  disableEllipsis: true,
  headerName: overrides.id,
  isInitiallyVisible: true,
  resizable: false,
  type: 'text',
  ...overrides,
});

const ROW_SELECT_COLUMN: TableColumnSelectable<TestRow, TestDataContext> = {
  disableEllipsis: true,
  frozen: TABLE_COLUMN_FROZEN.LEFT,
  headerName: 'Select',
  id: FIXED_COLUMN_ID.ROW_SELECT,
  isInitiallyVisible: true,
  resizable: false,
  type: 'selectable',
};

const COLUMNS: TableColumn<TestRow, TestDataContext>[] = [
  ROW_SELECT_COLUMN,
  createColumn({ headerName: 'Name', id: 'name' }),
  createColumn({ headerName: 'Code', id: 'code', isInitiallyVisible: false }),
  createColumn({ headerName: 'Notes', id: 'notes' }),
  createColumn({ frozen: TABLE_COLUMN_FROZEN.RIGHT, headerName: 'Actions', id: 'actions' }),
];

const createVisualSettings = (
  visibilityById: Record<string, boolean>,
): TableColumnVisualSettings[] => Object.entries(visibilityById).map(([id, isVisible]) => ({
  id,
  isVisible,
  widthFlex: 1,
  widthPx: 100,
}));

// Visual settings order determines the order of the movable items in the dialog
const DEFAULT_VISUAL_SETTINGS = createVisualSettings({
  actions: true,
  code: false,
  [FIXED_COLUMN_ID.ROW_SELECT]: true,
  [MISSING_COLUMN_ID]: true,
  name: true,
  notes: true,
});

type RenderDialogOptions = {
  readonly renderHeaderContent?: () => ReactNode;
  readonly renderItemContent?: (item: TableColumnsEditorDialogItem<TestRow, TestDataContext>) => ReactNode;
  readonly store?: TestStore;
  readonly visualSettings?: TableColumnVisualSettings[];
};

const renderDialog = async ({
  renderHeaderContent,
  renderItemContent,
  store = createStore(),
  visualSettings = DEFAULT_VISUAL_SETTINGS,
}: RenderDialogOptions = {}) => {
  store.setState({
    columns: COLUMNS,
    columnVisualSettingsUncondensed: visualSettings,
    dataContext: DATA_CONTEXT,
    isCondensed: false,
    sortedData: ROWS,
  });
  const ref = createRef<TableColumnsEditorDialogRefMethods<TestRow, TestDataContext>>();
  const screen = await renderComponent(
    <TableStoreContextProvider store={store}>
      <TableColumnsEditorDialog<TestRow, TestDataContext>
        ref={ref}
        renderHeaderContent={renderHeaderContent}
        renderItemContent={renderItemContent}
      />
    </TableStoreContextProvider>,
  );
  ref.current?.open({ hasCellData });
  return { screen, store };
};

const getCheckbox = (label: string) => page.getByRole('checkbox', { name: `Visibility for ${label}` });

const getActionButton = (action: string) => page.getByTestId(`TableColumnOrderDialog-${action}`);

const listenToEvent = (store: TestStore, eventName: 'columnOrderChange' | 'columnVisibilityChange') => {
  const callback = vi.fn();
  store.getState().addEventListener(eventName, callback);
  return callback;
};

describe('TableColumnsEditorDialog', () => {
  it('should show the dialog title and all action buttons', async () => {
    const { screen } = await renderDialog();

    await expect.element(screen.getByRole('heading', { exact: true, name: DIALOG_TITLE })).toBeVisible();
    await expect.element(getActionButton('enable-all')).toBeVisible();
    await expect.element(getActionButton('enable-all-with-data')).toBeVisible();
    await expect.element(getActionButton('disable-all')).toBeVisible();
    await expect.element(getActionButton('disable-all-without-data')).toBeVisible();
    await expect.element(getActionButton('reset')).toBeVisible();
    await expect.element(getActionButton('close')).toBeVisible();
    await expect.element(getActionButton('save')).toBeVisible();
  });

  it('should list only the movable columns, in visual settings order, with their visibility', async () => {
    await renderDialog();

    await expect.element(getCheckbox('Notes')).toBeChecked();
    await expect.element(getCheckbox('Name')).toBeChecked();
    await expect.element(getCheckbox('Code')).not.toBeChecked();
    expect(page.getByRole('checkbox').elements()).toHaveLength(3);
    expect(page.getByText('Select', { exact: true }).elements()).toHaveLength(0);
    expect(page.getByText('Actions', { exact: true }).elements()).toHaveLength(0);
  });

  it('should render custom header and item content when provided', async () => {
    const { screen } = await renderDialog({
      renderHeaderContent: () => (
        <div>
          {'Custom header content'}
        </div>
      ),
      renderItemContent: (item) => (
        <div>
          {`Custom item ${item.label}`}
        </div>
      ),
    });

    await expect.element(screen.getByText('Custom header content')).toBeVisible();
    await expect.element(screen.getByText('Custom item Notes')).toBeVisible();
    await expect.element(screen.getByText('Custom item Code')).toBeVisible();
  });

  it('should toggle an item when its checkbox is clicked and apply the change', async () => {
    const { store } = await renderDialog();
    const visibilityCallback = listenToEvent(store, 'columnVisibilityChange');

    await getCheckbox('Code').click();
    await expect.element(getCheckbox('Code')).toBeChecked();
    await getActionButton('save').click();

    expect(visibilityCallback).toHaveBeenCalledWith([FIXED_COLUMN_ID.ROW_SELECT, 'actions', 'code', 'name', 'notes']);
  });

  it('should show all columns when "Show all" is clicked', async () => {
    const { store } = await renderDialog();
    const visibilityCallback = listenToEvent(store, 'columnVisibilityChange');

    await getActionButton('enable-all').click();
    await expect.element(getCheckbox('Code')).toBeChecked();
    await expect.element(getCheckbox('Notes')).toBeChecked();
    await expect.element(getCheckbox('Name')).toBeChecked();
    await getActionButton('save').click();

    expect(visibilityCallback).toHaveBeenCalledWith([FIXED_COLUMN_ID.ROW_SELECT, 'actions', 'code', 'name', 'notes']);
  });

  it('should hide all movable columns when "Hide all" is clicked', async () => {
    const { store } = await renderDialog();
    const visibilityCallback = listenToEvent(store, 'columnVisibilityChange');

    await getActionButton('disable-all').click();
    await expect.element(getCheckbox('Notes')).not.toBeChecked();
    await expect.element(getCheckbox('Name')).not.toBeChecked();
    await expect.element(getCheckbox('Code')).not.toBeChecked();
    await getActionButton('save').click();

    expect(visibilityCallback).toHaveBeenCalledWith([FIXED_COLUMN_ID.ROW_SELECT, 'actions']);
  });

  it('should show only the columns that have data when "Show all with data" is clicked', async () => {
    const { store } = await renderDialog();
    const visibilityCallback = listenToEvent(store, 'columnVisibilityChange');

    await getActionButton('enable-all-with-data').click();
    await expect.element(getCheckbox('Name')).toBeChecked();
    await expect.element(getCheckbox('Code')).toBeChecked();
    await expect.element(getCheckbox('Notes')).not.toBeChecked();
    await getActionButton('save').click();

    expect(visibilityCallback).toHaveBeenCalledWith([FIXED_COLUMN_ID.ROW_SELECT, 'actions', 'code', 'name']);
  });

  it('should hide the columns without data but keep visible columns that have data when "Hide all without data" is clicked', async () => {
    const { store } = await renderDialog();
    const visibilityCallback = listenToEvent(store, 'columnVisibilityChange');

    await getActionButton('disable-all-without-data').click();
    await expect.element(getCheckbox('Name')).toBeChecked();
    await expect.element(getCheckbox('Notes')).not.toBeChecked();
    await expect.element(getCheckbox('Code')).not.toBeChecked();
    await getActionButton('save').click();

    expect(visibilityCallback).toHaveBeenCalledWith([FIXED_COLUMN_ID.ROW_SELECT, 'actions', 'name']);
  });

  it('should restore the initially visible columns when "Reset to default" is clicked', async () => {
    const { store } = await renderDialog();
    const visibilityCallback = listenToEvent(store, 'columnVisibilityChange');

    await getActionButton('disable-all').click();
    await expect.element(getCheckbox('Name')).not.toBeChecked();

    await getActionButton('reset').click();
    await expect.element(getCheckbox('Notes')).toBeChecked();
    await expect.element(getCheckbox('Name')).toBeChecked();
    await expect.element(getCheckbox('Code')).not.toBeChecked();
    await getActionButton('save').click();

    // Reset uses the column definition order, not the visual settings order
    expect(visibilityCallback).toHaveBeenCalledWith([FIXED_COLUMN_ID.ROW_SELECT, 'actions', 'name', 'notes']);
  });

  it('should emit the column order with frozen columns in place and close the dialog when "Apply" is clicked', async () => {
    const { screen, store } = await renderDialog();
    const orderCallback = listenToEvent(store, 'columnOrderChange');

    await getCheckbox('Code').click();
    await getActionButton('save').click();

    expect(orderCallback).toHaveBeenCalledWith([FIXED_COLUMN_ID.ROW_SELECT, 'code', 'name', 'notes', 'actions']);
    await expect.element(screen.getByRole('heading', { exact: true, name: DIALOG_TITLE })).not.toBeInTheDocument();
  });

  it('should close the dialog without emitting events when "Close" is clicked', async () => {
    const { screen, store } = await renderDialog();
    const visibilityCallback = listenToEvent(store, 'columnVisibilityChange');
    const orderCallback = listenToEvent(store, 'columnOrderChange');

    await getActionButton('disable-all').click();
    await getActionButton('close').click();

    await expect.element(screen.getByRole('heading', { exact: true, name: DIALOG_TITLE })).not.toBeInTheDocument();
    expect(visibilityCallback).not.toHaveBeenCalled();
    expect(orderCallback).not.toHaveBeenCalled();
  });
});
