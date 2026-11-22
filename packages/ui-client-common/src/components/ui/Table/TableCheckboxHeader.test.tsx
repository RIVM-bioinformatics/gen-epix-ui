import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  page,
  userEvent,
} from 'vitest/browser';

import {
  FIXED_COLUMN_ID,
  TABLE_COLUMN_FROZEN,
} from '../../../models/table.models';
import type {
  TableColumnSelectable,
  TableRowParams,
} from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableCheckboxHeader } from './TableCheckboxHeader';

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
const ROW_1: TestRow = { id: 'row-1', name: 'Alpha' };
const ROW_2: TestRow = { id: 'row-2', name: 'Beta' };
const ROW_3: TestRow = { id: 'row-3', name: 'Gamma' };
const ROWS: TestRow[] = [ROW_1, ROW_2, ROW_3];
const OUTSIDE_ID = 'outside-row';
const CHECKBOX_LABEL = 'Select all';
// SVG path fragments that identify the rendered MUI icon glyph
const INDETERMINATE_ICON_PATH_FRAGMENT = 'H7v-2h10z';
const CHECKED_ICON_PATH_FRAGMENT = 'l-5-5';

const createStore = () => createTableStore<TestRow, TestDataContext>({
  defaultSortByField: 'name',
  idSelectorCallback: (row) => row.id,
  isRowEnabledCallback: () => true,
});

const createColumn = (
  overrides: Partial<TableColumnSelectable<TestRow, TestDataContext>> = {},
): TableColumnSelectable<TestRow, TestDataContext> => ({
  disableEllipsis: true,
  frozen: TABLE_COLUMN_FROZEN.LEFT,
  headerName: 'Select',
  id: FIXED_COLUMN_ID.ROW_SELECT,
  isInitiallyVisible: true,
  resizable: false,
  type: 'selectable',
  ...overrides,
});

type RenderCheckboxHeaderOptions = {
  readonly column?: TableColumnSelectable<TestRow, TestDataContext>;
  readonly rows?: TestRow[];
  readonly selectedIds?: string[];
  readonly store?: TestStore;
};

const renderCheckboxHeader = async ({
  column = createColumn(),
  rows = ROWS,
  selectedIds = [],
  store = createStore(),
}: RenderCheckboxHeaderOptions = {}) => {
  store.setState({
    dataContext: DATA_CONTEXT,
    selectedIds,
    sortedData: rows,
  });
  await renderComponent(
    <TableStoreContextProvider store={store}>
      <TableCheckboxHeader<TestRow, TestDataContext> tableColumnParams={{ column, dataContext: DATA_CONTEXT }} />
    </TableStoreContextProvider>,
  );
  return { column, store };
};

const getCheckbox = () => page.getByRole('checkbox', { name: CHECKBOX_LABEL });

const getCheckboxInput = () => getCheckbox().element() as HTMLInputElement;

const getRenderedIconPath = () => {
  const iconPath = (getCheckboxInput().parentElement).querySelector('svg path');
  return iconPath?.getAttribute('d') ?? '';
};

describe('TableCheckboxHeader', () => {
  it('should render an unchecked select-all checkbox when no rows are selected', async () => {
    await renderCheckboxHeader();

    await expect.element(getCheckbox()).not.toBeChecked();
    expect(getCheckboxInput().name).toBe('select-all');
  });

  it('should render a checked checkbox with the indeterminate icon when only some rows are selected', async () => {
    await renderCheckboxHeader({ selectedIds: [ROW_1.id] });

    await expect.element(getCheckbox()).toBeChecked();
    expect(getRenderedIconPath()).toContain(INDETERMINATE_ICON_PATH_FRAGMENT);
  });

  it('should render a checked checkbox with the checked icon when all rows are selected', async () => {
    await renderCheckboxHeader({ selectedIds: [ROW_1.id, ROW_2.id, ROW_3.id] });

    await expect.element(getCheckbox()).toBeChecked();
    expect(getRenderedIconPath()).toContain(CHECKED_ICON_PATH_FRAGMENT);
    expect(getRenderedIconPath()).not.toContain(INDETERMINATE_ICON_PATH_FRAGMENT);
  });

  it('should select all visible rows when clicked and no rows are selected', async () => {
    const { store } = await renderCheckboxHeader();

    await userEvent.click(getCheckbox());

    await expect.element(getCheckbox()).toBeChecked();
    expect(store.getState().selectedIds).toEqual([ROW_1.id, ROW_2.id, ROW_3.id]);
  });

  it('should keep selected ids outside the visible rows when selecting all visible rows', async () => {
    const { store } = await renderCheckboxHeader({ selectedIds: [OUTSIDE_ID] });

    await userEvent.click(getCheckbox());

    expect(store.getState().selectedIds).toEqual([OUTSIDE_ID, ROW_1.id, ROW_2.id, ROW_3.id]);
  });

  it('should not duplicate already selected ids when selecting all visible rows', async () => {
    const { store } = await renderCheckboxHeader({ selectedIds: [ROW_2.id] });

    await userEvent.click(getCheckbox());

    expect(store.getState().selectedIds).toEqual([ROW_2.id, ROW_1.id, ROW_3.id]);
  });

  it('should unselect all visible rows when clicked and all visible rows are selected', async () => {
    const { store } = await renderCheckboxHeader({ selectedIds: [OUTSIDE_ID, ROW_1.id, ROW_2.id, ROW_3.id] });

    await userEvent.click(getCheckbox());

    await expect.element(getCheckbox()).not.toBeChecked();
    expect(store.getState().selectedIds).toEqual([OUTSIDE_ID]);
  });

  it('should treat an empty table as all checked and leave selected ids unchanged when clicked', async () => {
    const { store } = await renderCheckboxHeader({ rows: [], selectedIds: [OUTSIDE_ID] });

    await expect.element(getCheckbox()).not.toBeChecked();
    expect(getRenderedIconPath()).not.toContain(INDETERMINATE_ICON_PATH_FRAGMENT);

    await userEvent.click(getCheckbox());

    expect(store.getState().selectedIds).toEqual([OUTSIDE_ID]);
  });

  it('should only select enabled rows when the column disables some rows', async () => {
    const isDisabled = vi.fn<(params: TableRowParams<TestRow, TestDataContext>) => boolean>(({ row }) => row.id === ROW_2.id);
    const { store } = await renderCheckboxHeader({ column: createColumn({ isDisabled }) });

    await userEvent.click(getCheckbox());

    expect(store.getState().selectedIds).toEqual([ROW_1.id, ROW_3.id]);
  });

  it('should pass the row params to the isDisabled callback', async () => {
    const isDisabled = vi.fn<(params: TableRowParams<TestRow, TestDataContext>) => boolean>(() => false);
    await renderCheckboxHeader({ column: createColumn({ isDisabled }) });

    expect(isDisabled).toHaveBeenCalledWith(expect.objectContaining({
      dataContext: DATA_CONTEXT,
      id: ROW_2.id,
      row: ROW_2,
      rowIndex: 1,
    }));
  });

  it('should not show as checked when only disabled rows are selected', async () => {
    const isDisabled = vi.fn<(params: TableRowParams<TestRow, TestDataContext>) => boolean>(({ row }) => row.id === ROW_2.id);
    await renderCheckboxHeader({ column: createColumn({ isDisabled }), selectedIds: [ROW_2.id] });

    await expect.element(getCheckbox()).not.toBeChecked();
  });

  it('should consider only enabled rows when determining the all-checked state', async () => {
    const isDisabled = vi.fn<(params: TableRowParams<TestRow, TestDataContext>) => boolean>(({ row }) => row.id === ROW_2.id);
    const { store } = await renderCheckboxHeader({ column: createColumn({ isDisabled }), selectedIds: [ROW_1.id, ROW_3.id] });

    await expect.element(getCheckbox()).toBeChecked();
    expect(getRenderedIconPath()).toContain(CHECKED_ICON_PATH_FRAGMENT);

    await userEvent.click(getCheckbox());

    expect(store.getState().selectedIds).toEqual([]);
  });
});
