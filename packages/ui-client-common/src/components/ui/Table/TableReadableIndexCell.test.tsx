import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import { PageEventBusService } from '../../../classes/services/PageEventBusService';
import type {
  TableColumnReadableIndex,
  TableRowParams,
} from '../../../models/table.models';
import {
  FIXED_COLUMN_ID,
  TABLE_COLUMN_FROZEN,
} from '../../../models/table.models';
import { renderComponent } from '../../../test/lib';

import type { TableReadableIndexCellProps } from './TableReadableIndexCell';
import { TableReadableIndexCell } from './TableReadableIndexCell';

type TestRow = {
  id: string;
  name: string;
};

const ROW: TestRow = {
  id: 'row-1',
  name: 'Name 1',
};

const getRowName = (row: TestRow) => row.name;

const createCell = (rowIndex = 1): TableRowParams<TestRow, null> => ({
  dataContext: null,
  id: `row-${rowIndex}`,
  row: ROW,
  rowIndex,
});

const createTableColumn = (): TableColumnReadableIndex<TestRow> => ({
  disableEllipsis: true,
  frozen: TABLE_COLUMN_FROZEN.LEFT,
  getAriaLabel: ({ row }) => `Open ${row.name}`,
  id: FIXED_COLUMN_ID.READABLE_INDEX,
  isInitiallyVisible: true,
  resizable: false,
  type: 'readableIndex',
});

// Returns the element directly below the document body, which is the React root that receives click events.
const getReactRootElement = (element: Element) => {
  let rootElement = element;
  while (rootElement.parentElement && rootElement.parentElement !== document.body) {
    rootElement = rootElement.parentElement;
  }
  return rootElement;
};

describe('TableReadableIndexCell', () => {
  it('should render the one-based row index as plain text when no click callback is provided', async () => {
    // onReadableIndexClick is intentionally omitted to exercise the plain-text branch.
    const plainTextProps = {
      cell: createCell(1),
      tableColumn: createTableColumn(),
    } as TableReadableIndexCellProps<TestRow, null>;
    const screen = await renderComponent(
      <TableReadableIndexCell<TestRow, null> {...plainTextProps} />,
    );

    await expect.element(screen.getByText('2', { exact: true })).toBeInTheDocument();
    expect(page.getByRole('button').query()).toBeNull();
  });

  it('should render a button labelled with the column aria label and showing the one-based row index', async () => {
    const screen = await renderComponent(
      <TableReadableIndexCell<TestRow, null>
        cell={createCell(4)}
        getRowName={getRowName}
        onReadableIndexClick={vi.fn()}
        tableColumn={createTableColumn()}
      />,
    );

    const button = screen.getByRole('button', { exact: true, name: 'Open Name 1' });
    await expect.element(button).toBeVisible();
    await expect.element(button).toHaveTextContent('5');
  });

  it('should call onReadableIndexClick with the row when the button is clicked', async () => {
    const onReadableIndexClick = vi.fn();
    const screen = await renderComponent(
      <TableReadableIndexCell<TestRow, null>
        cell={createCell(1)}
        getRowName={getRowName}
        onReadableIndexClick={onReadableIndexClick}
        tableColumn={createTableColumn()}
      />,
    );

    await screen.getByRole('button', { exact: true, name: 'Open Name 1' }).click();

    expect(onReadableIndexClick).toHaveBeenCalledTimes(1);
    expect(onReadableIndexClick).toHaveBeenCalledWith(ROW);
  });

  it('should prevent the default action and stop propagation of the click', async () => {
    const onDocumentBodyClick = vi.fn();
    const onReadableIndexClick = vi.fn();
    const screen = await renderComponent(
      <TableReadableIndexCell<TestRow, null>
        cell={createCell(1)}
        getRowName={getRowName}
        onReadableIndexClick={onReadableIndexClick}
        tableColumn={createTableColumn()}
      />,
    );

    const button = screen.getByRole('button', { exact: true, name: 'Open Name 1' });
    const reactRootElement = getReactRootElement(button.element());
    let isDefaultPreventedAtRoot = false;
    const onRootClick = (event: Event) => {
      isDefaultPreventedAtRoot = event.defaultPrevented;
    };
    reactRootElement.addEventListener('click', onRootClick);
    document.body.addEventListener('click', onDocumentBodyClick);

    await button.click();

    expect(onReadableIndexClick).toHaveBeenCalledTimes(1);
    expect(onDocumentBodyClick).not.toHaveBeenCalled();
    expect(isDefaultPreventedAtRoot).toBe(true);
    reactRootElement.removeEventListener('click', onRootClick);
    document.body.removeEventListener('click', onDocumentBodyClick);
  });

  it('should report an error when a click callback is provided without getRowName', async () => {
    const onReadableIndexClick = vi.fn();
    const screen = await renderComponent(
      <TableReadableIndexCell<TestRow, null>
        cell={createCell(1)}
        onReadableIndexClick={onReadableIndexClick}
        tableColumn={createTableColumn()}
      />,
    );

    // The handler throws inside a React event listener, so the error surfaces as an uncaught window error.
    const errorEvents: ErrorEvent[] = [];
    const onWindowError = (event: ErrorEvent) => {
      errorEvents.push(event);
      event.preventDefault();
    };
    window.addEventListener('error', onWindowError);

    await screen.getByRole('button', { exact: true, name: 'Open Name 1' }).click();

    await expect.poll(() => errorEvents.length).toBe(1);
    expect(errorEvents[0].message).toContain('getRowName is required when onReadableIndexClick is provided');
    expect(onReadableIndexClick).not.toHaveBeenCalled();
    window.removeEventListener('error', onWindowError);
  });

  it('should emit a table row index page click event when page events are enabled', async () => {
    const onClickEvent = vi.fn();
    container.resolve(PageEventBusService).addEventListener('click', onClickEvent);
    const screen = await renderComponent(
      <TableReadableIndexCell<TestRow, null>
        cell={createCell(1)}
        getRowName={getRowName}
        onReadableIndexClick={vi.fn()}
        tableColumn={createTableColumn()}
      />,
      {
        configure: (config) => {
          config.enablePageEvents = true;
        },
      },
    );

    await screen.getByRole('button', { exact: true, name: 'Open Name 1' }).click();

    expect(onClickEvent).toHaveBeenCalledTimes(1);
    expect(onClickEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'Name 1', type: 'table-row-index' }));
  });

  it('should not emit a page click event when page events are disabled', async () => {
    const onClickEvent = vi.fn();
    container.resolve(PageEventBusService).addEventListener('click', onClickEvent);
    const onReadableIndexClick = vi.fn();
    const screen = await renderComponent(
      <TableReadableIndexCell<TestRow, null>
        cell={createCell(1)}
        getRowName={getRowName}
        onReadableIndexClick={onReadableIndexClick}
        tableColumn={createTableColumn()}
      />,
      {
        configure: (config) => {
          config.enablePageEvents = false;
        },
      },
    );

    await screen.getByRole('button', { exact: true, name: 'Open Name 1' }).click();

    expect(onReadableIndexClick).toHaveBeenCalledTimes(1);
    expect(onClickEvent).not.toHaveBeenCalled();
  });
});
