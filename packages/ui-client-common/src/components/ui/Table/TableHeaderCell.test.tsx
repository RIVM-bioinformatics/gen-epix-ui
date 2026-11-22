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
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '../../../classes/abstracts/FilterAbstract';
import { TextFilter } from '../../../classes/filters/TextFilter';
import {
  FIXED_COLUMN_ID,
  TABLE_COLUMN_FROZEN,
} from '../../../models/table.models';
import type { TableColumn } from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { tableHeaderCellClassNames } from './classNames';
import { TableHeaderCell } from './TableHeaderCell';

type CreateStoreOptions = {
  readonly defaultSortByField?: string;
  readonly withNameFilter?: boolean;
};

type RenderHeaderCellOptions = {
  readonly column?: TableColumn<TestRow, TestDataContext>;
  readonly onColumnDividerKeyDown?: (...args: unknown[]) => void;
  readonly onColumnDividerMouseDown?: (...args: unknown[]) => void;
  readonly onCustomDrag?: (...args: unknown[]) => void;
  readonly store?: TestStore;
};

type TestDataContext = {
  label: string;
};

type TestRow = {
  id: string;
  name: string;
};

type TestStore = Awaited<ReturnType<typeof createStore>>;

const ROWS: TestRow[] = [
  {
    id: 'row-1',
    name: 'Alpha',
  },
  {
    id: 'row-2',
    name: 'Beta',
  },
];
const DATA_CONTEXT: TestDataContext = {
  label: 'Context',
};
const CELL_WIDTH = 160;
const CELL_HEIGHT = '40px';
const DIVIDER_COLOR = '#cccccc';
const ACTIVE_FILTER_CLASS_NAME = `${tableHeaderCellClassNames.filterLabelIcon}--active`;
const FOCUS_CLASS_NAME = `${tableHeaderCellClassNames.root}--focus`;

const sortByNameComparatorFactory = () => (rowA: TestRow, rowB: TestRow) => rowA.name.localeCompare(rowB.name);

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

const createSortableColumn = (
  overrides: Partial<Omit<TableColumn<TestRow, TestDataContext>, 'type'>> = {},
): TableColumn<TestRow, TestDataContext> => createColumn({
  comparatorFactory: sortByNameComparatorFactory,
  ...overrides,
});

const createStore = async ({
  defaultSortByField = 'other',
  withNameFilter = false,
}: CreateStoreOptions = {}) => {
  const store = createTableStore<TestRow, TestDataContext>({
    defaultSortByField,
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: () => true,
  });
  store.getState().setColumns([
    createSortableColumn(),
    createSortableColumn({ headerName: 'Other', id: 'other' }),
  ]);
  store.getState().setBaseData(ROWS);
  await store.getState().initialize(new AbortController().signal);

  if (withNameFilter) {
    const nameFilter = new TextFilter({
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: DEFAULT_FILTER_GROUP,
      id: 'name',
      label: 'Name',
    });
    store.getState().setFilters([nameFilter], [], [DEFAULT_FILTER_GROUP]);
  }
  return store;
};

const renderHeaderCell = async ({
  column = createSortableColumn(),
  onColumnDividerKeyDown = vi.fn(),
  onColumnDividerMouseDown = vi.fn(),
  onCustomDrag,
  store,
}: RenderHeaderCellOptions = {}) => {
  const tableStore = store ?? await createStore();
  tableStore.setState({ dataContext: DATA_CONTEXT });
  await renderComponent(
    <TableStoreContextProvider store={tableStore}>
      <div style={{ height: 400, width: 800 }}>
        <TableHeaderCell<TestRow, TestDataContext>
          column={column}
          columnIndex={0}
          dividerColor={DIVIDER_COLOR}
          height={CELL_HEIGHT}
          onColumnDividerKeyDown={onColumnDividerKeyDown}
          onColumnDividerMouseDown={onColumnDividerMouseDown}
          onCustomDrag={onCustomDrag}
          order={0}
          width={CELL_WIDTH}
        />
      </div>
    </TableStoreContextProvider>,
  );
  return { column, store: tableStore };
};

const dispatchMouseEvent = (target: EventTarget, type: string, init: MouseEventInit = {}) => {
  target.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    ...init,
  }));
};

const getHeaderCell = () => page.getByRole('columnheader');
const getHeaderCellElement = () => getHeaderCell().element() as HTMLElement;
const getContent = (name: string = 'Name') => page.getByText(name, { exact: true });
const getContentElement = (name: string = 'Name') => getContent(name).element() as HTMLElement;
const getSortButton = (name: string = 'Name') => page.getByRole('button', { exact: true, name: `Toggle sorting for ${name}` });
const getFilterButton = (name: string = 'Name') => page.getByRole('button', { exact: true, name: `Show filter for ${name}` });
const getCustomIconButton = () => page.getByRole('button', { exact: true, name: 'Custom action' });
const getResizeSeparator = (name: string = 'Name') => page.getByRole('separator', { exact: true, name: `Resize column ${name}, use arrow keys to adjust the size.` });
const getTextbox = () => page.getByRole('textbox', { exact: true, name: 'Name' });
const getApplyButton = () => page.getByRole('button', { exact: true, name: 'Apply' });

const getAriaSort = () => getHeaderCellElement().getAttribute('aria-sort');

describe('TableHeaderCell', () => {
  it('should render the header name with the columnheader role and data attributes', async () => {
    await renderHeaderCell();

    const headerCell = getHeaderCellElement();
    expect(headerCell.getAttribute('data-id')).toBe('name');
    expect(headerCell.getAttribute('data-column-index')).toBe('0');
    expect(headerCell.getAttribute('data-frozen')).toBe('0');
    await expect.element(getContent()).toBeVisible();
  });

  it('should render the resize separator when the column is resizable', async () => {
    await renderHeaderCell();

    expect(getResizeSeparator().query()).not.toBeNull();
  });

  it('should not render the resize separator when the column is not resizable', async () => {
    await renderHeaderCell({ column: createSortableColumn({ resizable: false }) });

    expect(getResizeSeparator().query()).toBeNull();
  });

  it('should use unknown in the sort, filter and resize labels when the column has no header name', async () => {
    const store = await createStore({ withNameFilter: true });
    await renderHeaderCell({ column: createSortableColumn({ headerName: undefined }), store });

    const headerCellElement = getHeaderCellElement();
    expect(headerCellElement.querySelector('[title="Toggle sorting for unknown"]')).not.toBeNull();
    expect(headerCellElement.querySelector('[title="Show filter for unknown"]')).not.toBeNull();
    expect(headerCellElement.querySelector('[aria-label="Resize column unknown, use arrow keys to adjust the size."]')).not.toBeNull();
  });

  it('should render the header content from renderHeaderContent instead of the header name', async () => {
    await renderHeaderCell({
      column: createSortableColumn({
        renderHeaderContent: () => (
          <span>
            {'Custom header content'}
          </span>
        ),
      }),
    });

    await expect.element(page.getByText('Custom header content', { exact: true })).toBeVisible();
    expect(getContent().query()).toBeNull();
  });

  it('should render the header from renderHeader in place of the header content', async () => {
    await renderHeaderCell({
      column: createSortableColumn({
        renderHeader: () => (
          <span>
            {'Fully custom header'}
          </span>
        ),
      }),
    });

    await expect.element(page.getByText('Fully custom header', { exact: true })).toBeVisible();
    expect(getContent().query()).toBeNull();
  });

  it('should show the header tooltip content when the header content is hovered', async () => {
    await renderHeaderCell({
      column: createSortableColumn({ headerTooltipContent: 'Name tooltip' }),
    });

    await getContent().hover();

    await expect.element(page.getByText('Name tooltip', { exact: true })).toBeVisible();
  });

  it('should render only the visually hidden Actions label for an actions column', async () => {
    const actionsColumn = {
      frozen: TABLE_COLUMN_FROZEN.RIGHT,
      getActions: () => [],
      id: FIXED_COLUMN_ID.ACTIONS,
      isInitiallyVisible: true,
      resizable: false,
      type: 'actions',
    } as TableColumn<TestRow, TestDataContext>;
    await renderHeaderCell({ column: actionsColumn });

    expect(page.getByText('Actions', { exact: true }).query()).not.toBeNull();
    expect(page.getByRole('button').query()).toBeNull();
    expect(getResizeSeparator('Actions').query()).toBeNull();
  });

  it('should show ascending aria-sort after the first content click and toggle direction on each further click', async () => {
    await renderHeaderCell();
    expect(getAriaSort()).toBeNull();

    await getContent().click();
    await expect.poll(getAriaSort).toBe('ascending');

    await getContent().click();
    await expect.poll(getAriaSort).toBe('descending');
  });

  it('should reverse a descending sort to ascending when the header content is clicked', async () => {
    const store = await createStore();
    await store.getState().setSorting('name', 'desc');
    await renderHeaderCell({ store });

    await expect.poll(getAriaSort).toBe('descending');

    await getContent().click();

    await expect.poll(getAriaSort).toBe('ascending');
  });

  it('should toggle the sort direction when the sort button is clicked', async () => {
    await renderHeaderCell();

    await getHeaderCell().hover();
    await getSortButton().click();
    await expect.poll(getAriaSort).toBe('ascending');

    await getSortButton().click();
    await expect.poll(getAriaSort).toBe('descending');
  });

  it('should not sort when the header content is clicked on a column without a comparator', async () => {
    const store = await createStore({ withNameFilter: true });
    await renderHeaderCell({ column: createColumn(), store });

    await getContent().click();

    expect(store.getState().sortByField).toBe('other');
    expect(getAriaSort()).toBeNull();
    expect(getSortButton().query()).toBeNull();
  });

  it.each([
    {
      column: createColumn(),
      description: 'a plain column',
      expectedTabIndex: -1,
      withNameFilter: false,
    },
    {
      column: createSortableColumn(),
      description: 'a sortable column',
      expectedTabIndex: 0,
      withNameFilter: false,
    },
    {
      column: createColumn(),
      description: 'a filterable column',
      expectedTabIndex: 0,
      withNameFilter: true,
    },
    {
      column: createColumn({
        customHeaderIcon: {
          iconElement: <span />,
          label: 'Custom action',
          onClick: vi.fn(),
        },
      }),
      description: 'a column with a custom header icon',
      expectedTabIndex: 0,
      withNameFilter: false,
    },
  ])('should set tabIndex $expectedTabIndex for $description', async ({ column, expectedTabIndex, withNameFilter }) => {
    const store = await createStore({ withNameFilter });
    await renderHeaderCell({ column, store });

    expect(getHeaderCellElement().tabIndex).toBe(expectedTabIndex);
  });

  it('should call the custom header icon onClick with the column and data context', async () => {
    const onClick = vi.fn();
    const column = createSortableColumn({
      customHeaderIcon: {
        iconElement: <span />,
        label: 'Custom action',
        onClick,
      },
    });
    await renderHeaderCell({ column });

    await getHeaderCell().hover();
    await getCustomIconButton().click();

    expect(onClick).toHaveBeenCalledExactlyOnceWith({ column, dataContext: DATA_CONTEXT });
  });

  it('should open the filter popover from the filter button and close it when the button is clicked again', async () => {
    const store = await createStore({ withNameFilter: true });
    await renderHeaderCell({ store });

    await getHeaderCell().hover();
    const headerCellElement = getHeaderCellElement();
    const filterButtonElement = getFilterButton().element() as HTMLElement;
    await getFilterButton().click();

    await expect.element(getTextbox()).toBeVisible();
    expect(headerCellElement.classList.contains(FOCUS_CLASS_NAME)).toBe(true);

    filterButtonElement.click();

    await expect.poll(() => getTextbox().query()).toBeNull();
  });

  it('should apply the filter, close the popover and mark the filter button as active', async () => {
    const store = await createStore({ withNameFilter: true });
    await renderHeaderCell({ store });

    await getHeaderCell().hover();
    const filterButtonElement = getFilterButton().element() as HTMLElement;
    await getFilterButton().click();
    await getTextbox().fill('Alpha');
    await getApplyButton().click();

    await expect.poll(() => getTextbox().query()).toBeNull();
    await expect.poll(() => filterButtonElement.classList.contains(ACTIVE_FILTER_CLASS_NAME)).toBe(true);
  });

  it('should close the filter popover on Escape and return focus to the filter button', async () => {
    const store = await createStore({ withNameFilter: true });
    await renderHeaderCell({ store });

    await getHeaderCell().hover();
    const filterButtonElement = getFilterButton().element() as HTMLElement;
    await getFilterButton().click();
    await expect.element(getTextbox()).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.poll(() => getTextbox().query()).toBeNull();
    await expect.poll(() => document.activeElement).toBe(filterButtonElement);
  });

  it('should start a drag with start, move and end events and suppress the next header click', async () => {
    const onCustomDrag = vi.fn();
    const { column } = await renderHeaderCell({ onCustomDrag });

    const contentElement = getContentElement();
    dispatchMouseEvent(contentElement, 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 80, clientY: 15 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 100, clientY: 25 });

    expect((onCustomDrag.mock.calls as Array<[{ type: string }]>).map(([event]) => event.type)).toEqual(['start', 'move', 'move', 'end']);
    expect(onCustomDrag).toHaveBeenCalledWith(expect.objectContaining({ clientX: 50, clientY: 10, type: 'start' }), column);
    expect(onCustomDrag).toHaveBeenLastCalledWith(expect.objectContaining({ deltaX: 50, deltaY: 15, type: 'end' }), column);

    await getContent().click();
    expect(getAriaSort()).toBeNull();

    await getContent().click();
    await expect.poll(getAriaSort).toBe('ascending');
  });

  it('should still sort on click after a drag when no custom drag handler is given', async () => {
    await renderHeaderCell();

    const contentElement = getContentElement();
    dispatchMouseEvent(contentElement, 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 60, clientY: 12 });

    await getContent().click();

    await expect.poll(getAriaSort).toBe('ascending');
  });

  it('should not start a drag from a non-primary button or from outside the header content', async () => {
    const onCustomDrag = vi.fn();
    await renderHeaderCell({ onCustomDrag });

    dispatchMouseEvent(getContentElement(), 'mousedown', { button: 2, clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 60, clientY: 12 });

    dispatchMouseEvent(getHeaderCellElement(), 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 60, clientY: 12 });

    expect(onCustomDrag).not.toHaveBeenCalled();
  });

  it('should not start a drag on a frozen header cell', async () => {
    const onCustomDrag = vi.fn();
    await renderHeaderCell({
      column: createSortableColumn({ frozen: TABLE_COLUMN_FROZEN.LEFT }),
      onCustomDrag,
    });

    dispatchMouseEvent(getContentElement(), 'mousedown', { clientX: 50, clientY: 10 });
    dispatchMouseEvent(document, 'mousemove', { clientX: 60, clientY: 12 });
    dispatchMouseEvent(document, 'mouseup', { clientX: 60, clientY: 12 });

    expect(onCustomDrag).not.toHaveBeenCalled();
  });

  it('should call onColumnDividerMouseDown when the resize separator is pressed with the primary button', async () => {
    const onColumnDividerMouseDown = vi.fn();
    const { column } = await renderHeaderCell({ onColumnDividerMouseDown });

    dispatchMouseEvent(getResizeSeparator().element(), 'mousedown', { clientX: 120, clientY: 10 });

    expect(onColumnDividerMouseDown).toHaveBeenCalledWith(expect.objectContaining({ type: 'mousedown' }), column);
  });

  it('should ignore non-primary button presses on the resize separator', async () => {
    const onColumnDividerMouseDown = vi.fn();
    await renderHeaderCell({ onColumnDividerMouseDown });

    dispatchMouseEvent(getResizeSeparator().element(), 'mousedown', { button: 2, clientX: 120, clientY: 10 });

    expect(onColumnDividerMouseDown).not.toHaveBeenCalled();
  });

  it('should call onColumnDividerKeyDown when a key is pressed on the focused resize separator', async () => {
    const onColumnDividerKeyDown = vi.fn();
    const { column } = await renderHeaderCell({ onColumnDividerKeyDown });

    const separatorElement = getResizeSeparator().element() as HTMLElement;
    separatorElement.focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(onColumnDividerKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'ArrowRight' }), column);
  });
});
