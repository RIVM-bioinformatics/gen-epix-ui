import { createRef } from 'react';
import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';
import { Subject } from '@gen-epix/ui-core/classes/Subject';

import {
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '../../../classes/abstracts/FilterAbstract';
import { TextFilter } from '../../../classes/filters/TextFilter';
import { PageEventBusService } from '../../../classes/services/PageEventBusService';
import type { TableColumn } from '../../../models/table.models';
import {
  FIXED_COLUMN_ID,
  TABLE_COLUMN_FROZEN,
} from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import type {
  TableProps,
  TableRef,
} from './Table';
import { Table } from './Table';
import { tableHeaderCellClassNames } from './classNames';

type TestRow = {
  count: number;
  date: string;
  flag: boolean;
  id: string;
  name: string;
  option: string;
};

const ROW_COUNT = 120;
const FIRST_COUNT = 1000;
const DISABLED_COUNT = 1050;

const createRows = (rowCount: number): TestRow[] => Array.from({ length: rowCount }, (_, index) => {
  const count = FIRST_COUNT + index;
  return {
    count,
    date: '2024-01-01',
    flag: index % 2 === 0,
    id: `row-${count}`,
    name: `Name ${index + 1}`,
    option: index % 2 === 0 ? 'a' : 'b',
  };
});

const OPTIONS = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
];

const createColumns = (): TableColumn<TestRow>[] => [
  {
    disableEllipsis: true,
    frozen: TABLE_COLUMN_FROZEN.LEFT,
    id: FIXED_COLUMN_ID.ROW_SELECT,
    isDisabled: ({ row }) => row.count === DISABLED_COUNT,
    isInitiallyVisible: true,
    resizable: false,
    type: 'selectable',
  },
  {
    disableEllipsis: true,
    frozen: TABLE_COLUMN_FROZEN.LEFT,
    getAriaLabel: ({ row }) => `Open ${row.name}`,
    id: FIXED_COLUMN_ID.READABLE_INDEX,
    isInitiallyVisible: true,
    resizable: false,
    type: 'readableIndex',
  },
  {
    headerName: 'Name',
    id: 'name',
    isInitiallyVisible: true,
    type: 'text',
    valueGetter: ({ row }) => row.name,
  },
  {
    headerName: 'Count',
    id: 'count',
    isInitiallyVisible: true,
    type: 'number',
    valueGetter: ({ row }) => row.count,
  },
  {
    headerName: 'Flag',
    id: 'flag',
    isInitiallyVisible: true,
    type: 'boolean',
    valueGetter: ({ row }) => row.flag,
  },
  {
    dateFormat: DATE_FORMAT.DATE,
    headerName: 'Date',
    id: 'date',
    isInitiallyVisible: true,
    type: 'date',
    valueGetter: ({ row }) => row.date,
  },
  {
    headerName: 'Option',
    id: 'option',
    isInitiallyVisible: true,
    options: OPTIONS,
    type: 'options',
    valueGetter: ({ row }) => row.option,
  },
  {
    headerName: 'Hidden',
    id: 'hidden',
    isInitiallyVisible: false,
    type: 'text',
    valueGetter: ({ row }) => row.name,
  },
  {
    frozen: TABLE_COLUMN_FROZEN.RIGHT,
    getActions: () => [
      <span key={'edit'}>
        {'Edit'}
      </span>,
    ],
    id: FIXED_COLUMN_ID.ACTIONS,
    isInitiallyVisible: true,
    resizable: false,
    type: 'actions',
  },
];

const createCustomColumns = (): TableColumn<TestRow>[] => [
  {
    cellColorGetter: () => 'rgb(255, 0, 0)',
    cellTitleGetter: ({ row }) => `Title ${row.name}`,
    headerName: 'Name',
    id: 'name',
    isInitiallyVisible: true,
    type: 'text',
    valueGetter: ({ row }) => row.name,
  },
  {
    headerName: 'Rendered',
    id: 'rendered',
    isInitiallyVisible: true,
    renderCell: ({ row }) => (
      <span>
        {`Rendered ${row.name}`}
      </span>
    ),
    type: 'text',
  },
  {
    displayValueGetter: ({ row }) => `Display ${row.name}`,
    headerName: 'Display',
    id: 'display',
    isInitiallyVisible: true,
    type: 'text',
  },
  {
    headerName: 'Number',
    id: 'number',
    isInitiallyVisible: true,
    type: 'number',
    // A non-numeric value exercises the number title fallback.
    valueGetter: ({ row }) => row.name as unknown as number,
  },
];

const createTestStore = async (
  columns: TableColumn<TestRow>[],
  rows: TestRow[],
) => {
  const store = createTableStore<TestRow>({
    defaultSortByField: 'count',
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: (row) => row.count !== DISABLED_COUNT,
  });
  store.getState().setColumns(columns);
  store.getState().setBaseData(rows);
  await store.getState().initialize(new AbortController().signal);
  return store;
};

const renderTable = async (
  store: ReturnType<typeof createTableStore<TestRow>>,
  props: Partial<TableProps<TestRow>> = {},
  configure?: (config: { enablePageEvents?: boolean }) => void,
) => renderComponent(
  <TableStoreContextProvider store={store}>
    <div style={{ height: 400, width: 800 }}>
      <Table<TestRow> {...props} />
    </div>
  </TableStoreContextProvider>,
  { configure },
);

const getScrollerElement = () => document.querySelector<HTMLElement>('[data-virtuoso-scroller="true"]');

const getRenderedRowCount = () => document.querySelectorAll('[data-testid="virtuoso-item-list"] [data-id]').length;
const getRenderedRowIds = () => [...document.querySelectorAll('[data-testid="virtuoso-item-list"] [data-id^="row-"]')].map(element => element.getAttribute('data-id'));

const dispatchMouseEvent = (target: EventTarget, type: string, init: MouseEventInit = {}) => {
  target.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    ...init,
  }));
};

type TableScreen = Awaited<ReturnType<typeof renderTable>>;

// The divider's aria-label is part of the header's accessible name, so match the header name as a prefix.
const getHeaderLocator = (screen: TableScreen, headerName: string) => screen.getByRole('columnheader', { name: new RegExp(`^${headerName}\\b`) });

const getHeaderContent = (screen: TableScreen, headerName: string) => {
  const headerElement = getHeaderLocator(screen, headerName).element();
  const contentElement = headerElement.querySelector(`.${tableHeaderCellClassNames.content}`);
  if (!contentElement) {
    throw new Error(`Header content not found for ${headerName}`);
  }
  return contentElement;
};

const getVisibleColumnOrder = (store: Awaited<ReturnType<typeof createTestStore>>) => store.getState().getCurrentColumnVisualSettings()
  .filter((setting) => setting.isVisible)
  .map((setting) => setting.id);

const getColumnWidth = (store: Awaited<ReturnType<typeof createTestStore>>, columnId: string) => store.getState().getCurrentColumnVisualSettings().find((setting) => setting.id === columnId)?.widthPx;

const shiftClick = async (locator: Parameters<typeof userEvent.click>[0]) => {
  await userEvent.keyboard('{Shift>}');
  await userEvent.click(locator);
  await userEvent.keyboard('{/Shift}');
};

describe('Table', () => {
  it('renders visible columns and hides columns that are not initially visible', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store, {
      font: 'monospace',
      forceHorizontalOverflow: true,
      headerHeight: 6,
      rowHeight: 5,
      sx: { borderRadius: 1 },
    });

    await expect.element(getHeaderLocator(screen, 'Name')).toBeInTheDocument();
    await expect.element(getHeaderLocator(screen, 'Count')).toBeInTheDocument();
    await expect.element(getHeaderLocator(screen, 'Flag')).toBeInTheDocument();
    await expect.element(screen.getByText('Name 1', { exact: true })).toBeInTheDocument();
    expect(getHeaderLocator(screen, 'Hidden').query()).toBeNull();
  });

  it('calls onRowClick with the clicked row and emits a page click event when page events are enabled', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const onRowClick = vi.fn<NonNullable<TableProps<TestRow>['onRowClick']>>();
    const onClickEvent = vi.fn();
    const pageEventBus = container.resolve(PageEventBusService);
    pageEventBus.addEventListener('click', onClickEvent);

    const screen = await renderTable(store, {
      getRowName: (row) => row.name,
      onRowClick,
    }, (config) => {
      config.enablePageEvents = true;
    });

    await userEvent.click(screen.getByText('Name 3', { exact: true }));

    await expect.poll(() => onRowClick.mock.calls.length).toBe(1);
    expect(onRowClick.mock.calls[0][0].row.name).toBe('Name 3');
    expect(onClickEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'Name 3', type: 'table-row' }));
  });

  it('does not emit a page click event when page events are disabled', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const onRowClick = vi.fn<NonNullable<TableProps<TestRow>['onRowClick']>>();
    const onClickEvent = vi.fn();
    container.resolve(PageEventBusService).addEventListener('click', onClickEvent);

    const screen = await renderTable(store, {
      getRowName: (row) => row.name,
      onRowClick,
    }, (config) => {
      config.enablePageEvents = false;
    });

    await userEvent.click(screen.getByText('Name 2', { exact: true }));

    await expect.poll(() => onRowClick.mock.calls.length).toBe(1);
    expect(onClickEvent).not.toHaveBeenCalled();
  });

  it('does nothing on row click when no onRowClick is provided', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const onClickEvent = vi.fn();
    container.resolve(PageEventBusService).addEventListener('click', onClickEvent);

    const screen = await renderTable(store, {}, (config) => {
      config.enablePageEvents = true;
    });

    await userEvent.click(screen.getByText('Name 2', { exact: true }));

    await expect.element(screen.getByText('Name 2', { exact: true })).toBeInTheDocument();
    expect(onClickEvent).not.toHaveBeenCalled();
  });

  it('reports an error when onRowClick is provided without getRowName', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const errorEvents: ErrorEvent[] = [];
    const onWindowError = (event: ErrorEvent) => {
      errorEvents.push(event);
      event.preventDefault();
    };
    window.addEventListener('error', onWindowError);

    try {
      const screen = await renderTable(store, {
        onRowClick: vi.fn(),
      });

      await userEvent.click(screen.getByText('Name 2', { exact: true }));

      await expect.poll(() => errorEvents.length).toBe(1);
      expect(errorEvents[0].message).toContain('getRowName is required when onRowClick is provided');
    } finally {
      window.removeEventListener('error', onWindowError);
    }
  });

  it('calls onReadableIndexClick with the row when the readable index is clicked', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const onReadableIndexClick = vi.fn<NonNullable<TableProps<TestRow>['onReadableIndexClick']>>();

    const screen = await renderTable(store, {
      getRowName: (row) => row.name,
      onReadableIndexClick,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Open Name 2' }));

    await expect.poll(() => onReadableIndexClick.mock.calls.length).toBe(1);
    expect(onReadableIndexClick.mock.calls[0][0].name).toBe('Name 2');
  });

  it('shows the one-based row index when no readable index click handler is provided', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);

    await expect.element(screen.getByText('1', { exact: true })).toBeInTheDocument();
  });

  it('selects and deselects a row with its checkbox', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row' }).nth(0));
    await expect.poll(() => store.getState().selectedIds.includes('row-1000')).toBe(true);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row' }).nth(0));
    await expect.poll(() => store.getState().selectedIds.includes('row-1000')).toBe(false);
  });

  it('does not select rows for a shift-click without a previous click, but uses the clicked row as the anchor', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);

    await shiftClick(screen.getByRole('checkbox', { name: 'Select row' }).nth(2));
    await expect.poll(() => store.getState().selectedIds).toHaveLength(0);

    await shiftClick(screen.getByRole('checkbox', { name: 'Select row' }).nth(4));
    await expect.poll(() => store.getState().selectedIds.length).toBe(3);
    expect(store.getState().selectedIds).toEqual(expect.arrayContaining(['row-1002', 'row-1003', 'row-1004']));
  });

  it('selects a range of rows with shift-click and deselects a range when the clicked row is already selected', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row' }).nth(0));
    await shiftClick(screen.getByRole('checkbox', { name: 'Select row' }).nth(3));

    await expect.poll(() => store.getState().selectedIds).toHaveLength(4);
    expect([...store.getState().selectedIds].sort()).toEqual(['row-1000', 'row-1001', 'row-1002', 'row-1003']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row' }).nth(5));
    await shiftClick(screen.getByRole('checkbox', { name: 'Select row' }).nth(3));

    await expect.poll(() => store.getState().selectedIds).toHaveLength(3);
    expect([...store.getState().selectedIds].sort()).toEqual(['row-1000', 'row-1001', 'row-1002']);
  });

  it('emits row mouse enter and leave callbacks with the hovered row', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const onRowMouseEnter = vi.fn<NonNullable<TableProps<TestRow>['onRowMouseEnter']>>();
    const onRowMouseLeave = vi.fn<NonNullable<TableProps<TestRow>['onRowMouseLeave']>>();

    const screen = await renderTable(store, { onRowMouseEnter, onRowMouseLeave });

    await userEvent.hover(screen.getByText('Name 4', { exact: true }));
    await expect.poll(() => onRowMouseEnter.mock.calls.at(-1)?.[0]?.name).toBe('Name 4');

    await userEvent.hover(screen.getByText('Name 5', { exact: true }));
    await expect.poll(() => onRowMouseLeave.mock.calls.at(-1)?.[0]?.name).toBe('Name 4');
    await expect.poll(() => onRowMouseEnter.mock.calls.at(-1)?.[0]?.name).toBe('Name 5');
  });

  it('highlights the rows whose ids are emitted on the highlighting subject', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const rowHighlightingSubject = new Subject<string[]>([]);

    await renderTable(store, { rowHighlightingSubject });
    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);

    rowHighlightingSubject.next([]);
    rowHighlightingSubject.next(['row-1001']);

    await expect.poll(() => document.querySelector('[data-id="row-1001"]')?.classList.contains('highlighted')).toBe(true);

    rowHighlightingSubject.next(['row-1002']);

    await expect.poll(() => document.querySelector('[data-id="row-1001"]')?.classList.contains('highlighted')).toBe(false);
    await expect.poll(() => document.querySelector('[data-id="row-1002"]')?.classList.contains('highlighted')).toBe(true);

    rowHighlightingSubject.next([]);

    await expect.poll(() => document.querySelector('[data-id="row-1002"]')?.classList.contains('highlighted')).toBe(false);
  });

  it('resizes a column with the arrow keys and keeps the minimum width', async () => {
    const columns = createColumns();
    columns[2] = { ...columns[2], widthPx: 50 };
    columns[3] = { ...columns[3], widthPx: 120 };
    const store = await createTestStore(columns, createRows(ROW_COUNT));

    const screen = await renderTable(store);

    const countDivider = screen.getByRole('separator', { name: /Resize column Count/ }).element() as HTMLElement;
    countDivider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => getColumnWidth(store, 'count')).toBe(130);

    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => getColumnWidth(store, 'count')).toBe(120);

    const nameDivider = screen.getByRole('separator', { name: /Resize column Name/ }).element() as HTMLElement;
    nameDivider.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => getColumnWidth(store, 'name')).toBe(50);
  });

  it('ignores keys other than the arrow keys on a column divider', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);

    const countDivider = screen.getByRole('separator', { name: /Resize column Count/ }).element() as HTMLElement;
    const widthBeforeKeyPress = getColumnWidth(store, 'count');
    countDivider.focus();
    await userEvent.keyboard('a');
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });

    expect(getColumnWidth(store, 'count')).toBe(widthBeforeKeyPress);
    expect(store.getState().getCurrentColumnVisualSettings().find((setting) => setting.id === 'count')?.hasResized).toBeFalsy();
  });

  it('resizes a column by dragging its divider with the mouse', async () => {
    const columns = createColumns();
    columns[2] = { ...columns[2], widthPx: 50 };
    columns[3] = { ...columns[3], widthPx: 120 };
    const store = await createTestStore(columns, createRows(ROW_COUNT));

    const screen = await renderTable(store);

    const countDivider = screen.getByRole('separator', { name: /Resize column Count/ }).element();
    dispatchMouseEvent(countDivider, 'mousedown', { clientX: 300, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 300, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 290, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 330, clientY: 20 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 330, clientY: 20 });

    await expect.poll(() => getColumnWidth(store, 'count')).toBe(150);
  });

  it('stops resizing when the table is unmounted during a mouse drag', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);

    const countDivider = screen.getByRole('separator', { name: /Resize column Count/ }).element();
    dispatchMouseEvent(countDivider, 'mousedown', { clientX: 300, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 320, clientY: 20 });

    await screen.unmount();

    dispatchMouseEvent(document, 'mousemove', { clientX: 400, clientY: 20 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 400, clientY: 20 });

    expect(document.querySelector('[data-virtuoso-scroller="true"]')).toBeNull();
  });

  it('applies condensed, visibility, order and reset events from the table event bus', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);

    store.getState().emitEvent('condensedChange', true);
    await expect.poll(() => store.getState().isCondensed).toBe(true);

    store.getState().emitEvent('columnVisibilityChange', ['name', 'flag', 'option', 'date']);
    await expect.element(getHeaderLocator(screen, 'Count')).not.toBeInTheDocument();
    await expect.element(getHeaderLocator(screen, 'Name')).toBeInTheDocument();

    store.getState().emitEvent('columnOrderChange', ['flag', 'name', 'option', 'date', 'count']);
    await expect.poll(() => getVisibleColumnOrder(store)[0]).toBe('flag');

    store.getState().emitEvent('reset');
    await expect.element(getHeaderLocator(screen, 'Count')).toBeInTheDocument();
    await expect.poll(() => getVisibleColumnOrder(store)[0]).not.toBe('flag');
  });

  it('opens the columns editor dialog on the openColumnsEditorDialog event', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);

    store.getState().emitEvent('openColumnsEditorDialog', () => true);

    await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('scrolls to an index and calls the callback once it is rendered', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const tableRef = createRef<TableRef>();
    const onScrolledToIndex = vi.fn();

    await renderTable(store, { ref: tableRef });
    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);

    tableRef.current?.scrollToIndex(80, onScrolledToIndex);

    await expect.poll(() => onScrolledToIndex.mock.calls.length, { timeout: 3000 }).toBe(1);
    expect(getScrollerElement()?.scrollTop).toBeGreaterThan(0);
  });

  it('scrolls to an index without a callback', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const tableRef = createRef<TableRef>();

    await renderTable(store, { ref: tableRef });
    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);

    tableRef.current?.scrollToIndex(60);

    await expect.poll(() => getScrollerElement()?.scrollTop ?? 0).toBeGreaterThan(0);
  });

  it('sets the vertical scroll position through the ref', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const tableRef = createRef<TableRef>();

    await renderTable(store, { ref: tableRef });

    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);
    tableRef.current?.setVerticalScrollPosition(300);

    await expect.poll(() => getScrollerElement()?.scrollTop).toBeGreaterThan(200);
  });

  it('reports the rendered range, vertical scroll position and visible item index while scrolling', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const onRangeChanged = vi.fn();
    const onVerticalScrollPositionChange = vi.fn<NonNullable<TableProps<TestRow>['onVerticalScrollPositionChange']>>();
    const onVisibleItemIndexChange = vi.fn<NonNullable<TableProps<TestRow>['onVisibleItemIndexChange']>>();

    await renderTable(store, {
      onRangeChanged,
      onVerticalScrollPositionChange,
      onVisibleItemIndexChange,
    });

    await expect.poll(() => onRangeChanged.mock.calls.length).toBeGreaterThan(0);

    const scrollerElement = getScrollerElement();
    if (scrollerElement) {
      scrollerElement.scrollTop = 500;
    }

    await expect.poll(() => onVerticalScrollPositionChange.mock.calls.at(-1)?.[0]).toBeGreaterThan(0);
    await expect.poll(() => onVisibleItemIndexChange.mock.calls.at(-1)?.[0]).toBeGreaterThan(0);
  });

  it('renders more rows when the overscan is increased', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store, {
      overscanMain: 2000,
      overscanReverse: 2000,
    });

    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(40);
    expect(getHeaderLocator(screen, 'Name').element()).toBeTruthy();
  });

  it('moves a column to the right when its header is dragged across the next column', async () => {
    const dragColumns: TableColumn<TestRow>[] = [
      {
        headerName: 'Name',
        id: 'name',
        isInitiallyVisible: true,
        type: 'text',
        valueGetter: ({ row }) => row.name,
        widthPx: 200,
      },
      {
        headerName: 'Count',
        id: 'count',
        isInitiallyVisible: true,
        type: 'number',
        valueGetter: ({ row }) => row.count,
        widthPx: 200,
      },
      {
        headerName: 'Flag',
        id: 'flag',
        isInitiallyVisible: true,
        type: 'boolean',
        valueGetter: ({ row }) => row.flag,
        widthPx: 200,
      },
    ];
    const store = await createTestStore(dragColumns, createRows(ROW_COUNT));

    const screen = await renderTable(store);

    const nameContent = getHeaderContent(screen, 'Name');
    dispatchMouseEvent(nameContent, 'mousedown', { clientX: 100, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 110, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 900, clientY: 20 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 900, clientY: 20 });

    await expect.poll(() => getVisibleColumnOrder(store)).not.toEqual(['name', 'count', 'flag']);
  });

  it('moves a column to the left when its header is dragged across the previous column', async () => {
    const dragColumns: TableColumn<TestRow>[] = [
      {
        headerName: 'Name',
        id: 'name',
        isInitiallyVisible: true,
        type: 'text',
        valueGetter: ({ row }) => row.name,
        widthPx: 200,
      },
      {
        headerName: 'Count',
        id: 'count',
        isInitiallyVisible: true,
        type: 'number',
        valueGetter: ({ row }) => row.count,
        widthPx: 200,
      },
      {
        headerName: 'Flag',
        id: 'flag',
        isInitiallyVisible: true,
        type: 'boolean',
        valueGetter: ({ row }) => row.flag,
        widthPx: 200,
      },
    ];
    const store = await createTestStore(dragColumns, createRows(ROW_COUNT));

    const screen = await renderTable(store);

    const flagContent = getHeaderContent(screen, 'Flag');
    dispatchMouseEvent(flagContent, 'mousedown', { clientX: 500, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 490, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 100, clientY: 20 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 100, clientY: 20 });

    await expect.poll(() => getVisibleColumnOrder(store)).not.toEqual(['name', 'count', 'flag']);
  });

  it('keeps the header and visible column order when the window is resized', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);
    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);
    const visibleOrderBeforeResize = getVisibleColumnOrder(store);

    window.dispatchEvent(new Event('resize'));

    await expect.element(getHeaderLocator(screen, 'Count')).toBeInTheDocument();
    expect(getVisibleColumnOrder(store)).toEqual(visibleOrderBeforeResize);
  });

  it('keeps a resized column width after the debounced save delay', async () => {
    const columns = createColumns();
    columns[3] = { ...columns[3], widthPx: 120 };
    const store = await createTestStore(columns, createRows(ROW_COUNT));

    const screen = await renderTable(store);
    const countDivider = screen.getByRole('separator', { name: /Resize column Count/ }).element() as HTMLElement;
    countDivider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => getColumnWidth(store, 'count')).toBe(130);

    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });

    expect(getColumnWidth(store, 'count')).toBe(130);
  });

  it('keeps a column at its minimum width when dragged further left', async () => {
    const columns = createColumns();
    columns[3] = { ...columns[3], widthPx: 50 };
    const store = await createTestStore(columns, createRows(ROW_COUNT));

    const screen = await renderTable(store);
    const countDivider = screen.getByRole('separator', { name: /Resize column Count/ }).element() as HTMLElement;
    dispatchMouseEvent(countDivider, 'mousedown', { clientX: 500, clientY: 20 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 450, clientY: 20 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 450, clientY: 20 });

    expect(getColumnWidth(store, 'count')).toBe(50);
  });

  it('ignores vertical scroll requests before the table is initialized', async () => {
    const store = createTableStore<TestRow>({
      defaultSortByField: 'count',
      idSelectorCallback: (row) => row.id,
    });
    store.getState().setColumns(createColumns());
    store.getState().setBaseData(createRows(ROW_COUNT));
    const tableRef = createRef<TableRef>();

    await renderTable(store, { ref: tableRef });
    tableRef.current?.setVerticalScrollPosition(300);

    expect(getScrollerElement()).toBeNull();
  });

  it('renders the header without rows when there is no data', async () => {
    const store = await createTestStore(createColumns(), createRows(0));

    const screen = await renderTable(store);

    await expect.element(getHeaderLocator(screen, 'Name')).toBeInTheDocument();
    await expect.poll(() => getRenderedRowCount()).toBe(0);
  });

  it('reports the rendered range again when the base data changes', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));
    const onRangeChanged = vi.fn();

    await renderTable(store, { onRangeChanged });
    await expect.poll(() => onRangeChanged.mock.calls.length).toBeGreaterThan(0);
    const callCountBeforeDataChange = onRangeChanged.mock.calls.length;

    store.getState().setBaseData(createRows(50));

    await expect.poll(() => onRangeChanged.mock.calls.length).toBeGreaterThan(callCountBeforeDataChange);
  });

  it('keeps rendering rows when the filters are set to empty', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    await renderTable(store);
    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);

    store.getState().setFilters([], [], []);

    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);
  });

  it('re-renders the rows with fewer matches when a frontend filter with a value is applied', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    await renderTable(store);
    await expect.poll(() => getRenderedRowIds()).toContain('row-1001');

    const nameFilter = new TextFilter({
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: DEFAULT_FILTER_GROUP,
      id: 'name',
      label: 'name',
    });
    store.getState().setFilters([nameFilter], [], [DEFAULT_FILTER_GROUP]);
    await store.getState().setFilterValues({ [nameFilter.id]: 'Name 1' });

    await expect.poll(() => getRenderedRowIds()).not.toContain('row-1001');
    expect(getRenderedRowIds()).toContain('row-1000');
  });

  it('ignores window resizes when the table has no columns', async () => {
    const store = await createTestStore([], createRows(ROW_COUNT));

    await renderTable(store);
    await expect.poll(() => getScrollerElement() !== null).toBe(true);

    window.dispatchEvent(new Event('resize'));

    expect(getVisibleColumnOrder(store)).toEqual([]);
  });

  it('removes the header and cells of a column that is removed after initialization', async () => {
    const store = await createTestStore(createColumns(), createRows(ROW_COUNT));

    const screen = await renderTable(store);
    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);

    store.getState().setColumns(createColumns().filter((column) => column.id !== 'name'));

    await expect.poll(() => getHeaderLocator(screen, 'Name').query()).toBeNull();
    await expect.element(getHeaderLocator(screen, 'Count')).toBeInTheDocument();
  });

  it('renders cell titles, custom cell content and an empty title for non-numeric number values', async () => {
    const store = await createTestStore(createCustomColumns(), createRows(ROW_COUNT));

    await renderTable(store);

    await expect.poll(() => document.querySelector('[data-id="name"][title="Title Name 1"]')).not.toBeNull();
    await expect.poll(() => document.querySelector('[data-id="row-1000"]')?.textContent).toContain('Rendered Name 1');
    await expect.poll(() => document.querySelector('[data-id="row-1000"]')?.textContent).toContain('Display Name 1');
    expect(document.querySelector('[data-id="row-1000"] [data-id="number"]')?.getAttribute('title')).toBe('');
  });

  it('applies the cell color only while the table is condensed', async () => {
    const store = await createTestStore(createCustomColumns(), createRows(ROW_COUNT));

    await renderTable(store);
    await expect.poll(() => document.querySelector('[data-id="name"][title="Title Name 1"]')).not.toBeNull();

    const getNameCellBackground = () => {
      const cell = document.querySelector<HTMLElement>('[data-id="name"][title="Title Name 1"]');
      return cell ? getComputedStyle(cell).backgroundColor : null;
    };

    expect(getNameCellBackground()).not.toBe('rgb(255, 0, 0)');

    store.getState().setIsCondensed(true);
    await expect.poll(getNameCellBackground).toBe('rgb(255, 0, 0)');

    store.getState().setIsCondensed(false);
    await expect.poll(getNameCellBackground).not.toBe('rgb(255, 0, 0)');
  });

  it('renders rows when no row enabled callback is configured', async () => {
    const store = createTableStore<TestRow>({
      defaultSortByField: 'count',
      idSelectorCallback: (row) => row.id,
    });
    store.getState().setColumns(createColumns());
    store.getState().setBaseData(createRows(ROW_COUNT));
    await store.getState().initialize(new AbortController().signal);

    await renderTable(store);

    await expect.poll(() => getRenderedRowCount()).toBeGreaterThan(0);
  });
});
