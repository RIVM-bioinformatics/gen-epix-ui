import {
  type SxProps,
  type Theme,
} from '@mui/material';
import {
  Box,
  Checkbox,
  Link,
  alpha,
  darken,
  lighten,
  useTheme,
} from '@mui/material';
import isNumber from 'lodash/isNumber';
import noop from 'lodash/noop';
import omit from 'lodash/omit';
import sumBy from 'lodash/sumBy';
import uniq from 'lodash/uniq';
import type {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  Ref,
  CSSProperties,
} from 'react';
import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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

import { tableHeaderCellClassNames } from '../../../data/table';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { PageEventBusManager } from '../../../classes/managers/PageEventBusManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { useScrollbarSize } from '../../../hooks/useScrollbarSize';
import type {
  TableRowParams,
  TableColumnSettings,
  TableColumn,
  TableDragEvent,
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


export type TableProps<TRowData> = {
  readonly onRowClick?: (row: TableRowParams<TRowData>) => void;
  readonly sx?: SxProps<Theme>;
  readonly rowHeight?: number;
  readonly headerHeight?: number;
  readonly onReadableIndexClick?: (row: TRowData) => void;
  readonly onRowMouseEnter?: (row?: TRowData) => void;
  readonly onRowMouseLeave?: (row?: TRowData) => void;
  readonly rowHighlightingSubject?: Subject<string[]>;
  readonly forceHorizontalOverflow?: boolean;
  readonly font?: string;
  readonly initialVisibleItemIndex?: number;
  readonly onVisibleItemIndexChange?: (index: number) => void;
  readonly onVerticalScrollPositionChange?: (position: number) => void;
  readonly ref?: Ref<TableRef>;
  readonly overscanMain?: number;
  readonly overscanReverse?: number;
  readonly onRangeChanged?: (range: ListRange) => void;
  readonly getRowName: (row: TRowData) => string;
};

export interface TableRef {
  setVerticalScrollPosition: (position: number) => void;
}

export const Table = <TRowData,>({
  onRowClick,
  sx,
  rowHeight = 4,
  headerHeight = 4,
  onReadableIndexClick,
  onRowMouseEnter = noop,
  onRowMouseLeave = noop,
  rowHighlightingSubject,
  forceHorizontalOverflow,
  initialVisibleItemIndex,
  onVisibleItemIndexChange,
  onVerticalScrollPositionChange,
  font,
  ref,
  overscanMain,
  overscanReverse,
  onRangeChanged = noop,
  getRowName,
}: TableProps<TRowData>) => {
  const theme = useTheme();
  const [t] = useTranslation();
  const tableStore = useTableStoreContext<TRowData>();

  const { DEFAULT_OVERSCAN_MAIN, DEFAULT_OVERSCAN_REVERSE } = ConfigManager.instance.config.table;

  // make sure the table re-renders when the visible columns change
  useStore(tableStore, useShallow((state) => state.columnSettings.filter(c => c.isVisible).map(c => c.id)));

  const setColumnSettingsInStore = useStore(tableStore, useShallow((state) => state.setColumnSettings));
  const sortedData = useStore(tableStore, useShallow((state) => state.sortedData));
  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));
  const idSelectorCallback = useStore(tableStore, useShallow((state) => state.idSelectorCallback));
  const selectedIds = useStore(tableStore, useShallow((state) => state.selectedIds));
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));
  const isStoreInitialized = useStore(tableStore, useShallow((state) => state.isInitialized));
  const isRowEnabledCallback = useStore(tableStore, useShallow((state) => state.isRowEnabledCallback));
  const addTableEventListener = useStore(tableStore, useShallow((state) => state.addEventListener));
  const columnDimensions = useStore(tableStore, useShallow((state) => state.columnDimensions));
  const tableColumnSettings = useRef<TableColumnSettings[]>(null);
  const eventListenersCleaner = useRef<() => void>(noop);
  const [isInitialized, setIsInitialized] = useState(false);
  const borderColor = useMemo(() => lighten(alpha(theme.palette.divider, 1), 0.1), [theme.palette.divider]);
  const headerBorderColor = useMemo(() => darken(alpha(theme.palette.divider, 1), 0.15), [theme.palette.divider]);
  const scrollbarSize = useScrollbarSize();
  const tableRef = useRef<TableVirtuosoHandle>(null);
  const tableWidthRef = useRef<number>(0);
  const tableRange = useRef<ListRange>(null);
  const [container, setContainer] = useState<HTMLDivElement>();
  const tableColumnsEditorDialogRef = useRef<TableColumnsEditorDialogRefMethods>(null);

  const dragConfig = useRef<{ clonedElement: HTMLDivElement; scrollPosition: number; elementOffsetX: number }>(null);

  // If applying filters or sorting and the results in the table don't change, we need to re-render the table manually to reflect the changes in filters / sorting in the headers.

  // re-render the table when the filters change
  useStore(tableStore, (state) => JSON.stringify(state.filters.map(x => x.filterValue)));
  // re-render the table when the sort by field or direction changes
  useStore(tableStore, (state) => state.sortByField);
  useStore(tableStore, (state) => state.sortDirection);

  const onTableRowClick = useCallback((row: TableRowParams<TRowData>, event: MouseEvent) => {
    if (onRowClick) {
      if (ConfigManager.instance.config.enablePageVents) {
        PageEventBusManager.instance.emit('click', {
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
    return tableColumnSettings?.current?.filter(c => c.isVisible);
  }, []);

  const updateTableWidth = useCallback(() => {
    if (!tableColumnSettings?.current?.length || !container) {
      return;
    }
    const tableWidth = sumBy(getVisibleTableSettingsColumns(), column => column.calculatedWidth);
    const tableElement: HTMLDivElement = container.querySelector('[role=table]');
    tableWidthRef.current = tableWidth;
    if (tableElement) {
      // update the width of the table
      tableElement.style.width = `${tableWidth}px`;
    }
  }, [container, getVisibleTableSettingsColumns]);
  updateTableWidth();

  const onTableReadableIndexClick = useCallback((row: TRowData, event: ReactMouseEvent) => {
    if (onReadableIndexClick) {
      if (ConfigManager.instance.config.enablePageVents) {
        PageEventBusManager.instance.emit('click', {
          label: getRowName(row),
          type: 'table-row-index',
        });
      }
      event.preventDefault();
      event.stopPropagation();
      onReadableIndexClick(row);
    }
  }, [getRowName, onReadableIndexClick]);

  const renderReadableIndexCell = useCallback((cell: TableRowParams<TRowData>) => {
    if (!onReadableIndexClick) {
      return cell.rowIndex + 1;
    }
    return (
      <Link
        color={'primary'}
        key={cell.id}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={(event) => {
          onTableReadableIndexClick(cell.row, event);
        }}
        sx={{
          cursor: 'pointer',
          width: '100%',
          display: 'block',
          textAlign: 'right',
          height: '100%',
        }}
      >
        {cell.rowIndex + 1}
      </Link>
    );
  }, [onReadableIndexClick, onTableReadableIndexClick]);

  const onSelectAllCheckBoxChange = useCallback((_event: ChangeEvent<HTMLInputElement>) => {
    const visibleRowIds = sortedData.map(r => idSelectorCallback(r));
    if (sortedData.every(row => selectedIds.includes(idSelectorCallback(row)))) {
      // all visible rows are selected, unselect all visible rows
      setSelectedIds(selectedIds.filter(s => !visibleRowIds.includes(s)));
    } else {
      // not al visible rows are selected, select them
      setSelectedIds(uniq([...selectedIds, ...visibleRowIds]));
    }
  }, [sortedData, setSelectedIds, selectedIds, idSelectorCallback]);

  const renderCheckboxHeader = useCallback(() => {
    return (
      <Checkbox
        checked={sortedData.every(row => selectedIds.includes(idSelectorCallback(row)))}
        inputProps={{
          'aria-label': t`Select all`,
        }}
        name={'select-all'}
        onChange={onSelectAllCheckBoxChange}
        sx={{
          padding: 0,
          marginTop: '-2px',
        }}
      />
    );
  }, [idSelectorCallback, onSelectAllCheckBoxChange, selectedIds, sortedData, t]);

  const onRowCheckBoxChange = useCallback((event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const rowId = event.target.getAttribute('name');
    if (checked && !selectedIds.includes(rowId)) {
      setSelectedIds([...selectedIds, rowId]);
    } else if (!checked) {
      setSelectedIds([...selectedIds].filter(x => x !== rowId));
    }
  }, [selectedIds, setSelectedIds]);

  const renderCheckboxCell = useCallback((cell: TableRowParams<TRowData>) => {
    const id = idSelectorCallback(cell.row);
    return (
      <Checkbox
        checked={selectedIds.includes(id)}
        key={id}
        name={idSelectorCallback(cell.row)}
        onChange={onRowCheckBoxChange}
        slotProps={{
          input: {
            'aria-label': t`Select row`,
          },
        }}
        sx={{
          padding: 0,
          marginTop: '-2px',
        }}
      />
    );
  }, [idSelectorCallback, onRowCheckBoxChange, selectedIds, t]);

  const updateColumnSizes = useCallback(() => {
    if (!tableColumns.length || !container) {
      return;
    }

    const tableSettingsMap = TableUtil.getTableSettingsMap(
      container,
      scrollbarSize,
      sortedData,
      tableColumns,
      tableColumnSettings.current,
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

    tableColumnSettings.current = tableStore.getState().columnSettings;
    updateColumnSizes();
    updateTableWidth();
    setIsInitialized(true);
  }, [container, getVisibleTableSettingsColumns, isInitialized, isStoreInitialized, tableStore, updateColumnSizes, updateTableWidth]);

  const getScrollerElement = useCallback(() => container?.querySelector('[data-virtuoso-scroller=true]'), [container]);

  const saveColumnSettingsToStore = useCallback(() => {
    setColumnSettingsInStore(tableColumnSettings.current);
  }, [setColumnSettingsInStore]);

  const saveColumnSettingsToStoreDebounced = useDebouncedCallback(() => {
    saveColumnSettingsToStore();
  }, 500, { trailing: true });


  const onColumnDividerMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>, tableColumn: TableColumn<TRowData>) => {
    event.preventDefault();

    const columnSettings = tableColumnSettings.current.find(c => c.id === tableColumn.id);

    const staringX = event.clientX;
    const startingCellWidth = columnSettings?.calculatedWidth;

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
      columnSettings.calculatedWidth = newWidth;
      columnSettings.widthPx = newWidth;
      columnSettings.hasResized = true;
      // update the column sizes for when virtuoso is rending next cells
      updateColumnSizes();
      // update the width of the cells in the current table
      saveColumnSettingsToStoreDebounced();
    };
    const mouseUpListener = (_mouseUpEvent: MouseEvent) => {
      eventListenersCleaner.current();
      eventListenersCleaner.current = noop;
    };

    // create the document listeners only when the mouse is down
    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mouseup', mouseUpListener);
    eventListenersCleaner.current = () => {
      document.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
    };
  }, [updateColumnSizes, saveColumnSettingsToStoreDebounced]);

  useEffect(() => {
    return () => {
      eventListenersCleaner.current();
    };
  }, []);

  const moveColumn = useCallback((elementTableColumn: TableColumn<TRowData>, direction: 1 | -1): boolean => {
    return TableUtil.handleMoveColumn(
      columnDimensions,
      tableColumnSettings.current,
      tableColumns,
      elementTableColumn,
      direction,
    );
  }, [columnDimensions, tableColumns]);

  const updateColumnOrderInDOM = useCallback(() => {
    container.querySelectorAll('[data-column-index]').forEach(cell => {
      const id = cell.getAttribute('data-id');
      (cell as HTMLDivElement).style.order = tableColumnSettings.current.findIndex(c => c.id === id).toString();
    });
  }, [container]);

  useEffect(() => {
    const onWindowResize = () => {
      updateColumnSizes();
      updateColumnOrderInDOM();
    };
    WindowManager.instance.window.addEventListener('resize', onWindowResize);
    return () => {
      WindowManager.instance.window.removeEventListener('resize', onWindowResize);
    };
  }, [updateColumnOrderInDOM, updateColumnSizes]);

  const calculateColumnBoundaries = useCallback((tableColumn: TableColumn<TRowData>) => {
    const visibleTableSettingsColumns = getVisibleTableSettingsColumns();

    // Find the index of the column being dragged
    const elementIndex = visibleTableSettingsColumns.findIndex(c => c.id === tableColumn.id);

    // Create an array of the widths of all visible columns
    const widths = visibleTableSettingsColumns.map(c => c.calculatedWidth);

    return {
      visibleTableSettingsColumns,
      elementIndex,
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
    let columnBoundaries = calculateColumnBoundaries(tableColumn);

    if (event.type === 'start') {
      // Prevent a horizontal scroll on the entire page when dragging the column
      WindowManager.instance.body.style.setProperty('overflow', 'hidden');

      // Prevent text selection while dragging
      container?.style.setProperty('--selection-background', 'none');

      // Set the opacity of the original element to 0.3 to indicate it's being dragged
      event.target.style.setProperty('opacity', '0.3');

      // Create a clone of the original element to drag around and store the properties
      dragConfig.current = {
        clonedElement: (event.target).cloneNode(true) as HTMLDivElement,
        scrollPosition: getScrollerElement().scrollLeft,
        elementOffsetX: columnBoundaries.widths.slice(0, columnBoundaries.elementIndex).reduce((acc, width) => acc + width, 0) - 15,
      };
      dragConfig.current.clonedElement.style.cssText = `
        font-weight: bold;
        position: absolute;
        top: ${event.target.getBoundingClientRect().top}px;
        left: ${event.clientX - event.elementOffsetX}px;
        z-index: ${theme.zIndex.modal.toString()};
        pointer-events: none;
        filter: blur(0.5px);
        box-shadow: 1px 2px 3px 0px rgba(0,0,0,0.5);
      `;
      WindowManager.instance.body.appendChild(dragConfig.current.clonedElement);
    }
    if (event.type === 'end') {
      // Restore the original behaviors and styles
      WindowManager.instance.body.style.removeProperty('overflow');
      container?.style.setProperty('--selection-background', 'highlight');
      WindowManager.instance.document.getSelection().empty();
      dragConfig.current.clonedElement.remove();
      event.target.style.setProperty('opacity', '1');
    }
    if (event.type === 'move') {
      // Move the cloned element to follow the mouse cursor
      dragConfig.current.clonedElement.style.setProperty('left', `${event.clientX - event.elementOffsetX}px`);
      dragConfig.current.clonedElement.style.setProperty('top', `${event.clientY}px`);

      // Check if we need to swap the column with the left or right column
      const relativeMousePosition = dragConfig.current.elementOffsetX + event.deltaX + event.elementOffsetX + (getScrollerElement().scrollLeft - dragConfig.current.scrollPosition);
      const leftBoundary = columnBoundaries.widths.slice(0, columnBoundaries.elementIndex - 1).reduce((acc, width) => acc + width, 0) + Math.min(16, columnBoundaries.widths?.[columnBoundaries.elementIndex - 1] ?? Infinity);
      const rightBoundary = columnBoundaries.widths.slice(0, columnBoundaries.elementIndex + 1).reduce((acc, width) => acc + width, 0) + Math.min(16, columnBoundaries.widths?.[columnBoundaries.elementIndex + 1] ?? Infinity);
      if ((relativeMousePosition < leftBoundary && moveColumn(tableColumn, -1)) || (relativeMousePosition > rightBoundary && moveColumn(tableColumn, 1))) {
        updateColumnOrderInDOM();
        columnBoundaries = calculateColumnBoundaries(tableColumn);
      }
    }
  }, [calculateColumnBoundaries, container?.style, getScrollerElement, moveColumn, theme.zIndex.modal, updateColumnOrderInDOM]);

  const renderFixedHeaderContent = useCallback(() => {
    return (
      <Box
        aria-rowindex={1}
        role={'row'}
        sx={{
          background: theme.palette.background.paper,
          display: 'flex',
          height: theme.spacing(headerHeight),
          fontWeight: 'bold',
          borderBottom: `1px solid ${headerBorderColor}`,
          zIndex: 3,
          [`&:hover .${tableHeaderCellClassNames.columnDivider}`]: {
            opacity: 1,
          },
        }}
      >
        {getVisibleTableSettingsColumns().map((column, columnIndex) => {
          const tableColumn = tableColumns.find(c => c.id === column.id);
          if (!tableColumn) {
            return null;
          }
          return (
            <TableHeaderCell<TRowData>
              column={tableColumn.type === 'selectable' ? { ...tableColumn, renderHeader: renderCheckboxHeader } : tableColumn}
              columnIndex={columnIndex}
              dividerColor={headerBorderColor}
              height={theme.spacing(headerHeight)}
              key={column.id}
              onColumnDividerMouseDown={onColumnDividerMouseDown}
              // onDragEnd={onTableHeaderCellDragEnd}
              // onDragStart={onTableHeaderCellDragStart}
              onCustomDrag={onTableHeaderCellDrag}
              order={tableColumnSettings.current.findIndex(c => c.id === column.id)}
              role={'columnheader'}
              width={column.calculatedWidth}
              xOffset={column.offsetX}
            />
          );
        })}
      </Box>
    );
  }, [theme, headerHeight, headerBorderColor, getVisibleTableSettingsColumns, tableColumns, renderCheckboxHeader, onColumnDividerMouseDown, onTableHeaderCellDrag]);

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
            onClick: onTableRowClick,
            columnIndex,
            row,
            rowIndex: index,
            width: tableColumnSettings.current.find(c => c.id === column.id).calculatedWidth,
            height: theme.spacing(rowHeight),
            enabled: isRowEnabledCallback ? isRowEnabledCallback(row) : true,
            xOffset: tableColumnSettings.current.find(c => c.id === column.id).offsetX,
            title,
            sx: tableColumn.sx,
            order: tableColumnSettings.current.findIndex(c => c.id === column.id),
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
              {...baseProps as TableCellProps<TRowData>}
              column={tableColumn}
              key={column.id}
            >
              {!!tableColumn.renderCell && (
                // React is losing it's mind here, so we need to wrap the renderCell in a Fragment to prevent complaints about keys
                <Fragment key={tableColumn.id}>
                  {tableColumn.renderCell({ id: column.id, row, rowIndex: index, columnIndex, column: tableColumn })}
                </Fragment>
              )}
              {!tableColumn.renderCell && !!tableColumn.displayValueGetter && (
                // React is losing it's mind here, so we need to wrap the renderCell in a Fragment to prevent complaints about keys
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
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'readableIndex' && renderReadableIndexCell({ id: column.id, row, rowIndex: index })}
              {!tableColumn.displayValueGetter && !tableColumn.renderCell && tableColumn.type === 'selectable' && renderCheckboxCell({ id: column.id, row, rowIndex: index })}
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
      saveColumnSettingsToStore();
    };

    const listeners = [
      addTableEventListener('reset', () => {
        tableColumnSettings.current = TableUtil.createInitialColumnSettings(tableColumns);
        updateTable();
      }),
      addTableEventListener('columnVisibilityChange', (columnIds: string[]) => {
        tableColumnSettings.current.forEach(column => {
          column.isVisible = columnIds.includes(column.id);
        });
        updateTable();
      }),
      addTableEventListener('columnOrderChange', (columnIds: string[]) => {
        tableColumnSettings.current.sort((a, b) => {
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

  }, [addTableEventListener, saveColumnSettingsToStore, tableColumns, updateColumnOrderInDOM, updateColumnSizes, updateTableWidth]);

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
    tableRange.current = range;
    onRangeChanged(range);
  }, [onRangeChanged]);

  useEffect(() => {
    if (tableRange.current) {
      onRangeChanged(tableRange.current);
    }
  }, [onRangeChanged, sortedData]);

  return (
    <Box
      ref={setContainer}
      style={{ '--selection-background': 'highlight' } as CSSProperties}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        '*::selection': {
          backgroundColor: 'var(--selection-background) !important',
        },
        ...sx,
      }}
    >
      {isInitialized && (
        <TableVirtuoso
          {...TestIdUtil.createAttributes('Table')}
          components={{
          // eslint-disable-next-line @typescript-eslint/naming-convention, react/no-unstable-nested-components
            TableRow: forwardRef((props: ItemProps<TRowData>, tableRowRef) => {
              const isRowEnabled = isRowEnabledCallback ? isRowEnabledCallback(props.item) : true;
              return (
                <Box
                  data-id={idSelectorCallback(props.item)}
                  // eslint-disable-next-line react/jsx-no-bind
                  onMouseEnter={() => onRowMouseEnterCallback(props.item)}
                  // eslint-disable-next-line react/jsx-no-bind
                  onMouseLeave={() => onRowMouseLeaveCallback(props.item)}
                  role={'row'}
                  sx={{
                    height: theme.spacing(rowHeight),
                    display: 'flex',
                    cursor: isRowEnabled && onRowClick ? 'pointer' : undefined,
                    color: isRowEnabled ? undefined : 'text.disabled',
                    borderBottom: `1px solid ${borderColor}`,
                    '&:hover, &.highlighted': {
                      backgroundColor: theme.palette.grey[100],
                      '& [role=cell]': {
                        backgroundColor: theme.palette.grey[100],
                      },
                    },
                  }}
                  {...omit(props, 'item')}
                  ref={tableRowRef}
                />
              );
            }),
            // eslint-disable-next-line @typescript-eslint/naming-convention, react/no-unstable-nested-components
            Table: forwardRef((props: VirtuosoTableProps, tableElementRef) => (
              <Box
                {...props}
                data-row-count={sortedData.length}
                ref={tableElementRef}
                role={'table'}
                sx={{
                  width: tableWidthRef.current,
                  minWidth: '100%',
                  position: 'relative',
                }}
              />
            )),
            // eslint-disable-next-line @typescript-eslint/naming-convention, react/no-unstable-nested-components
            TableBody: forwardRef((props: TableBodyProps, tableBodyRef) => (
              <Box
                {...props}
                ref={tableBodyRef}
                sx={{
                  font,
                }}
              />
            )),
            // eslint-disable-next-line @typescript-eslint/naming-convention, react/no-unstable-nested-components
            TableHead: forwardRef((props: { readonly context?: unknown }, tableHeadRef) => (
              <Box
                {...props}
                ref={tableHeadRef}
              />
            )),
            // eslint-disable-next-line @typescript-eslint/naming-convention, react/no-unstable-nested-components
            EmptyPlaceholder: forwardRef((props: { readonly context?: unknown }, emptyPlaceHolderRef) => (
              <Box
                {...props}
                ref={emptyPlaceHolderRef}
              />
            )),
            // eslint-disable-next-line @typescript-eslint/naming-convention, react/no-unstable-nested-components
            FillerRow: forwardRef((props: FillerRowProps, fillerRowRef) => (
              <Box
                {...props}
                ref={fillerRowRef}
              />
            )),
          }}
          data={sortedData}
          fixedHeaderContent={renderFixedHeaderContent}
          fixedItemHeight={+theme.spacing(rowHeight).replace('px', '')}
          initialTopMostItemIndex={initialVisibleItemIndex}
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
