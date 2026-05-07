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

export interface GetTableCellRowComparatorProps<TColumn, TDataContext = null> {
  readonly column: TColumn;
  readonly dataContext: TDataContext;
  readonly direction: TableSortDirection;
}

export interface GetTableCellValueProps<TRowData, TColumn, TDataContext = null> {
  readonly column: TColumn;
  readonly dataContext: TDataContext;
  readonly row: TRowData;
  readonly rowIndex: number;
  readonly t?: TFunction<'translation', undefined>;
}

export type HasCellDataFn<TRowData, TDataContext = null> = (row: TRowData, column: TableColumn<TRowData, TDataContext>, rowIndex: number, dataContext: TDataContext) => boolean;

export type TableCellRowComparatorArgument<TRowData> = {
  row: TRowData;
  rowIndex: number;
};

export type TableColumn<TRowData, TDataContext = null> =
  TableColumnActions<TRowData, TDataContext> |
  TableColumnBoolean<TRowData, TDataContext> |
  TableColumnDate<TRowData, TDataContext> |
  TableColumnNumber<TRowData, TDataContext> |
  TableColumnOptions<TRowData, TDataContext> |
  TableColumnReadableIndex<TRowData, TDataContext> |
  TableColumnSelectable<TRowData, TDataContext> |
  TableColumnText<TRowData, TDataContext>;

export interface TableColumnActions<TRowData, TDataContext = null> extends TableColumnBase<TRowData, string, TDataContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnActions<TRowData, TDataContext>, TDataContext>) => (a: TRowData, b: TRowData) => number;
  getActions: (params: TableRowParams<TRowData, TDataContext>) => ReactElement[];
  id: FIXED_COLUMN_ID.ACTIONS;
  isInitiallyVisible: true;
  isStatic: true;
  resizable: false;
  type: 'actions';
}

export interface TableColumnBoolean<TRowData, TDataContext = null> extends TableColumnBase<TRowData, boolean, TDataContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnBoolean<TRowData, TDataContext>, TDataContext>) => (a: TRowData, b: TRowData) => number;
  type: 'boolean';
}

export interface TableColumnDate<TRowData, TDataContext = null> extends TableColumnBase<TRowData, string, TDataContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnDate<TRowData, TDataContext>, TDataContext>) => (a: TRowData, b: TRowData) => number;
  dateFormat: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
  type: 'date';
}

export type TableColumnDimension = {
  columnIds: string[];
  id: string;
  label: string;
};

export interface TableColumnNumber<TRowData, TDataContext = null> extends TableColumnBase<TRowData, number, TDataContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnNumber<TRowData, TDataContext>, TDataContext>) => (a: TRowData, b: TRowData) => number;
  type: 'number';
}

export interface TableColumnOptions<TRowData, TDataContext = null> extends TableColumnBase<TRowData, string | string[], TDataContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnOptions<TRowData, TDataContext>, TDataContext>) => (a: TRowData, b: TRowData) => number;
  maxNumOptionsExpanded?: number;
  options: OptionBase<string>[];
  shouldFilterOptions?: boolean;
  type: 'options';
}

export interface TableColumnParams<TRowData, TDataContext = null> {
  column: TableColumn<TRowData, TDataContext>;
  columnIndex: number;
  dataContext: TDataContext;
}

export interface TableColumnReadableIndex<TRowData, TDataContext = null> extends TableColumnBase<TRowData, never, TDataContext> {
  comparatorFactory?: never;
  disableEllipsis: true;
  frozen: true;
  getAriaLabel: (params: TableRowParams<TRowData, TDataContext>) => string;
  id: FIXED_COLUMN_ID.READABLE_INDEX;
  isStatic: true;
  resizable: false;
  type: 'readableIndex';
}

export interface TableColumnSelectable<TRowData, TDataContext = null> extends TableColumnBase<TRowData, never, TDataContext> {
  comparatorFactory?: never;
  disableEllipsis: true;
  frozen: true;
  id: FIXED_COLUMN_ID.ROW_SELECT;
  isDisabled?: (params: TableRowParams<TRowData, TDataContext>) => boolean;
  isStatic: true;
  resizable: false;
  type: 'selectable';
}

export interface TableColumnText<TRowData, TDataContext = null,> extends TableColumnBase<TRowData, string, TDataContext> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnText<TRowData, TDataContext>, TDataContext>) => (a: TRowData, b: TRowData) => number;
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


export type TableRowAndColumnParams<TRowData, TDataContext = null> = TableColumnParams<TRowData, TDataContext> & TableRowParams<TRowData, TDataContext>;

export interface TableRowParams<TRowData, TDataContext = null> {
  dataContext: TDataContext;
  id: string;
  row: TRowData;
  rowIndex: number;
}

export type TableSortDirection = 'asc' | 'desc';

interface TableColumnBase<TRowData, TValue, TDataContext = null> {
  cellTitleGetter?: (params: TableRowParams<TRowData, TDataContext>) => string;
  disableEllipsis?: boolean;
  displayValueGetter?: (params: TableRowParams<TRowData, TDataContext>) => string;
  filterLabel?: string;
  frozen?: boolean;
  headerName?: string;
  headerTooltipContent?: string;
  hideInFilter?: boolean;
  id?: string;
  isInitiallyVisible: boolean;
  isStatic?: boolean;
  renderCell?: (params: TableRowAndColumnParams<TRowData, TDataContext>) => ReactElement;
  renderHeader?: (params: TableColumnParams<TRowData, TDataContext>) => ReactElement;
  renderHeaderContent?: (params: TableColumnParams<TRowData, TDataContext>) => ReactElement;
  resizable?: boolean;
  sx?: SxProps<Theme>;
  textAlign?: 'left' | 'right';
  valueGetter?: (params: TableRowParams<TRowData, TDataContext>) => TValue;
  widthFlex?: number;
  widthPx?: number;
  widthPxFn?: (dataLength: number) => number;
}
