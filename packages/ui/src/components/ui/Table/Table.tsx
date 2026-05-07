import {
  type SxProps,
  type Theme,
} from '@mui/material';
import {
  alpha,
  Box,
  darken,
  lighten,
  useTheme,
} from '@mui/material';
import isNumber from 'lodash/isNumber';
import noop from 'lodash/noop';
import omit from 'lodash/omit';
import sumBy from 'lodash/sumBy';
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  Ref,
} from 'react';
import {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import type {
  FillerRowProps,
  ItemProps,
  ListRange,
  TableBodyProps,
  TableVirtuosoHandle,
  TableProps as VirtuosoTableProps,
} from 'react-virtuoso';
import { TableVirtuoso } from 'react-virtuoso';
import { useDebouncedCallback } from 'use-debounce';
import { useShallow } from 'zustand/shallow';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { PageEventBusManager } from '../../../classes/managers/PageEventBusManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { useScrollbarSize } from '../../../hooks/useScrollbarSize';
import type {
  TableColumn,
  TableColumnParams,
  TableColumnReadableIndex,
  TableColumnSelectable,
  TableColumnVisualSettings,
  TableDragEvent,
  TableRowParams,
} from '../../../models/table';
import { useTableStoreContext } from '../../../stores/tableStore';
import { TableUtil } from '../../../utils/TableUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { Subject } from '../../../classes/Subject';

import { TableCellAsyncContent } from './TableCellAsyncContent';
import { TableHeaderCell } from './TableHeaderCell';
import { TableActionsCell } from './TableActionsCell';
import {
  TableCell,
  type TableCellProps,
} from './TableCell';
import {
  TableColumnsEditorDialog,
  type TableColumnsEditorDialogRefMethods,
} from './TableColumnsEditorDialog';
import { TableCheckboxCell } from './TableCheckboxCell';
import { TableCheckboxHeader } from './TableCheckboxHeader';
import { TableReadableIndexCell } from './TableReadableIndexCell';
import { tableHeaderCellClassNames } from './classNames';


export type TableProps<TRowData> = {
  readonly font?: string;
  readonly forceHorizontalOverflow?: boolean;
  readonly getRowName?: (row: TRowData) => string;
  readonly headerHeight?: number;
  readonly initialVisibleItemIndex?: number;
  readonly onRangeChanged?: (range: ListRange) => void;
  readonly onReadableIndexClick?: (row: TRowData) => void;
  readonly onRowClick?: (row: TableRowParams<TRowData>) => void;
  readonly onRowMouseEnter?: (row?: TRowData) => void;
  readonly onRowMouseLeave?: (row?: TRowData) => void;
  readonly onVerticalScrollPositionChange?: (position: number) => void;
  readonly onVisibleItemIndexChange?: (index: number) => void;
  readonly overscanMain?: number;
  readonly overscanReverse?: number;
  readonly ref?: Ref<TableRef>;
  readonly rowHeight?: number;
  readonly rowHighlightingSubject?: Subject<string[]>;
  readonly sx?: SxProps<Theme>;
};

export interface TableRef {
  setVerticalScrollPosition: (position: number) => void;
}

export const Table = <TRowData,>({
  font,
  forceHorizontalOverflow,
  getRowName,
  headerHeight = 4,
  initialVisibleItemIndex,
  onRangeChanged = noop,
  onReadableIndexClick,
  onRowClick,
  onRowMouseEnter = noop,
  onRowMouseLeave = noop,
  onVerticalScrollPositionChange,
  onVisibleItemIndexChange,
  overscanMain,
  overscanReverse,
  ref,
  rowHeight = 4,
  rowHighlightingSubject,
  sx,
}: TableProps<TRowData>) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<TRowData>();

  const { DEFAULT_OVERSCAN_MAIN, DEFAULT_OVERSCAN_REVERSE } = ConfigManager.getInstance().config.table;

  // make sure the table re-renders when the visible columns change
  useStore(tableStore, useShallow((state) => state.columnVisualSettings.filter(c => c.isVisible).map(c => c.id)));

  const setColumnVisualSettingsInStore = useStore(tableStore, useShallow((state) => state.setColumnVisualSettings));
  const sortedData = useStore(tableStore, useShallow((state) => state.sortedData));
  const idSelectorCallback = useStore(tableStore, useShallow((state) => state.idSelectorCallback));
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));
  const isStoreInitialized = useStore(tableStore, useShallow((state) => state.isInitialized));
  const isRowEnabledCallback = useStore(tableStore, useShallow((state) => state.isRowEnabledCallback));
  const addTableEventListener = useStore(tableStore, useShallow((state) => state.addEventListener));
  const columnDimensions = useStore(tableStore, useShallow((state) => state.columnDimensions));
  const tableColumnVisualSettingsRef = useRef<TableColumnVisualSettings[]>(null);
  const eventListenersCleanerRef = useRef<() => void>(noop);
  const [isInitialized, setIsInitialized] = useState(false);
  const borderColor = useMemo(() => lighten(alpha(theme.palette.divider, 1), 0.1), [theme.palette.divider]);
  const headerBorderColor = useMemo(() => darken(alpha(theme.palette.divider, 1), 0.15), [theme.palette.divider]);
  const scrollbarSize = useScrollbarSize();
  const tableRef = useRef<TableVirtuosoHandle>(null);
  const tableWidthRef = useRef<number>(0);
  const tableRangeRef = useRef<ListRange>(null);
  const [container, setContainer] = useState<HTMLDivElement>();
  const tableColumnsEditorDialogRef = useRef<TableColumnsEditorDialogRefMethods>(null);

  const dragConfigRef = useRef<{ clonedElement: HTMLDivElement; elementOffsetX: number; scrollPosition: number }>(null);

  // If applying filters or sorting and the results in the table don't change, we need to re-render the table manually to reflect the changes in filters / sorting in the headers.
  // re-render the table when the filters change
  useStore(tableStore, (state) => JSON.stringify(state.filters.map(x => x.filterValue)));
  // re-render the table when the sort by field or direction changes
  useStore(tableStore, useShallow((state) => state.sortByField));
  useStore(tableStore, useShallow((state) => state.sortDirection));

  const onTableRowClick = useCallback((row: TableRowParams<TRowData>, event: MouseEvent) => {
    if (onRowClick) {
      if (!getRowName) {
        throw new Error('getRowName is required when onRowClick is provided');
      }
      if (ConfigManager.getInstance().config.enablePageEvents) {
        PageEventBusManager.getInstance().emit('click', {
          label: getRowName(row.row),
          type: 'table-row',
        });
      }
      event.preventDefault();
      event.stopPropagation();
      onRowClick(row);
    }
  }, [getRowName, onRowClick]);

  const getVisibleTableSettingsColumns = useCallback(() => {
    return tableColumnVisualSettingsRef?.current?.filter(c => c.isVisible);
  }, []);

  const updateTableWidth = useCallback(() => {
    if (!tableColumnVisualSettingsRef?.current?.length || !container) {
      return;
    }
    const tableWidth = sumBy(getVisibleTableSettingsColumns(), tableSettingsColumn => tableSettingsColumn.calculatedWidth);
    const tableElement: HTMLDivElement = container.querySelector('[role=table]');
    tableWidthRef.current = tableWidth;
    if (tableElement) {
      // update the width of the table
      tableElement.style.width = `${tableWidth}px`;
    }
  }, [container, getVisibleTableSettingsColumns]);

  useLayoutEffect(() => {
    updateTableWidth();
  }, [updateTableWidth]);

  const renderReadableIndexCell = useCallback((tableColumn: TableColumnReadableIndex<TRowData>, cell: TableRowParams<TRowData>) => {
    return (
      <TableReadableIndexCell
        cell={cell}
        getRowName={getRowName}
        key={cell.id}
        onReadableIndexClick={onReadableIndexClick}
        tableColumn={tableColumn}
      />
    );
  }, [getRowName, onReadableIndexClick]);

  const renderCheckboxHeaderContent = useCallback((tableColumnParams: TableColumnParams<TRowData>) => {
    return (
      <TableCheckboxHeader
        tableColumnParams={tableColumnParams}
      />
    );
  }, []);

  const renderCheckboxCell = useCallback((tableColumn: TableColumnSelectable<TRowData>, cell: TableRowParams<TRowData>) => {
    const id = idSelectorCallback(cell.row);

    return (
      <TableCheckboxCell
        cell={cell}
        key={id}
        tableColumn={tableColumn}
      />
    );
  }, [idSelectorCallback]);

  const updateColumnSizes = useCallback(() => {
    if (!tableColumns.length || !container) {
      return;
    }

    const tableSettingsMap = TableUtil.getTableSettingsMap(
      container,
      scrollbarSize,
      sortedData,
      tableColumns,
      tableColumnVisualSettingsRef.current,
      getVisibleTableSettingsColumns(),
    );

    if (isInitialized) {
      // update the width of the cells in the current table imperatively
      container.querySelectorAll('[data-column-index]').forEach(cell => {
        const id = cell.getAttribute('data-id');
        (cell as HTMLDivElement).style.width = `${tableSettingsMap.get(id).calculatedWidth}px`;
      });
      updateTableWidth();
    }
  }, [tableColumns, container, scrollbarSize, sortedData, getVisibleTableSettingsColumns, isInitialized, updateTableWidth]);

  // Initialize the table
  useEffect(() => {
    if (!container || isInitialized || !isStoreInitialized) {
      return;
    }

    tableColumnVisualSettingsRef.current = tableStore.getState().columnVisualSettings;
    updateColumnSizes();
    updateTableWidth();
    setIsInitialized(true);
  }, [container, getVisibleTableSettingsColumns, isInitialized, isStoreInitialized, tableStore, updateColumnSizes, updateTableWidth]);

  const getScrollerElement = useCallback(() => container?.querySelector('[data-virtuoso-scroller=true]'), [container]);

  const saveColumnVisualSettingsToStore = useCallback(() => {
    setColumnVisualSettingsInStore(tableColumnVisualSettingsRef.current);
  }, [setColumnVisualSettingsInStore]);

  const saveColumnVisualSettingsToStoreDebounced = useDebouncedCallback(() => {
    saveColumnVisualSettingsToStore();
  }, 500, { trailing: true });

  const updateColumnSize = useCallback((columnVisualSettings: TableColumnVisualSettings, newWidth: number) => {
    columnVisualSettings.calculatedWidth = newWidth;
    columnVisualSettings.widthPx = newWidth;
    columnVisualSettings.hasResized = true;
    updateColumnSizes();
    saveColumnVisualSettingsToStoreDebounced();
  }, [updateColumnSizes, saveColumnVisualSettingsToStoreDebounced]);

  const onColumnDividerKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>, tableColumn: TableColumn<TRowData>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();

    const columnVisualSettings = tableColumnVisualSettingsRef.current.find(c => c.id === tableColumn.id);
    const currentWidth = columnVisualSettings.calculatedWidth;
    const newWidth = event.key === 'ArrowLeft' ? Math.max(50, currentWidth - 10) : currentWidth + 10;
    updateColumnSize(columnVisualSettings, newWidth);
  }, [updateColumnSize]);

  const onColumnDividerMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>, tableColumn: TableColumn<TRowData>) => {
    event.preventDefault();

    const columnVisualSettings = tableColumnVisualSettingsRef.current.find(c => c.id === tableColumn.id);

    const staringX = event.clientX;
    const startingCellWidth = columnVisualSettings?.calculatedWidth;

    const mouseMoveListener = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      if (staringX === currentX) {
        // no horizontal movement
        return;
      }
      const movementX = currentX - staringX;
      const newWidth = Math.max(50, startingCellWidth + movementX);
      if (startingCellWidth === newWidth) {
        return;
      }
      updateColumnSize(columnVisualSettings, newWidth);
    };
    const mouseUpListener = (_mouseUpEvent: MouseEvent) => {
      eventListenersCleanerRef.current();
      eventListenersCleanerRef.current = noop;
    };

    // create the document listeners only when the mouse is down
    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mouseup', mouseUpListener);
    eventListenersCleanerRef.current = () => {
      document.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
    };
  }, [updateColumnSize]);

  useEffect(() => {
    return () => {
      eventListenersCleanerRef.current();
    };
  }, []);

  const moveColumn = useCallback((elementTableColumn: TableColumn<TRowData>, direction: -1 | 1): boolean => {
    return TableUtil.handleMoveColumn(
      columnDimensions,
      tableColumnVisualSettingsRef.current,
      tableColumns,
      elementTableColumn,
      direction,
    );
  }, [columnDimensions, tableColumns]);

  const updateColumnOrderInDOM = useCallback(() => {
    container.querySelectorAll('[data-column-index]').forEach(cell => {
      const id = cell.getAttribute('data-id');
      (cell as HTMLDivElement).style.order = tableColumnVisualSettingsRef.current.findIndex(c => c.id === id).toString();
    });
  }, [container]);

  useEffect(() => {
    const onWindowResize = () => {
      updateColumnSizes();
      updateColumnOrderInDOM();
    };
    const windowManager = WindowManager.getInstance();
    windowManager.window.addEventListener('resize', onWindowResize);
    return () => {
      windowManager.window.removeEventListener('resize', onWindowResize);
    };
  }, [updateColumnOrderInDOM, updateColumnSizes]);

  const calculateColumnBoundaries = useCallback((tableColumn: TableColumn<TRowData>) => {
    const visibleTableSettingsColumns = getVisibleTableSettingsColumns();

    // Find the index of the column being dragged
    const elementIndex = visibleTableSettingsColumns.findIndex(c => c.id === tableColumn.id);

    // Create an array of the widths of all visible columns
    const widths = visibleTableSettingsColumns.map(c => c.calculatedWidth);

    return {
      elementIndex,
      visibleTableSettingsColumns,
      widths,
    };
  }, [getVisibleTableSettingsColumns]);

  /**
   * Handles the drag event for a table header cell to enable column reordering.
   *
   * The way this works is:
   * - On 'start': It creates a clone of the header cell being dragged, styles it for visibility, and appends it to the body. It also prevents page scrolling and text selection.
   * - On 'move': It updates the position of the cloned element to follow the mouse cursor. It checks if the cursor has crossed the boundary of adjacent columns and swaps them in the DOM if necessary.
   * - On 'end': It removes the cloned element and restores original styles and behaviors.
   *
   * If the table has a scrollbar, it takes that into account when calculating positions. The way the columns are swapped is by changing their 'order' CSS property, which is efficient and avoids re-rendering the entire table.
   * Dragging the column beyond the current scroll position works because of selecting text (default browser behavior), but text selection is disabled during the drag.
   *
   * @param event - The drag event containing details about the drag action.
   * @param tableColumn - The column being dragged.
   */
  const onTableHeaderCellDrag = useCallback((event: TableDragEvent, tableColumn: TableColumn<TRowData>) => {
    const columnBoundaries = calculateColumnBoundaries(tableColumn);

    if (event.type === 'start') {
      // Prevent a horizontal scroll on the entire page when dragging the column
      WindowManager.getInstance().body.style.setProperty('overflow', 'hidden');

      // Prevent text selection while dragging
      container?.style.setProperty('--selection-background', 'none');

      // Set the opacity of the original element to 0.3 to indicate it's being dragged
      event.target.style.setProperty('opacity', '0.3');

      // Create a clone of the original element to drag around and store the properties
      dragConfigRef.current = {
        clonedElement: (event.target).cloneNode(true) as HTMLDivElement,
        elementOffsetX: columnBoundaries.widths.slice(0, columnBoundaries.elementIndex).reduce((acc, width) => acc + width, 0) - 15,
        scrollPosition: getScrollerElement().scrollLeft,
      };
      dragConfigRef.current.clonedElement.style.cssText = `
        font-weight: bold;
        position: absolute;
        top: ${event.target.getBoundingClientRect().top}px;
        left: ${event.clientX - event.elementOffsetX}px;
        z-index: ${theme.zIndex.modal.toString()};
        pointer-events: none;
        filter: blur(0.5px);
        box-shadow: 1px 2px 3px 0px rgba(0,0,0,0.5);
      `;
      WindowManager.getInstance().body.appendChild(dragConfigRef.current.clonedElement);
    }
    if (event.type === 'end') {
      // Restore the original behaviors and styles
      WindowManager.getInstance().body.style.removeProperty('overflow');
      container?.style.setProperty('--selection-background', 'highlight');
      WindowManager.getInstance().document.getSelection().empty();
      dragConfigRef.current.clonedElement.remove();
      event.target.style.setProperty('opacity', '1');
    }
    if (event.type === 'move') {
      // Move the cloned element to follow the mouse cursor
      dragConfigRef.current.clonedElement.style.setProperty('left', `${event.clientX - event.elementOffsetX}px`);
      dragConfigRef.current.clonedElement.style.setProperty('top', `${event.clientY}px`);

      // Check if we need to swap the column with the left or right column
      const relativeMousePosition = dragConfigRef.current.elementOffsetX + event.deltaX + event.elementOffsetX + (getScrollerElement().scrollLeft - dragConfigRef.current.scrollPosition);
      const leftBoundary = columnBoundaries.widths.slice(0, columnBoundaries.elementIndex - 1).reduce((acc, width) => acc + width, 0) + Math.min(16, columnBoundaries.widths?.[columnBoundaries.elementIndex - 1] ?? Infinity);
      const rightBoundary = columnBoundaries.widths.slice(0, columnBoundaries.elementIndex + 1).reduce((acc, width) => acc + width, 0) + Math.min(16, columnBoundaries.widths?.[columnBoundaries.elementIndex + 1] ?? Infinity);
      if ((relativeMousePosition < leftBoundary && moveColumn(tableColumn, -1)) || (relativeMousePosition > rightBoundary && moveColumn(tableColumn, 1))) {
        updateColumnOrderInDOM();
        calculateColumnBoundaries(tableColumn);
      }
    }
  }, [calculateColumnBoundaries, container?.style, getScrollerElement, moveColumn, theme.zIndex.modal, updateColumnOrderInDOM]);

  const renderFixedHeaderContent = useCallback(() => {
    return (
      <Box
        aria-rowindex={1}
        role={'row'}
        sx={{
          [`&:hover .${tableHeaderCellClassNames.columnDivider}`]: {
            opacity: 1,
          },
          background: theme.palette.background.paper,
          borderBottom: `1px solid ${headerBorderColor}`,
          display: 'flex',
          fontWeight: 'bold',
          height: theme.spacing(headerHeight),
          zIndex: 3,
        }}
      >
        {getVisibleTableSettingsColumns().map((tableSettingsColumn, tableSettingsColumnIndex) => {
          const tableColumn = tableColumns.find(c => c.id === tableSettingsColumn.id);
          if (!tableColumn) {
            return null;
          }
          return (
            <TableHeaderCell<TRowData>
              column={tableColumn.type === 'selectable' ? { ...tableColumn, renderHeaderContent: renderCheckboxHeaderContent } : tableColumn}
              columnIndex={tableSettingsColumnIndex}
              dividerColor={headerBorderColor}
              height={theme.spacing(headerHeight)}
              key={tableSettingsColumn.id}
              onColumnDividerKeyDown={onColumnDividerKeyDown}
              onColumnDividerMouseDown={onColumnDividerMouseDown}
              onCustomDrag={onTableHeaderCellDrag}
              order={tableColumnVisualSettingsRef.current.findIndex(c => c.id === tableSettingsColumn.id)}
              role={'columnheader'}
              width={tableSettingsColumn.calculatedWidth}
              xOffset={tableSettingsColumn.offsetX}
            />
          );
        })}
      </Box>
    );
  }, [theme, headerHeight, headerBorderColor, getVisibleTableSettingsColumns, tableColumns, renderCheckboxHeaderContent, onColumnDividerMouseDown, onColumnDividerKeyDown, onTableHeaderCellDrag]);

  const renderItemContent = useCallback((index: number, row: TRowData) => {
    return (
      <>
        {getVisibleTableSettingsColumns().map((column, columnIndex) => {
          const tableColumn = tableColumns.find(c => c.id === column.id);
          let title: string;
          if (tableColumn.cellTitleGetter) {
            title = tableColumn.cellTitleGetter({
              id: column.id,
              row,
              rowIndex: index,
            });
          } else if (tableColumn.type === 'text') {
            title = TableUtil.getTableTextCellValue({ column: tableColumn, row, rowIndex: index });
          } else if (tableColumn.type === 'boolean') {
            title = TableUtil.getTableBooleanCellDisplayValue({ column: tableColumn, row, rowIndex: index, t });
          } else if (tableColumn.type === 'number') {
            const numericValue = TableUtil.getTableNumberCellValue({ column: tableColumn, row, rowIndex: index });
            title = isNumber(numericValue) ? numericValue.toString() : '';
          } else if (tableColumn.type === 'date') {
            title = TableUtil.getTableDateCellValue({ column: tableColumn, row, rowIndex: index });
          } else if (tableColumn.type === 'options') {
            title = TableUtil.getTableOptionsCellDisplayValue({ column: tableColumn, row, rowIndex: index });
          } else if (tableColumn.type === 'caseType') {
            title = TableUtil.getTableCaseTypeCellValue({ column: tableColumn, row, rowIndex: index }).long;
          }

          const baseProps: Partial<TableCellProps<TRowData>> = {
            columnIndex,
            enabled: isRowEnabledCallback ? isRowEnabledCallback(row) : true,
            height: theme.spacing(rowHeight),
            onClick: onTableRowClick,
            order: tableColumnVisualSettingsRef.current.findIndex(c => c.id === column.id),
            row,
            rowIndex: index,
            sx: tableColumn.sx,
            title,
            width: tableColumnVisualSettingsRef.current.find(c => c.id === column.id).calculatedWidth,
            xOffset: tableColumnVisualSettingsRef.current.find(c => c.id === column.id).offsetX,
          };

          if (tableColumn.type === 'actions') {
            return (
              <TableActionsCell<TRowData>
                key={column.id}
                {...baseProps as TableCellProps<TRowData>}
                column={tableColumn}
              />
            );
          }

          return (
            <TableCell
              key={column.id}
              {...baseProps as TableCellProps<TRowData>}
              column={tableColumn}
            >
              {!!tableColumn.renderCell && (
                <Fragment key={tableColumn.id}>
                  {tableColumn.renderCell({ column: tableColumn, columnIndex, id: column.id, row, rowIndex: index })}
                </Fragment>
              )}
              {!tableColumn.renderCell && !!tableColumn.displayValueGetter && (
                <Fragment key={tableColumn.id}>
                  <TableCellAsyncContent content={tableColumn.displayValueGetter({ id: column.id, row, rowIndex: index })} />
                </Fragment>
              )}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'text' && TableUtil.getTableTextCellValue({ column: tableColumn, row, rowIndex: index })}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'boolean' && TableUtil.getTableBooleanCellDisplayValue({ column: tableColumn, row, rowIndex: index, t })}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'number' && TableUtil.getTableNumberCellValue({ column: tableColumn, row, rowIndex: index })}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'date' && TableUtil.getTableDateCellValue({ column: tableColumn, row, rowIndex: index })}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'options' && TableUtil.getTableOptionsCellDisplayValue({ column: tableColumn, row, rowIndex: index })}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'caseType' && TableUtil.getTableCaseTypeCellDisplayValue({ column: tableColumn, row, rowIndex: index })}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'readableIndex' && renderReadableIndexCell(tableColumn, { id: column.id, row, rowIndex: index })}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'selectable' && renderCheckboxCell(tableColumn, { id: column.id, row, rowIndex: index })}
            </TableCell>
          );
        })}
      </>
    );
  }, [getVisibleTableSettingsColumns, isRowEnabledCallback, onTableRowClick, renderCheckboxCell, renderReadableIndexCell, rowHeight, t, tableColumns, theme]);

  const onRowMouseEnterCallback = useCallback((row: TRowData) => {
    onRowMouseEnter(row);
  }, [onRowMouseEnter]);

  const onRowMouseLeaveCallback = useCallback((row: TRowData) => {
    onRowMouseLeave(row);
  }, [onRowMouseLeave]);

  // Setup highlighting
  useEffect(() => {
    if (!rowHighlightingSubject) {
      return noop;
    }

    const unsubscribe = rowHighlightingSubject.subscribe((highlightedRowIds, previousHighlightedRowIds) => {
      // remove previous highlighting
      previousHighlightedRowIds.forEach(rowId => {
        container.querySelectorAll(`[data-testid=virtuoso-item-list] [data-id='${rowId}']`).forEach(rowNode => {
          (rowNode as HTMLElement).classList.remove('highlighted');
        });
      });

      // add current highlighting
      highlightedRowIds.forEach(rowId => {
        container.querySelectorAll(`[data-testid=virtuoso-item-list] [data-id='${rowId}']`).forEach(rowNode => {
          (rowNode as HTMLElement).classList.add('highlighted');
        });
      });
    });
    return () => {
      unsubscribe();
    };
  }, [rowHighlightingSubject, container, theme.palette.action.hover, theme.palette.background.paper]);

  useEffect(() => {
    const updateTable = () => {
      updateColumnSizes();
      updateColumnOrderInDOM();
      updateTableWidth();
      saveColumnVisualSettingsToStore();
    };

    const listeners = [
      addTableEventListener('reset', () => {
        tableColumnVisualSettingsRef.current = TableUtil.createInitialVisualColumnSettings(tableColumns);
        updateTable();
      }),
      addTableEventListener('columnVisibilityChange', (columnIds: string[]) => {
        tableColumnVisualSettingsRef.current.forEach(column => {
          column.isVisible = columnIds.includes(column.id);
        });
        updateTable();
      }),
      addTableEventListener('columnOrderChange', (columnIds: string[]) => {
        tableColumnVisualSettingsRef.current.sort((a, b) => {
          return columnIds.indexOf(a.id) - columnIds.indexOf(b.id);
        });
        updateTable();
      }),
      addTableEventListener('openColumnsEditorDialog', (hasCellData) => {
        tableColumnsEditorDialogRef.current.open({
          hasCellData,
        });
      }),
    ];

    return () => {
      listeners.forEach(cb => cb());
    };

  }, [addTableEventListener, saveColumnVisualSettingsToStore, tableColumns, updateColumnOrderInDOM, updateColumnSizes, updateTableWidth]);

  const onTableScroll = useCallback(() => {
    const scrollerElement = getScrollerElement();
    if (scrollerElement && onVerticalScrollPositionChange) {
      onVerticalScrollPositionChange(scrollerElement.scrollTop);
    }
    if (tableRef.current && onVisibleItemIndexChange) {
      const scrollTop = scrollerElement.scrollTop;
      const rowHeightPx = +theme.spacing(rowHeight).replace('px', '');
      const topItemIndex = Math.floor(scrollTop / rowHeightPx);
      onVisibleItemIndexChange(topItemIndex);
    }
  }, [getScrollerElement, onVerticalScrollPositionChange, onVisibleItemIndexChange, theme, rowHeight]);

  const handleItemSize = useCallback(() => {
    return +theme.spacing(rowHeight).replace('px', '');
  }, [rowHeight, theme]);

  const setVerticalScrollPosition = useCallback((position: number) => {
    const scrollerElement = getScrollerElement();
    if (!scrollerElement) {
      return;
    }
    scrollerElement.scrollTop = position;
  }, [getScrollerElement]);

  useImperativeHandle(ref, () => ({
    setVerticalScrollPosition,
  }));

  const onVirtuosoRangeChanged = useCallback((range: ListRange) => {
    tableRangeRef.current = range;
    onRangeChanged(range);
  }, [onRangeChanged]);

  useEffect(() => {
    if (tableRangeRef.current) {
      onRangeChanged(tableRangeRef.current);
    }
  }, [onRangeChanged, sortedData]);

  return (
    <Box
      ref={setContainer}
      style={{ '--selection-background': 'highlight' } as CSSProperties}
      sx={{
        '*::selection': {
          backgroundColor: 'var(--selection-background) !important',
        },
        height: '100%',
        position: 'relative',
        width: '100%',
        ...sx,
      }}
    >
      {isInitialized && (
        <TableVirtuoso
          {...TestIdUtil.createAttributes('Table')}
          components={{
            // eslint-disable-next-line @eslint-react/no-forward-ref, @typescript-eslint/naming-convention, @eslint-react/kit/no-multi-comp
            EmptyPlaceholder: forwardRef((props: { readonly context?: unknown }, emptyPlaceHolderRef) => (
              <Box
                {...props}
                ref={emptyPlaceHolderRef}
              />
            )),
            // eslint-disable-next-line @eslint-react/no-forward-ref, @typescript-eslint/naming-convention, @eslint-react/kit/no-multi-comp
            FillerRow: forwardRef((props: FillerRowProps, fillerRowRef) => (
              <Box
                ref={fillerRowRef}
                style={{
                  height: props.height,
                }}
              />
            )),
            // eslint-disable-next-line @eslint-react/no-forward-ref, @typescript-eslint/naming-convention, @eslint-react/kit/no-multi-comp
            Table: forwardRef((props: VirtuosoTableProps, tableElementRef) => (
              <Box
                {...props}
                data-row-count={sortedData.length}
                ref={tableElementRef}
                role={'table'}
                sx={{
                  minWidth: '100%',
                  position: 'relative',
                  // eslint-disable-next-line @eslint-react/refs
                  width: tableWidthRef.current,
                }}
              />
            )),
            // eslint-disable-next-line @eslint-react/no-forward-ref, @typescript-eslint/naming-convention, @eslint-react/kit/no-multi-comp
            TableBody: forwardRef((props: TableBodyProps, tableBodyRef) => (
              <Box
                {...props}
                ref={tableBodyRef}
                sx={{
                  font,
                }}
              />
            )),
            // eslint-disable-next-line @eslint-react/no-forward-ref, @typescript-eslint/naming-convention, @eslint-react/kit/no-multi-comp
            TableHead: forwardRef((props: { readonly context?: unknown }, tableHeadRef) => (
              <Box
                {...props}
                ref={tableHeadRef}
              />
            )),
            // eslint-disable-next-line @eslint-react/no-forward-ref, @typescript-eslint/naming-convention, @eslint-react/kit/no-multi-comp
            TableRow: forwardRef((props: ItemProps<TRowData>, tableRowRef) => {
              const isRowEnabled = isRowEnabledCallback ? isRowEnabledCallback(props.item) : true;
              return (
                <Box
                  data-id={idSelectorCallback(props.item)}
                  // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                  onMouseEnter={() => onRowMouseEnterCallback(props.item)}
                  // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                  onMouseLeave={() => onRowMouseLeaveCallback(props.item)}
                  ref={tableRowRef}
                  role={'row'}
                  sx={{
                    '&:hover, &.highlighted': {
                      '& [role=cell]': {
                        backgroundColor: theme.palette.grey[100],
                      },
                      backgroundColor: theme.palette.grey[100],
                    },
                    borderBottom: `1px solid ${borderColor}`,
                    color: isRowEnabled ? undefined : 'text.disabled',
                    cursor: isRowEnabled && onRowClick ? 'pointer' : undefined,
                    display: 'flex',
                    height: theme.spacing(rowHeight),
                  }}
                  {...omit(props, 'item')}
                />
              );
            }),
          }}
          data={sortedData}
          fixedHeaderContent={renderFixedHeaderContent}
          fixedItemHeight={+theme.spacing(rowHeight).replace('px', '')}
          initialTopMostItemIndex={initialVisibleItemIndex ?? 0}
          itemContent={renderItemContent}
          itemSize={handleItemSize}
          onScroll={onTableScroll}
          overscan={{
            main: overscanMain ?? DEFAULT_OVERSCAN_MAIN,
            reverse: overscanReverse ?? DEFAULT_OVERSCAN_REVERSE,
          }}
          rangeChanged={onVirtuosoRangeChanged}
          ref={tableRef}
          style={{
            height: '100%',
            overflowX: forceHorizontalOverflow ? 'scroll' : 'auto',
          }}
          totalCount={sortedData.length}
        />
      )}
      <TableColumnsEditorDialog
        ref={tableColumnsEditorDialogRef}
      />
    </Box>
  );
};
