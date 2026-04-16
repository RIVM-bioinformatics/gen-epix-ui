import type {
  SxProps,
  Theme,
} from '@mui/material';
import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';
import type {
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';

import type { DATE_FORMAT } from '../data/date';

import type { CaseTypeRowValue } from './epi';
import type { OptionBase } from './form';

export enum FIXED_COLUMN_ID {
  ACTIONS = 'ACTIONS',
  READABLE_INDEX = 'READABLE_INDEX',
  ROW_SELECT = 'ROW_SELECT',
}

export interface GetTableCellRowComparatorProps<TColumn> {
  readonly column: TColumn;
  readonly direction: TableSortDirection;
}

export interface GetTableCellValueProps<TRowData, TColumn> {
  readonly column: TColumn;
  readonly row: TRowData;
  readonly rowIndex: number;
  readonly t?: TFunction<'translation', undefined>;
}

export type HasCellDataFn<TRowData> = (row: TRowData, column: TableColumn<TRowData>, rowIndex: number) => boolean;

export type TableCellRowComparatorArgument<TRowData> = {
  row: TRowData;
  rowIndex: number;
};

export type TableColumn<TRowData> =
  TableColumnActions<TRowData> |
  TableColumnBoolean<TRowData> |
  TableColumnCaseType<TRowData> |
  TableColumnDate<TRowData> |
  TableColumnNumber<TRowData> |
  TableColumnOptions<TRowData> |
  TableColumnReadableIndex<TRowData> |
  TableColumnSelectable<TRowData> |
  TableColumnText<TRowData>;

export interface TableColumnActions<TRowData> extends TableColumnBase<TRowData, string> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnActions<TRowData>>) => (a: TRowData, b: TRowData) => number;
  getActions: (params: TableRowParams<TRowData>) => ReactElement[];
  id: FIXED_COLUMN_ID.ACTIONS;
  isInitiallyVisible: true;
  isStatic: true;
  resizable: false;
  type: 'actions';
}

export interface TableColumnBoolean<TRowData> extends TableColumnBase<TRowData, boolean> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnBoolean<TRowData>>) => (a: TRowData, b: TRowData) => number;
  type: 'boolean';
}

export interface TableColumnCaseType<TRowData> extends TableColumnBase<TRowData, CaseTypeRowValue> {
  col: CaseDbCol;
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnCaseType<TRowData>>) => (a: TRowData, b: TRowData) => number;
  completeCaseType: CaseDbCompleteCaseType;
  type: 'caseType';
}

export interface TableColumnDate<TRowData> extends TableColumnBase<TRowData, string> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnDate<TRowData>>) => (a: TRowData, b: TRowData) => number;
  dateFormat: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
  type: 'date';
}

export type TableColumnDimension = {
  columnIds: string[];
  id: string;
  label: string;
};

export interface TableColumnNumber<TRowData> extends TableColumnBase<TRowData, number> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnNumber<TRowData>>) => (a: TRowData, b: TRowData) => number;
  type: 'number';
}

export interface TableColumnOptions<TRowData> extends TableColumnBase<TRowData, string | string[]> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnOptions<TRowData>>) => (a: TRowData, b: TRowData) => number;
  maxNumOptionsExpanded?: number;
  options: OptionBase<string>[];
  shouldFilterOptions?: boolean;
  type: 'options';
}

export interface TableColumnParams<TRowData> {
  column: TableColumn<TRowData>;
  columnIndex: number;
}

export interface TableColumnReadableIndex<TRowData> extends TableColumnBase<TRowData, never> {
  comparatorFactory?: never;
  disableEllipsis: true;
  frozen: true;
  getAriaLabel: (params: TableRowParams<TRowData>) => string;
  id: FIXED_COLUMN_ID.READABLE_INDEX;
  isStatic: true;
  resizable: false;
  type: 'readableIndex';
}

export interface TableColumnSelectable<TRowData> extends TableColumnBase<TRowData, never> {
  comparatorFactory?: never;
  disableEllipsis: true;
  frozen: true;
  id: FIXED_COLUMN_ID.ROW_SELECT;
  isDisabled?: (params: TableRowParams<TRowData>) => boolean;
  isStatic: true;
  resizable: false;
  type: 'selectable';
}

export type TableColumnSettings = {
  calculatedWidth?: number;
  hasResized?: boolean;
  id: string;
  isVisible: boolean;
  offsetX?: number;
  widthFlex: number;
  widthPx: number;
};

export interface TableColumnText<TRowData> extends TableColumnBase<TRowData, string> {
  comparatorFactory?: (params: GetTableCellRowComparatorProps<TableColumnText<TRowData>>) => (a: TRowData, b: TRowData) => number;
  type: 'text';
}

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


export type TableRowAndColumnParams<TRowData> = TableColumnParams<TRowData> & TableRowParams<TRowData>;

export interface TableRowParams<TRowData> {
  id: string;
  row: TRowData;
  rowIndex: number;
}

export type TableSettings = {
  availableColumnIds: string[];
  columns: TableColumnSettings[];
};

export type TableSortDirection = 'asc' | 'desc';

interface TableColumnBase<TRowData, TValue> {
  cellTitleGetter?: (params: TableRowParams<TRowData>) => string;
  disableEllipsis?: boolean;
  displayValueGetter?: (params: TableRowParams<TRowData>) => string;
  filterLabel?: string;
  frozen?: boolean;
  headerName?: string;
  headerTooltipContent?: string;
  hideInFilter?: boolean;
  id?: string;
  isInitiallyVisible: boolean;
  isStatic?: boolean;
  renderCell?: (params: TableRowAndColumnParams<TRowData>) => ReactElement;
  renderHeader?: (params: TableColumnParams<TRowData>) => ReactElement;
  renderHeaderContent?: (params: TableColumnParams<TRowData>) => ReactElement;
  resizable?: boolean;
  sx?: SxProps<Theme>;
  textAlign?: 'left' | 'right';
  valueGetter?: (params: TableRowParams<TRowData>) => TValue;
  widthFlex?: number;
  widthPx?: number;
  widthPxFn?: (dataLength: number) => number;
}
