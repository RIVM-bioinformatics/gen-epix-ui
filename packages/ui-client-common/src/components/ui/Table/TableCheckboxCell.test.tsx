import type { MouseEvent as ReactMouseEvent } from 'react';
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

import { TableCheckboxCell } from './TableCheckboxCell';

type TestDataContext = {
  label: string;
};

type TestRow = {
  id: string;
  name: string;
};

type TestStore = ReturnType<typeof createStore>;

const ROW: TestRow = {
  id: 'row-1',
  name: 'Alpha',
};
const OTHER_ROW_ID = 'row-2';
const DATA_CONTEXT: TestDataContext = {
  label: 'Context',
};
const CHECKBOX_LABEL = 'Select row';

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

const createCellParams = (row: TestRow = ROW): TableRowParams<TestRow, TestDataContext> => ({
  dataContext: DATA_CONTEXT,
  id: row.id,
  row,
  rowIndex: 0,
});

type RenderCheckboxCellOptions = {
  readonly column?: TableColumnSelectable<TestRow, TestDataContext>;
  readonly onCheckBoxClick?: (event: ReactMouseEvent, id: string) => void;
  readonly selectedIds?: string[];
  readonly store?: TestStore;
};

const renderCheckboxCell = async ({
  column = createColumn(),
  onCheckBoxClick = vi.fn<(event: ReactMouseEvent, id: string) => void>(),
  selectedIds = [],
  store = createStore(),
}: RenderCheckboxCellOptions = {}) => {
  store.getState().setSelectedIds(selectedIds);
  await renderComponent(
    <TableStoreContextProvider store={store}>
      <TableCheckboxCell<TestRow, TestDataContext>
        cell={createCellParams()}
        onCheckBoxClick={onCheckBoxClick}
        tableColumn={column}
      />
    </TableStoreContextProvider>,
  );
  return { column, onCheckBoxClick, store };
};

const getCheckbox = () => page.getByRole('checkbox', { name: CHECKBOX_LABEL });

const getCheckboxInput = () => getCheckbox().element() as HTMLInputElement;

describe('TableCheckboxCell', () => {
  it('should render an unchecked checkbox named after the row id when the row is not selected', async () => {
    await renderCheckboxCell();

    await expect.element(getCheckbox()).not.toBeChecked();
    expect(getCheckboxInput().name).toBe(ROW.id);
  });

  it('should render a checked checkbox when the row is selected', async () => {
    await renderCheckboxCell({ selectedIds: [ROW.id] });

    await expect.element(getCheckbox()).toBeChecked();
  });

  it('should add the row id to the selected ids when the checkbox is checked', async () => {
    const { store } = await renderCheckboxCell({ selectedIds: [OTHER_ROW_ID] });

    await userEvent.click(getCheckbox());

    await expect.element(getCheckbox()).toBeChecked();
    expect(store.getState().selectedIds).toEqual([OTHER_ROW_ID, ROW.id]);
  });

  it('should remove the row id from the selected ids when the checkbox is unchecked', async () => {
    const { store } = await renderCheckboxCell({ selectedIds: [OTHER_ROW_ID, ROW.id] });

    await userEvent.click(getCheckbox());

    await expect.element(getCheckbox()).not.toBeChecked();
    expect(store.getState().selectedIds).toEqual([OTHER_ROW_ID]);
  });

  it('should call onCheckBoxClick with the row id when clicked', async () => {
    const { onCheckBoxClick } = await renderCheckboxCell();

    await userEvent.click(getCheckbox());

    expect(onCheckBoxClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'click' }), ROW.id);
  });

  it('should stop the click from propagating to parent elements', async () => {
    const onDocumentClick = vi.fn<(event: MouseEvent) => void>();
    document.addEventListener('click', onDocumentClick);
    try {
      await renderCheckboxCell();

      await userEvent.click(getCheckbox());

      expect(onDocumentClick).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('click', onDocumentClick);
    }
  });

  it('should not duplicate the row id when a check is reported for an already selected row', async () => {
    const { store } = await renderCheckboxCell({ selectedIds: [ROW.id] });
    getCheckboxInput().checked = false;

    await userEvent.click(getCheckbox());

    expect(store.getState().selectedIds).toEqual([ROW.id]);
  });

  it('should prevent the default action of a shift-click', async () => {
    const { onCheckBoxClick } = await renderCheckboxCell();
    const shiftClickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      shiftKey: true,
    });

    getCheckboxInput().dispatchEvent(shiftClickEvent);

    expect(shiftClickEvent.defaultPrevented).toBe(true);
    expect(onCheckBoxClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ shiftKey: true }), ROW.id);
  });

  it('should not prevent the default action of a regular click', async () => {
    await renderCheckboxCell();
    const regularClickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      shiftKey: false,
    });

    getCheckboxInput().dispatchEvent(regularClickEvent);

    expect(regularClickEvent.defaultPrevented).toBe(false);
  });

  it('should be enabled when the column has no isDisabled callback', async () => {
    await renderCheckboxCell();

    await expect.element(getCheckbox()).toBeEnabled();
  });

  it('should be disabled when the column isDisabled callback returns true', async () => {
    const isDisabled = vi.fn<(params: TableRowParams<TestRow, TestDataContext>) => boolean>(() => true);
    await renderCheckboxCell({ column: createColumn({ isDisabled }) });

    await expect.element(getCheckbox()).toBeDisabled();
    expect(isDisabled).toHaveBeenLastCalledWith(createCellParams());
  });

  it('should be enabled when the column isDisabled callback returns false', async () => {
    const isDisabled = vi.fn<(params: TableRowParams<TestRow, TestDataContext>) => boolean>(() => false);
    await renderCheckboxCell({ column: createColumn({ isDisabled }) });

    await expect.element(getCheckbox()).toBeEnabled();
    expect(isDisabled).toHaveBeenLastCalledWith(createCellParams());
  });
});
