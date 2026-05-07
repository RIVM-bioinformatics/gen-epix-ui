import type {
  SxProps,
  Theme,
} from '@mui/material';
import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';

import type { DATE_FORMAT } from '../data/date';

import type { OptionBase } from './form';

export enum FIXED_COLUMN_ID {
  ACTIONS = 'ACTIONS',
  READABLE_INDEX = 'READABLE_INDEX',
  ROW_SELECT = 'ROW_SELECT',
}

export interface GetTableCellRowComparatorProps<TColumn, TContext> {
  readonly column: TColumn;
  readonly context: TContext;
  readonly direction: TableSortDirection;
}

export interface GetTableCellValueProps<TRowData, TColumn, TContext> {
  readonly column: TColumn;
  readonly context: TContext;
  readonly row: TRowData;
  readonly rowIndex: number;
  readonly t?: TFunction<'translation', undefined>;
}

export type HasCellDataFn<TRowData, TContext> = (row: TRowData, column: TableColumn<TRowData, TContext>, rowIndex: number) => boolean;

export type TableCellRowComparatorArgument<TRowData> = {
  row: TRowData;
  rowIndex: number;
};

export type TableColumn<TRowData, TContext> =
  TableColumnActions<TRowData, TContext> |
  TableColumnBoolean<TRowData, TContext> |
  TableColumnDate<TRowData, TContext> |
  TableColumnNumber<TRowData, TContext> |
  TableColumnOptions<TRowData, TContext> |
  TableColumnReadableIndex<TRowData, TContext> |
  TableColumnSelectable<TRowData, TContext> |
  TableColumnText<TRowData, TContext>;

export interface TableColumnActions<TRowData, TContext> extends TableColumnBase<TRowData, string, TContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnActions<TRowData, TContext>, TContext>) => (a: TRowData, b: TRowData) => number;
  getActions: (params: TableRowParams<TRowData, TContext>) => ReactElement[];
  id: FIXED_COLUMN_ID.ACTIONS;
  isInitiallyVisible: true;
  isStatic: true;
  resizable: false;
  type: 'actions';
}

export interface TableColumnBoolean<TRowData, TContext> extends TableColumnBase<TRowData, boolean, TContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnBoolean<TRowData, TContext>, TContext>) => (a: TRowData, b: TRowData) => number;
  type: 'boolean';
}

export interface TableColumnDate<TRowData, TContext> extends TableColumnBase<TRowData, string, TContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnDate<TRowData, TContext>, TContext>) => (a: TRowData, b: TRowData) => number;
  dateFormat: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
  type: 'date';
}

export type TableColumnDimension = {
  columnIds: string[];
  id: string;
  label: string;
};

export interface TableColumnNumber<TRowData, TContext> extends TableColumnBase<TRowData, number, TContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnNumber<TRowData, TContext>, TContext>) => (a: TRowData, b: TRowData) => number;
  type: 'number';
}

export interface TableColumnOptions<TRowData, TContext> extends TableColumnBase<TRowData, string | string[], TContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnOptions<TRowData, TContext>, TContext>) => (a: TRowData, b: TRowData) => number;
  maxNumOptionsExpanded?: number;
  options: OptionBase<string>[];
  shouldFilterOptions?: boolean;
  type: 'options';
}

export interface TableColumnParams<TRowData, TContext> {
  column: TableColumn<TRowData, TContext>;
  columnIndex: number;
  context: TContext;
}

export interface TableColumnReadableIndex<TRowData, TContext> extends TableColumnBase<TRowData, never, TContext> {
  comparatorFactory?: never;
  disableEllipsis: true;
  frozen: true;
  getAriaLabel: (params: TableRowParams<TRowData, TContext>) => string;
  id: FIXED_COLUMN_ID.READABLE_INDEX;
  isStatic: true;
  resizable: false;
  type: 'readableIndex';
}

export interface TableColumnSelectable<TRowData, TContext> extends TableColumnBase<TRowData, never, TContext> {
  comparatorFactory?: never;
  disableEllipsis: true;
  frozen: true;
  id: FIXED_COLUMN_ID.ROW_SELECT;
  isDisabled?: (params: TableRowParams<TRowData, TContext>) => boolean;
  isStatic: true;
  resizable: false;
  type: 'selectable';
}

export interface TableColumnText<TRowData, TContext> extends TableColumnBase<TRowData, string, TContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnText<TRowData, TContext>, TContext>) => (a: TRowData, b: TRowData) => number;
  type: 'text';
}

export type TableColumnVisualSettings = {
  calculatedWidth?: number;
  hasResized?: boolean;
  id: string;
  isVisible: boolean;
  offsetX?: number;
  widthFlex: number;
  widthPx: number;
};

export type TableDragEvent = {
  clientX: number;
  clientY: number;
  deltaX: number;
  deltaY: number;
  elementOffsetX: number;
  elementWidth: number;
  target: HTMLDivElement;
  type: 'end' | 'move' | 'start';
};


export type TableRowAndColumnParams<TRowData, TContext> = TableColumnParams<TRowData, TContext> & TableRowParams<TRowData, TContext>;

export interface TableRowParams<TRowData, TContext> {
  context: TContext;
  id: string;
  row: TRowData;
  rowIndex: number;
}

export type TableSortDirection = 'asc' | 'desc';

interface TableColumnBase<TRowData, TValue, TContext> {
  cellTitleGetter?: (params: TableRowParams<TRowData, TContext>) => string;
  disableEllipsis?: boolean;
  displayValueGetter?: (params: TableRowParams<TRowData, TContext>) => string;
  filterLabel?: string;
  frozen?: boolean;
  headerName?: string;
  headerTooltipContent?: string;
  hideInFilter?: boolean;
  id?: string;
  isInitiallyVisible: boolean;
  isStatic?: boolean;
  renderCell?: (params: TableRowAndColumnParams<TRowData, TContext>) => ReactElement;
  renderHeader?: (params: TableColumnParams<TRowData, TContext>) => ReactElement;
  renderHeaderContent?: (params: TableColumnParams<TRowData, TContext>) => ReactElement;
  resizable?: boolean;
  sx?: SxProps<Theme>;
  textAlign?: 'left' | 'right';
  valueGetter?: (params: TableRowParams<TRowData, TContext>) => TValue;
  widthFlex?: number;
  widthPx?: number;
  widthPxFn?: (dataLength: number) => number;
}
