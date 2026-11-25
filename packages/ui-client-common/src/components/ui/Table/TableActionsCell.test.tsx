import { MenuItem } from '@mui/material';
import type { ReactElement } from 'react';
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
  TableColumnActions,
  TableRowParams,
} from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableActionsCell } from './TableActionsCell';

type TestDataContext = {
  label: string;
};

type TestRow = {
  id: string;
  name: string;
};

const ROW: TestRow = {
  id: 'row-1',
  name: 'Alpha',
};
const ROW_INDEX = 3;
const CELL_COLUMN_INDEX = 4;
const CELL_HEIGHT = '40px';
const CELL_ORDER = 5;
const CELL_WIDTH = 120;
const ACTION_LABEL = 'Edit row';
const ROW_ACTIONS_LABEL = 'Row actions';

const createStore = (dataContext: null | TestDataContext = null) => {
  const store = createTableStore<TestRow, TestDataContext>({
    defaultSortByField: 'name',
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: () => true,
  });
  store.setState({ dataContext });
  return store;
};

const createColumn = (
  getActions: (params: TableRowParams<TestRow, TestDataContext>) => ReactElement[],
): TableColumnActions<TestRow, TestDataContext> => ({
  frozen: TABLE_COLUMN_FROZEN.RIGHT,
  getActions,
  id: FIXED_COLUMN_ID.ACTIONS,
  isInitiallyVisible: true,
  resizable: false,
  type: 'actions',
});

const renderActionsCell = async ({
  dataContext = null,
  getActions = () => [],
  onClick,
  store = createStore(dataContext),
}: {
  readonly dataContext?: null | TestDataContext;
  readonly getActions?: (params: TableRowParams<TestRow, TestDataContext>) => ReactElement[];
  readonly onClick?: (row: TableRowParams<TestRow, TestDataContext>, event?: MouseEvent) => void;
  readonly store?: ReturnType<typeof createStore>;
} = {}) => {
  const column = createColumn(getActions);
  const result = await renderComponent(
    <TableStoreContextProvider store={store}>
      <div style={{ height: 400, width: 800 }}>
        <TableActionsCell<TestRow, TestDataContext>
          column={column}
          columnIndex={CELL_COLUMN_INDEX}
          enabled
          height={CELL_HEIGHT}
          onClick={onClick}
          order={CELL_ORDER}
          row={ROW}
          rowIndex={ROW_INDEX}
          sx={{ height: CELL_HEIGHT }}
          width={CELL_WIDTH}
        />
      </div>
    </TableStoreContextProvider>,
  );
  return { column, result, store };
};

const getActionsButton = () => page.getByRole('button', { name: ROW_ACTIONS_LABEL });
const getCell = () => page.getByRole('cell');

describe('TableActionsCell', () => {
  it('should render the cell without a row actions button when there are no actions', async () => {
    await renderActionsCell({ getActions: () => [] });

    await expect.element(getCell()).toBeInTheDocument();
    await expect.element(getActionsButton()).not.toBeInTheDocument();
  });

  it('should open the menu with the actions when the row actions button is clicked', async () => {
    await renderActionsCell({
      getActions: () => [
        <MenuItem key={'edit'}>
          {ACTION_LABEL}
        </MenuItem>,
      ],
    });

    await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
    await userEvent.click(getActionsButton().element());
    await expect.element(page.getByRole('menu')).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: ACTION_LABEL })).toBeInTheDocument();
  });

  it('should pass the data context, column id, row and row index to getActions', async () => {
    const dataContext = { label: 'context-value' };
    const getActions = vi.fn((_params: TableRowParams<TestRow, TestDataContext>): ReactElement[] => []);
    const { column } = await renderActionsCell({ dataContext, getActions });

    expect(getActions).toHaveBeenLastCalledWith({
      dataContext,
      id: column.id,
      row: ROW,
      rowIndex: ROW_INDEX,
    });
  });

  it('should recompute the actions when the data context changes', async () => {
    const store = createStore(null);
    const getActions = vi.fn((_params: TableRowParams<TestRow, TestDataContext>): ReactElement[] => []);
    await renderActionsCell({ getActions, store });

    const updatedDataContext = { label: 'updated' };
    store.setState({ dataContext: updatedDataContext });

    await expect.poll(() => getActions.mock.lastCall?.[0].dataContext).toBe(updatedDataContext);
  });

  it('should close the menu when an action is clicked', async () => {
    const onActionClick = vi.fn();
    await renderActionsCell({
      getActions: () => [
        <MenuItem
          key={'edit'}
          onClick={onActionClick}
        >
          {ACTION_LABEL}
        </MenuItem>,
      ],
    });

    await userEvent.click(getActionsButton().element());
    await userEvent.click(page.getByRole('menuitem', { name: ACTION_LABEL }).element());

    expect(onActionClick).toHaveBeenCalledTimes(1);
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
  });

  it('should close the menu when Escape is pressed', async () => {
    await renderActionsCell({
      getActions: () => [
        <MenuItem key={'edit'}>
          {ACTION_LABEL}
        </MenuItem>,
      ],
    });

    await userEvent.click(getActionsButton().element());
    await expect.element(page.getByRole('menu')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
  });

  it('should not trigger the cell onClick when the row actions button is clicked', async () => {
    const onClick = vi.fn();
    await renderActionsCell({
      getActions: () => [
        <MenuItem key={'edit'}>
          {ACTION_LABEL}
        </MenuItem>,
      ],
      onClick,
    });

    await userEvent.click(getActionsButton().element());

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should not trigger the cell onClick when the cell itself is clicked', async () => {
    const onClick = vi.fn();
    await renderActionsCell({ onClick });

    await userEvent.click(getCell().element());

    expect(onClick).not.toHaveBeenCalled();
  });
});
