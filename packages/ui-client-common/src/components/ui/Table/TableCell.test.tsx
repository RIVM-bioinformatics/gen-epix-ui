import { createRef } from 'react';
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

import { TABLE_COLUMN_FROZEN } from '../../../models/table.models';
import type {
  TableColumn,
  TableDragEvent,
  TableRowParams,
} from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableCell } from './TableCell';
import type {
  TableCellProps,
  TableCellRef,
} from './TableCell';

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
const ROW_INDEX = 2;
const CELL_COLUMN_INDEX = 1;
const CELL_HEIGHT = '40px';
const CELL_ORDER = 3;
const CELL_WIDTH = 120;
const CELL_TEXT = 'Alpha';
const DATA_CONTEXT: TestDataContext = {
  label: 'Context',
};

const createStore = () => createTableStore<TestRow, TestDataContext>({
  defaultSortByField: 'name',
  idSelectorCallback: (row) => row.id,
  isRowEnabledCallback: () => true,
});

const createColumn = (
  overrides: Partial<Omit<TableColumn<TestRow, TestDataContext>, 'type'>> = {},
): TableColumn<TestRow, TestDataContext> => ({
  headerName: 'Name',
  id: 'name',
  isInitiallyVisible: true,
  type: 'text',
  valueGetter: ({ row }) => row.name,
  ...overrides,
} as TableColumn<TestRow, TestDataContext>);

type RenderCellOptions = {
  readonly column?: TableColumn<TestRow, TestDataContext>;
  readonly dataContext?: null | TestDataContext;
  readonly store?: TestStore;
} & Partial<Omit<TableCellProps<TestRow, TestDataContext>, 'children' | 'column' | 'columnIndex' | 'height' | 'order' | 'width'>>;

const renderCell = async ({
  column = createColumn(),
  dataContext = DATA_CONTEXT,
  store = createStore(),
  ...cellProps
}: RenderCellOptions = {}) => {
  store.setState({ dataContext });
  const result = await renderComponent(
    <TableStoreContextProvider store={store}>
      <div style={{ height: 400, width: 800 }}>
        <TableCell<TestRow, TestDataContext>
          column={column}
          columnIndex={CELL_COLUMN_INDEX}
          height={CELL_HEIGHT}
          order={CELL_ORDER}
          width={CELL_WIDTH}
          {...cellProps}
        >
          {CELL_TEXT}
        </TableCell>
      </div>
    </TableStoreContextProvider>,
  );
  return { column, result, store };
};

const getCell = (name: string = CELL_TEXT) => page.getByText(name, { exact: true });

const getCellElement = (name: string = CELL_TEXT) => getCell(name).element() as HTMLElement;

const dispatchMouseEvent = (target: EventTarget, type: string, init: MouseEventInit = {}) => {
  target.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    ...init,
  }));
};

describe('TableCell', () => {
  it('should render the children with the default cell role and data attributes', async () => {
    await renderCell({ rowIndex: ROW_INDEX });

    const cell = getCellElement();
    expect(cell.getAttribute('role')).toBe('cell');
    expect(cell.getAttribute('data-column-index')).toBe(String(CELL_COLUMN_INDEX));
    expect(cell.getAttribute('data-id')).toBe('name');
    expect(cell.getAttribute('data-frozen')).toBe('0');
    expect(cell.getAttribute('data-row-index')).toBe(String(ROW_INDEX));
    await expect.element(getCell()).toBeVisible();
  });

  it('should render an empty data-row-index when no row index is given', async () => {
    await renderCell();

    expect(getCellElement().getAttribute('data-row-index')).toBe('');
  });

  it('should apply the custom role, aria-sort, class name, tab index and title', async () => {
    await renderCell({
      ariaSort: 'descending',
      className: 'custom-cell',
      role: 'gridcell',
      tabIndex: 0,
      title: 'Cell title',
    });

    const cell = getCellElement();
    expect(cell.getAttribute('role')).toBe('gridcell');
    await expect.element(page.getByRole('gridcell')).toBeVisible();
    expect(cell.getAttribute('aria-sort')).toBe('descending');
    expect(cell.classList.contains('custom-cell')).toBe(true);
    expect(cell.getAttribute('tabindex')).toBe('0');
    expect(cell.getAttribute('title')).toBe('Cell title');
  });

  it('should forward the ref to the rendered cell element', async () => {
    const ref = createRef<TableCellRef>();
    await renderCell({ ref });

    expect(ref.current?.getAttribute('data-id')).toBe('name');
  });

  it('should left align the text by default', async () => {
    await renderCell();

    expect(getComputedStyle(getCellElement()).textAlign).toBe('left');
  });

  it('should right align the text when the column requests it', async () => {
    await renderCell({ column: createColumn({ textAlign: 'right' }) });

    expect(getComputedStyle(getCellElement()).textAlign).toBe('right');
  });

  it('should ellipsize and not wrap the text by default and not when disableEllipsis is set', async () => {
    await renderCell();
    const ellipsizedStyle = getComputedStyle(getCellElement());
    expect(ellipsizedStyle.textOverflow).toBe('ellipsis');
    expect(ellipsizedStyle.whiteSpace).toBe('nowrap');
  });

  it('should not ellipsize the text when disableEllipsis is set on the column', async () => {
    await renderCell({ column: createColumn({ disableEllipsis: true }) });

    const unclippedStyle = getComputedStyle(getCellElement());
    expect(unclippedStyle.textOverflow).toBe('clip');
    expect(unclippedStyle.whiteSpace).toBe('normal');
  });

  it('should merge the sx prop over the computed cell styles', async () => {
    await renderCell({ backgroundColor: '#000000', sx: { color: 'rgb(255, 0, 0)' } });

    expect(getComputedStyle(getCellElement()).color).toBe('rgb(255, 0, 0)');
  });

  it('should use the contrast text color for a dark background color', async () => {
    await renderCell({ backgroundColor: '#000000' });

    expect(getComputedStyle(getCellElement()).color).toBe('rgb(255, 255, 255)');
  });

  it('should reuse the cached contrast color for a background color that was already rendered', async () => {
    await renderComponent(
      <TableStoreContextProvider store={createStore()}>
        <div style={{ height: 400, width: 800 }}>
          <TableCell<TestRow, TestDataContext>
            backgroundColor={'#123abc'}
            column={createColumn()}
            columnIndex={0}
            height={CELL_HEIGHT}
            order={0}
            width={CELL_WIDTH}
          >
            {'First'}
          </TableCell>
          <TableCell<TestRow, TestDataContext>
            backgroundColor={'#123abc'}
            column={createColumn()}
            columnIndex={1}
            height={CELL_HEIGHT}
            order={1}
            width={CELL_WIDTH}
          >
            {'Second'}
          </TableCell>
        </div>
      </TableStoreContextProvider>,
    );

    expect(getComputedStyle(getCellElement('First')).color).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(getCellElement('Second')).color).toBe('rgb(255, 255, 255)');
  });

  it('should position a left frozen cell sticky at the given x offset', async () => {
    await renderCell({ column: createColumn({ frozen: TABLE_COLUMN_FROZEN.LEFT }), xOffset: 50 });

    const cell = getCellElement();
    const style = getComputedStyle(cell);
    expect(cell.getAttribute('data-frozen')).toBe('1');
    expect(style.position).toBe('sticky');
    expect(style.left).toBe('50px');
    expect(style.zIndex).toBe('1');
  });

  it('should position a left frozen cell at zero when no x offset is given', async () => {
    await renderCell({ column: createColumn({ frozen: TABLE_COLUMN_FROZEN.LEFT }) });

    expect(getComputedStyle(getCellElement()).left).toBe('0px');
  });

  it('should position a right frozen cell sticky at the given x offset', async () => {
    await renderCell({ column: createColumn({ frozen: TABLE_COLUMN_FROZEN.RIGHT }), xOffset: 70 });

    const style = getComputedStyle(getCellElement());
    expect(style.position).toBe('sticky');
    expect(style.right).toBe('70px');
  });

  it('should position a right frozen cell at zero when no x offset is given', async () => {
    await renderCell({ column: createColumn({ frozen: TABLE_COLUMN_FROZEN.RIGHT }) });

    expect(getComputedStyle(getCellElement()).right).toBe('0px');
  });

  it('should keep the paper background instead of the background color for a frozen cell', async () => {
    await renderCell({ backgroundColor: 'rgb(255, 0, 0)', column: createColumn({ frozen: TABLE_COLUMN_FROZEN.LEFT }) });

    expect(getComputedStyle(getCellElement()).backgroundColor).not.toBe('rgb(255, 0, 0)');
  });

  it('should apply the background color to a movable cell', async () => {
    await renderCell({ backgroundColor: 'rgb(255, 0, 0)' });

    expect(getComputedStyle(getCellElement()).backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('should call onClick with the row params and the native event when the cell is enabled', async () => {
    const onClick = vi.fn<(row: TableRowParams<TestRow, TestDataContext>, event?: MouseEvent) => void>();
    await renderCell({ enabled: true, onClick, row: ROW, rowIndex: ROW_INDEX });

    await userEvent.click(getCell());

    expect(onClick).toHaveBeenCalledExactlyOnceWith({
      dataContext: DATA_CONTEXT,
      id: 'name',
      row: ROW,
      rowIndex: ROW_INDEX,
    }, expect.any(MouseEvent));
  });

  it('should not call onClick when the cell is not enabled', async () => {
    const onClick = vi.fn<(row: TableRowParams<TestRow, TestDataContext>, event?: MouseEvent) => void>();
    await renderCell({ onClick, row: ROW });

    await userEvent.click(getCell());

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should pass a null data context to onClick when the store has none', async () => {
    const onClick = vi.fn<(row: TableRowParams<TestRow, TestDataContext>, event?: MouseEvent) => void>();
    await renderCell({ dataContext: null, enabled: true, onClick, row: ROW });

    await userEvent.click(getCell());

    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ dataContext: null }), expect.any(MouseEvent));
  });

  it('should emit start, move and end drag events on a movable cell with a custom drag handler', async () => {
    const dragEvents: TableDragEvent[] = [];
    await renderCell({
      onCustomDrag: (event) => {
        dragEvents.push(event);
      },
    });

    const cell = getCellElement();
    dispatchMouseEvent(cell, 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 80, clientY: 15 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 100, clientY: 25 });

    expect(dragEvents.map((event) => event.type)).toEqual(['start', 'move', 'move', 'end']);
    expect(dragEvents[0]).toMatchObject({ clientX: 50, clientY: 10, deltaX: 0, deltaY: 0 });
    expect(dragEvents[1]).toMatchObject({ clientX: 60, clientY: 12, deltaX: 10, deltaY: 2 });
    expect(dragEvents[2]).toMatchObject({ clientX: 80, clientY: 15, deltaX: 30, deltaY: 5 });
    expect(dragEvents[3]).toMatchObject({ clientX: 100, clientY: 25, deltaX: 50, deltaY: 15 });
    expect(dragEvents[0].target).toBe(cell);
    expect(dragEvents[0].elementWidth).toBe(cell.getBoundingClientRect().width);
    expect(dragEvents[0].elementOffsetX).toBe(50 - cell.getBoundingClientRect().left);

    dispatchMouseEvent(document, 'mousemove', { clientX: 200, clientY: 200 });
    expect(dragEvents).toHaveLength(4);
  });

  it('should not emit an end drag event when the mouse is released without moving', async () => {
    const dragEvents: TableDragEvent[] = [];
    await renderCell({
      onCustomDrag: (event) => {
        dragEvents.push(event);
      },
    });

    const cell = getCellElement();
    dispatchMouseEvent(cell, 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 50, clientY: 10 });

    expect(dragEvents).toHaveLength(0);
  });

  it('should not start a drag when the canDrag predicate rejects the mouse down', async () => {
    const dragEvents: TableDragEvent[] = [];
    const canDrag = vi.fn<(event: ReactMouseEvent<HTMLDivElement>) => boolean>(() => false);
    await renderCell({
      canDrag,
      onCustomDrag: (event) => {
        dragEvents.push(event);
      },
    });

    dispatchMouseEvent(getCellElement(), 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 60, clientY: 12 });

    expect(canDrag).toHaveBeenCalledOnce();
    expect(dragEvents).toHaveLength(0);
  });

  it('should start a drag when the canDrag predicate accepts the mouse down', async () => {
    const dragEvents: TableDragEvent[] = [];
    const canDrag = vi.fn<(event: ReactMouseEvent<HTMLDivElement>) => boolean>(() => true);
    await renderCell({
      canDrag,
      onCustomDrag: (event) => {
        dragEvents.push(event);
      },
    });

    dispatchMouseEvent(getCellElement(), 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 60, clientY: 12 });

    expect(canDrag).toHaveBeenCalledOnce();
    expect(dragEvents.map((event) => event.type)).toEqual(['start', 'move', 'end']);
  });

  it('should not start a drag on a frozen cell even when a custom drag handler is given', async () => {
    const dragEvents: TableDragEvent[] = [];
    await renderCell({
      column: createColumn({ frozen: TABLE_COLUMN_FROZEN.LEFT }),
      onCustomDrag: (event) => {
        dragEvents.push(event);
      },
    });

    dispatchMouseEvent(getCellElement(), 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 60, clientY: 12 });

    expect(dragEvents).toHaveLength(0);
  });

  it('should not start a drag when no custom drag handler is given', async () => {
    await renderCell();

    dispatchMouseEvent(getCellElement(), 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 60, clientY: 12 });

    await expect.element(getCell()).toBeVisible();
  });
});
