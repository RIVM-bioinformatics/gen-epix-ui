import type {
  SxProps,
  Theme,
} from '@mui/material';
import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';

import type {
  CompleteCaseType,
  CaseTypeCol,
} from '../api';

import type { CaseTypeRowValue } from './epi';
import type { OptionBase } from './form';

export enum FIXED_COLUMN_ID {
  ROW_SELECT = 'ROW_SELECT',
  READABLE_INDEX = 'READABLE_INDEX',
  ACTIONS = 'ACTIONS',
}

export interface TableColumnParams<TRowData> {
  columnIndex: number;
  column: TableColumn<TRowData>;
}

export interface TableRowParams<TRowData> {
  id: string;
  row: TRowData;
  rowIndex: number;
}

export type TableRowAndColumnParams<TRowData> = TableRowParams<TRowData> & TableColumnParams<TRowData>;

interface TableColumnBase<TRowData, TValue> {
  cellTitleGetter?: (params: TableRowParams<TRowData>) => string;
  filterLabel?: string;
  frozen?: boolean;
  headerName?: string;
  headerTooltipContent?: string;
  hideInFilter?: boolean;
  id?: string;
  isInitiallyVisible: boolean;
  renderCell?: (params: TableRowAndColumnParams<TRowData>) => ReactElement;
  renderHeader?: (params: TableColumnParams<TRowData>) => ReactElement;
  resizable?: boolean;
  sx?: SxProps<Theme>;
  textAlign?: 'left' | 'right';
  isStatic?: boolean;
  valueGetter?: (params: TableRowParams<TRowData>) => TValue;
  displayValueGetter?: (params: TableRowParams<TRowData>) => string;
  widthFlex?: number;
  widthPx?: number;
  widthPxFn?: (dataLength: number) => number;
  disableEllipsis?: boolean;
}

export interface TableColumnText<TRowData> extends TableColumnBase<TRowData, string> {
  type: 'text';
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnText<TRowData>>) => (a: TRowData, b: TRowData) => number;
}

export interface TableColumnReadableIndex<TRowData> extends TableColumnBase<TRowData, never> {
  type: 'readableIndex';
  id: FIXED_COLUMN_ID.READABLE_INDEX;
  comparatorFactory?: never;
  isStatic: true;
  frozen: true;
  resizable: false;
  disableEllipsis: true;
}

export interface TableColumnSelectable<TRowData> extends TableColumnBase<TRowData, never> {
  type: 'selectable';
  id: FIXED_COLUMN_ID.ROW_SELECT;
  comparatorFactory?: never;
  isStatic: true;
  frozen: true;
  resizable: false;
  disableEllipsis: true;
}

export interface TableColumnBoolean<TRowData> extends TableColumnBase<TRowData, boolean> {
  type: 'boolean';
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnBoolean<TRowData>>) => (a: TRowData, b: TRowData) => number;
}

export interface TableColumnNumber<TRowData> extends TableColumnBase<TRowData, number> {
  type: 'number';
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnNumber<TRowData>>) => (a: TRowData, b: TRowData) => number;
}

export interface TableColumnDate<TRowData> extends TableColumnBase<TRowData, string> {
  type: 'date';
  format: string;
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnDate<TRowData>>) => (a: TRowData, b: TRowData) => number;
}

export interface TableColumnOptions<TRowData> extends TableColumnBase<TRowData, string | string[]> {
  type: 'options';
  options: OptionBase<string>[];
  maxNumOptionsExpanded?: number;
  shouldFilterOptions?: boolean;
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnOptions<TRowData>>) => (a: TRowData, b: TRowData) => number;
}

export interface TableColumnActions<TRowData> extends TableColumnBase<TRowData, string> {
  id: FIXED_COLUMN_ID.ACTIONS;
  type: 'actions';
  getActions: (params: TableRowParams<TRowData>) => ReactElement[];
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnActions<TRowData>>) => (a: TRowData, b: TRowData) => number;
  isInitiallyVisible: true;
  resizable: false;
  isStatic: true;
}

export interface TableColumnCaseType<TRowData> extends TableColumnBase<TRowData, CaseTypeRowValue> {
  type: 'caseType';
  completeCaseType: CompleteCaseType;
  caseTypeColumn: CaseTypeCol;
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnCaseType<TRowData>>) => (a: TRowData, b: TRowData) => number;
}

export interface GetTableCellValueProps<TRowData, TColumn> {
  readonly row: TRowData;
  readonly column: TColumn;
  readonly rowIndex: number;
  readonly t?: TFunction<'translation', undefined>;
}

export interface GetTableCellRowComparatorProps<TColumn> {
  readonly column: TColumn;
  readonly direction: TableSortDirection;
}

export type TableCellRowComparatorArgument<TRowData> = {
  row: TRowData;
  rowIndex: number;
};

export type TableColumn<TRowData> =
  TableColumnText<TRowData> |
  TableColumnBoolean<TRowData> |
  TableColumnNumber<TRowData> |
  TableColumnDate<TRowData> |
  TableColumnOptions<TRowData> |
  TableColumnActions<TRowData> |
  TableColumnReadableIndex<TRowData> |
  TableColumnSelectable<TRowData> |
  TableColumnCaseType<TRowData>;

export type TableSortDirection = 'asc' | 'desc';


export type TableColumnSettings = {
  id: string;
  widthPx: number;
  widthFlex: number;
  offsetX?: number;
  calculatedWidth?: number;
  hasResized?: boolean;
  isVisible: boolean;
};

export type TableSettings = {
  availableColumnIds: string[];
  columns: TableColumnSettings[];
};

export type TableColumnDimension = {
  id: string;
  label: string;
  columnIds: string[];
};
