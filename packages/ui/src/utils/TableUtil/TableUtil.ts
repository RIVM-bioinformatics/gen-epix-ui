import {
  format as dateFnsFormat,
  parseISO,
} from 'date-fns';
import min from 'lodash/min';
import max from 'lodash/max';
import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';
import difference from 'lodash/difference';
import sumBy from 'lodash/sumBy';

import {
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '../../classes/abstracts/FilterAbstract';
import { BooleanFilter } from '../../classes/filters/BooleanFilter';
import { DateFilter } from '../../classes/filters/DateFilter';
import { MultiSelectFilter } from '../../classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../classes/filters/NumberRangeFilter';
import { TextFilter } from '../../classes/filters/TextFilter';
import type { Filters } from '../../models/filter';
import type { OptionBase } from '../../models/form';
import type {
  GetTableCellRowComparatorProps,
  GetTableCellValueProps,
  HasCellDataFn,
  TableColumn,
  TableColumnActions,
  TableColumnBoolean,
  TableColumnDate,
  TableColumnDimension,
  TableColumnNumber,
  TableColumnOptions,
  TableColumnReadableIndex,
  TableColumnSelectable,
  TableColumnText,
  TableColumnVisualSettings,
  TableRowParams,
} from '../../models/table';
import { FIXED_COLUMN_ID } from '../../models/table';
import { DATE_FORMAT } from '../../data/date';
import { StringUtil } from '../StringUtil';

export class TableUtil {
  public static areColumnVisualSettingsValid<TData, TDataContext = null>(tableColumns: TableColumn<TData, TDataContext>[], columnVisualSettings: TableColumnVisualSettings[]): boolean {
    if (!columnVisualSettings?.length) {
      return false;
    }

    const tableColumnsIds = tableColumns?.map(c => c.id);
    const columnVisualSettingsIds = columnVisualSettings?.map(c => c.id);

    return tableColumnsIds.length === columnVisualSettingsIds.length && difference(tableColumnsIds, columnVisualSettingsIds).length === 0;
  }

  // Cell value getters

  public static createActionsColumn<TData, TDataContext = null>(kwArgs: { getActions: (params: TableRowParams<TData, TDataContext>) => ReactElement[]; t: TFunction<'translation', undefined> }): TableColumnActions<TData, TDataContext> {
    return {
      getActions: kwArgs.getActions,
      headerName: kwArgs.t`Actions`,
      id: FIXED_COLUMN_ID.ACTIONS,
      isInitiallyVisible: true,
      isStatic: true,
      resizable: false,
      type: 'actions',
      widthPx: 48,
    };
  }

  public static createBooleanCellRowComperator<TRowData, TDataContext = null>({ column, dataContext, direction }: GetTableCellRowComparatorProps<TableColumnBoolean<TRowData, TDataContext>, TDataContext>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableBooleanCellValue({ column, dataContext, row: a, rowIndex: 0 }) ? 1 : 0;
      const bValue = TableUtil.getTableBooleanCellValue({ column, dataContext, row: b, rowIndex: 0 }) ? 1 : 0;


      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    };
  }

  public static createBooleanColumn<TData, TDataContext = null>(kwArgs: { filterLabel?: string; flex?: number; id?: keyof TData; name: string }): TableColumnBoolean<TData, TDataContext> {
    return {
      comparatorFactory: TableUtil.createBooleanCellRowComperator,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      type: 'boolean',
      widthFlex: kwArgs.flex ?? 0.25,
    };
  }

  public static createDateCellRowComperator<TRowData, TDataContext = null>({ column, direction }: GetTableCellRowComparatorProps<TableColumnDate<TRowData, TDataContext>, TDataContext>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = a[column.id as keyof TRowData] as string;
      const bValue = b[column.id as keyof TRowData] as string;

      if (aValue === bValue) {
        return 0;
      }
      if (aValue && !bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      if (bValue && !aValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return direction === 'asc' ? -1 : 1;
    };
  }

  public static createDateColumn<TData, TDataContext = null>(kwArgs: { dateFormat?: typeof DATE_FORMAT[keyof typeof DATE_FORMAT]; filterLabel?: string; flex?: number; id?: keyof TData; name: string }): TableColumnDate<TData, TDataContext> {
    return {
      comparatorFactory: TableUtil.createDateCellRowComperator,
      dateFormat: kwArgs.dateFormat ?? DATE_FORMAT.DATE,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      type: 'date',
      widthFlex: kwArgs.flex ?? 0.5,
    };
  }

  public static createFiltersFromColumns<TData, TDataContext = null>(columns: TableColumn<TData, TDataContext>[], baseRows: TData[], dataContext: TDataContext): Filters {
    if (!columns?.length || !baseRows?.length) {
      return [];
    }

    const filters: Filters = [];
    columns.forEach(column => {
      if (column.hideInFilter) {
        return;
      }
      if (column.type === 'text') {
        filters.push(new TextFilter({
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
        }));
      } else if (column.type === 'boolean') {
        filters.push(new BooleanFilter({
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
        }));
      } else if (column.type === 'number') {
        const values = baseRows.map(row => (row as { [key: string]: number })[column.id]);
        filters.push(new NumberRangeFilter({
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          max: max(values),
          min: min(values),
        }));
      } else if (column.type === 'options') {
        let options: OptionBase<string>[];

        if (column.shouldFilterOptions) {
          const possibleOptions = baseRows.map((row, index) => {
            const rowValue = column.valueGetter ? column.valueGetter({ dataContext, id: column.id, row, rowIndex: index }) : row[column.id as keyof TData];
            if (!Array.isArray(rowValue)) {
              return [rowValue] as string[];
            }
            return rowValue;
          }).flat();
          options = column.options.filter(o => possibleOptions.includes(o.value));
        } else {
          options = column.options;
        }

        filters.push(new MultiSelectFilter({
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          maxNumOptionsExpanded: column.maxNumOptionsExpanded,
          options,
        }));
      } else if (column.type === 'date') {
        const values = baseRows.map(row => (row as { [key: string]: string })[column.id]).filter(x => !!x).map(x => parseISO(x));
        const minDate = new Date(Math.min.apply(null, values as unknown as number[]));
        const maxDate = new Date(Math.max.apply(null, values as unknown as number[]));
        return filters.push(new DateFilter({
          dateFormat: column.dateFormat ?? DATE_FORMAT.DATE,
          dateParser: parseISO,
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          maxDate,
          minDate,
        }));
      }
    });

    const searchParams = new URL(document.location.href).searchParams;
    filters.forEach((filter) => {
      const value = searchParams.get(filter.id) as unknown;
      if (!value) {
        return;
      }
      filter.setFilterValue(filter.fromURLSearchParameterValue(value as string));
    });

    return filters;
  }

  public static createInitialVisualColumnSettings<TData, TDataContext = null>(tableColumns: TableColumn<TData, TDataContext>[]): TableColumnVisualSettings[] {
    return tableColumns.map<TableColumnVisualSettings>(column => ({
      id: column.id,
      isVisible: column.isInitiallyVisible,
      label: column.headerName,
      widthFlex: column.widthFlex,
      widthPx: column.widthPx,
      widthPxFn: column.widthPxFn,
    }));
  }

  public static createNumberCellRowComperator<TRowData, TDataContext = null>({ column, dataContext, direction }: GetTableCellRowComparatorProps<TableColumnNumber<TRowData, TDataContext>, TDataContext>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableNumberCellValue({ column, dataContext, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableNumberCellValue({ column, dataContext, row: b, rowIndex: 0 });
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    };
  }

  public static createNumberColumn<TData, TDataContext = null>(kwArgs: { filterLabel?: string; flex?: number; id?: keyof TData; name: string }): TableColumnNumber<TData, TDataContext> {
    return {
      comparatorFactory: TableUtil.createNumberCellRowComperator,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      textAlign: 'right',
      type: 'number',
      widthFlex: kwArgs.flex ?? 1,
    };
  }

  public static createOptionsCellRowComperator<TRowData, TDataContext = null>({ column, dataContext, direction }: GetTableCellRowComparatorProps<TableColumnOptions<TRowData, TDataContext>, TDataContext>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableOptionsCellValue({ column, dataContext, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableOptionsCellValue({ column, dataContext, row: b, rowIndex: 0 });

      const stringifiedAValue = (Array.isArray(aValue) ? aValue.join(', ') : aValue) ?? '';
      const stringifiedBValue = (Array.isArray(bValue) ? bValue.join(', ') : bValue) ?? '';

      return direction === 'asc' ? stringifiedAValue.localeCompare(stringifiedBValue) : stringifiedBValue.localeCompare(stringifiedAValue);
    };
  }

  public static createOptionsColumn<TData, TDataContext = null>(kwArgs: { filterLabel?: string; flex?: number; id?: keyof TData; maxNumOptionsExpanded?: number; name: string; options: OptionBase<string>[]; shouldFilterOptions?: boolean }): TableColumnOptions<TData, TDataContext> {
    return {
      comparatorFactory: TableUtil.createOptionsCellRowComperator,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      maxNumOptionsExpanded: kwArgs.maxNumOptionsExpanded ?? 5,
      options: kwArgs.options,
      shouldFilterOptions: kwArgs.shouldFilterOptions,
      type: 'options',
      widthFlex: kwArgs.flex ?? 1,
    };
  }

  public static createReadableIndexColumn<TData, TDataContext = null>(kwArgs: { getAriaLabel?: (params: TableRowParams<TData, TDataContext>) => string } = {}): TableColumnReadableIndex<TData, TDataContext> {
    return {
      disableEllipsis: true,
      frozen: true,
      getAriaLabel: kwArgs.getAriaLabel ?? (() => null),
      headerName: '',
      id: FIXED_COLUMN_ID.READABLE_INDEX,
      isInitiallyVisible: true,
      isStatic: true,
      resizable: false,
      textAlign: 'right',
      type: 'readableIndex',
      widthPxFn: (dataLength) => (dataLength.toString().length * 10) + 16,
    };
  }

  public static createSelectableColumn<TData, TDataContext = null>(kwArgs: { isDisabled?: (params: TableRowParams<TData, TDataContext>) => boolean } = {}): TableColumnSelectable<TData, TDataContext> {
    return {
      disableEllipsis: true,
      frozen: true,
      id: FIXED_COLUMN_ID.ROW_SELECT,
      isDisabled: kwArgs.isDisabled,
      isInitiallyVisible: true,
      isStatic: true,
      resizable: false,
      type: 'selectable',
      widthPx: 38,
    };
  }

  public static createTextCellRowAdvancedComperator<TRowData, TDataContext = null>({ column, dataContext, direction }: GetTableCellRowComparatorProps<TableColumnText<TRowData, TDataContext>, TDataContext>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableTextCellValue({ column, dataContext, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableTextCellValue({ column, dataContext, row: b, rowIndex: 0 });
      const result = StringUtil.advancedSortComperator(aValue ?? '', bValue ?? '');
      return direction === 'asc' ? result : -result;
    };
  }

  // Cell row comparators
  public static createTextCellRowComperator<TRowData, TDataContext = null>({ column, dataContext, direction }: GetTableCellRowComparatorProps<TableColumnText<TRowData, TDataContext>, TDataContext>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableTextCellValue({ column, dataContext, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableTextCellValue({ column, dataContext, row: b, rowIndex: 0 });
      const result = (aValue ?? '').localeCompare(bValue ?? '');
      return direction === 'asc' ? result : -result;
    };
  }

  // Column creation helpers
  public static createTextColumn<TData, TDataContext = null>(kwArgs: { advancedSort?: boolean; filterLabel?: string; flex?: number; id?: keyof TData; name: string }): TableColumnText<TData, TDataContext> {
    return {
      comparatorFactory: kwArgs.advancedSort ? TableUtil.createTextCellRowAdvancedComperator : TableUtil.createTextCellRowComperator,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      type: 'text',
      widthFlex: kwArgs.flex ?? 1,
    };
  }

  public static getColumnIdsWithData<TRowData, TDataContext = null>(params: { dataContext: TDataContext; hasCellData: HasCellDataFn<TRowData, TDataContext>; sortedData: TRowData[]; tableColumns: TableColumn<TRowData, TDataContext>[]; visibleColumnIds: string[] }): string[] {
    const { dataContext, hasCellData, sortedData, tableColumns, visibleColumnIds } = params;
    const columns = visibleColumnIds.map(id => tableColumns.find(c => c.id === id));
    let newVisibleColumnIds: string[];
    if (hasCellData) {
      newVisibleColumnIds = columns.filter(column => {
        if (column.isStatic) {
          return true;
        }
        return sortedData.some((row, rowIndex) => hasCellData(row, column, rowIndex, dataContext));
      }).map(c => c.id);
    } else {
      newVisibleColumnIds = columns.filter(column => {
        if (column.isStatic) {
          return true;
        }
        return sortedData.some((row, rowIndex) => {
          if (column.valueGetter) {
            return column.valueGetter({
              dataContext,
              id: column.id,
              row,
              rowIndex,
            });
          }
          return row[column.id as keyof TRowData] !== undefined;
        });
      }).map(c => c.id);
    }
    return newVisibleColumnIds;
  }

  public static getTableBooleanCellDisplayValue<TRowData, TDataContext = null>({ column, dataContext, row, rowIndex, t }: GetTableCellValueProps<TRowData, TableColumnBoolean<TRowData, TDataContext>, TDataContext>): string {
    const value = TableUtil.getTableBooleanCellValue({ column, dataContext, row, rowIndex });
    return value ? t('Yes') : t('No');
  }

  public static getTableBooleanCellValue<TRowData, TDataContext = null>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnBoolean<TRowData, TDataContext>, TDataContext>): boolean {
    if (column.valueGetter) {
      return column.valueGetter({ dataContext, id: column.id, row, rowIndex });
    }
    return (row[column.id as keyof TRowData] as boolean);
  }

  public static getTableDateCellValue<TRowData, TDataContext = null>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnDate<TRowData, TDataContext>, TDataContext>): string {
    if (column.valueGetter) {
      return column.valueGetter({ dataContext, id: column.id, row, rowIndex });
    }
    const value = row[column.id as keyof TRowData] as string;
    if (!value) {
      return '';
    }
    return dateFnsFormat(value, column.dateFormat);
  }

  public static getTableNumberCellValue<TRowData, TDataContext = null>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnNumber<TRowData, TDataContext>, TDataContext>): number {
    if (column.valueGetter) {
      return column.valueGetter({ dataContext, id: column.id, row, rowIndex });
    }
    return row[column.id as keyof TRowData] as number;
  }

  public static getTableOptionsCellDisplayValue<TRowData, TDataContext = null>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnOptions<TRowData, TDataContext>, TDataContext>): string {
    const value = TableUtil.getTableOptionsCellValue({ column, dataContext, row, rowIndex });
    return Array.isArray(value) ? value.join(', ') : value;
  }

  public static getTableOptionsCellValue<TRowData, TDataContext = null>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnOptions<TRowData, TDataContext>, TDataContext>): string | string[] {
    if (column.valueGetter) {
      return column.valueGetter({ dataContext, id: column.id, row, rowIndex });
    }
    const values = row[column.id as keyof TRowData] as string | string[];
    if (Array.isArray(values)) {
      return values.map(value => column.options.find(o => o.value === value)?.label ?? '');
    }
    return column.options.find(o => o.value === values)?.label ?? '';
  }

  public static getTableSettingsMap<TRowData, TDataContext = null>(
    container: HTMLDivElement,
    scrollbarSize: number,
    sortedData: TRowData[],
    tableColumns: TableColumn<TRowData, TDataContext>[],
    tableColumnVisualSettings: TableColumnVisualSettings[],
    visibleTableSettingsColumns: TableColumnVisualSettings[],
  ): Map<string, TableColumnVisualSettings> {
    const tableColumnMap = new Map(tableColumns.map(c => [c.id, c]));

    // As soon as the user resizes a column width widthFlex, we need to convert all columns to widthPx
    const hasResizedColumn = visibleTableSettingsColumns.some(column => column.hasResized);
    const hasFlexColumn = visibleTableSettingsColumns.some(column => column.widthFlex);
    if (hasResizedColumn && hasFlexColumn) {
      tableColumnVisualSettings.forEach(column => {
        if (!column.widthPx && column.calculatedWidth) {
          column.widthPx = column.calculatedWidth;
          column.widthFlex = undefined;
        }
      });
    }

    // Divide the available width between the columns
    const totalFlexWidth = sumBy(visibleTableSettingsColumns, column => column.hasResized ? 0 : column.widthFlex) ?? 0;
    const totalFixedWidth = sumBy(visibleTableSettingsColumns, column => tableColumnMap.get(column.id)?.widthPxFn ? tableColumnMap.get(column.id)?.widthPxFn(sortedData.length) : column.widthPx) ?? 0;
    const totalAvailableWidth = container.getBoundingClientRect().width - scrollbarSize;
    const availableFlexWidth = totalAvailableWidth - totalFixedWidth;
    const flexRatio = totalFlexWidth > 0 ? availableFlexWidth / totalFlexWidth : 1;

    let totalOffset = 0;
    tableColumnVisualSettings.forEach(column => {
      const tableColumn = tableColumns.find(c => c.id === column.id);
      let width: number;
      if (column.hasResized) {
        width = column.widthPx;
      } else if (column.widthFlex) {
        width = column.widthFlex * flexRatio;
      } else if (tableColumnMap.get(column.id)?.widthPxFn) {
        width = tableColumnMap.get(column.id)?.widthPxFn(sortedData.length);
      } else {
        width = column.widthPx;
      }
      column.calculatedWidth = width;
      column.offsetX = tableColumn.frozen ? totalOffset : 0;
      totalOffset += width;
    });

    return new Map(tableColumnVisualSettings.map(c => [c.id, c]));
  }

  public static getTableTextCellValue<TRowData, TDataContext = null>({ column, dataContext, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnText<TRowData, TDataContext>, TDataContext>): string {
    if (column.valueGetter) {
      return column.valueGetter({ dataContext, id: column.id, row, rowIndex });
    }
    return row[column.id as keyof TRowData] as string;
  }

  public static handleMoveColumn<TRowData, TDataContext = null>(
    columnDimensions: TableColumnDimension[],
    tableColumnVisualSettings: TableColumnVisualSettings[], // Will be mutated
    tableColumns: TableColumn<TRowData, TDataContext>[],
    elementTableColumn: TableColumn<TRowData, TDataContext>,
    direction: -1 | 1,
  ): boolean {
    if (!elementTableColumn || elementTableColumn.frozen || elementTableColumn.isStatic) {
      return false;
    }

    const elementIndex = tableColumnVisualSettings.findIndex(c => c.id === elementTableColumn.id);
    const elementSettingsColumn = tableColumnVisualSettings[elementIndex];
    if (!elementSettingsColumn) {
      return false;
    }

    // find next/previous visible column
    let swappingElementIndex: number;
    let swappingElementTableColumn: TableColumn<TRowData, TDataContext>;
    let swappingElementSettingsColumn: TableColumnVisualSettings;
    for (let i = elementIndex + direction; i >= 0 && i < tableColumnVisualSettings.length; i += direction) {
      swappingElementSettingsColumn = tableColumnVisualSettings[i];
      if (!swappingElementSettingsColumn?.isVisible) {
        continue;
      }
      swappingElementTableColumn = tableColumns.find(c => c.id === tableColumnVisualSettings[i].id);
      if (swappingElementTableColumn && !swappingElementTableColumn.frozen && !swappingElementTableColumn.isStatic) {
        swappingElementIndex = i;
        break;
      }
    }

    if (!swappingElementSettingsColumn || !swappingElementTableColumn || swappingElementTableColumn.frozen || swappingElementTableColumn.isStatic || swappingElementIndex === undefined) {
      return false;
    }

    // Simple swap if there are no dimensions
    if (!columnDimensions?.length) {
      TableUtil.swapTwoTableColumns(tableColumnVisualSettings, elementIndex, swappingElementIndex);
      return true;
    }

    return TableUtil.handleMoveColumnAcrossDimensions(
      columnDimensions,
      tableColumnVisualSettings,
      elementSettingsColumn,
      swappingElementSettingsColumn,
      elementIndex,
      swappingElementIndex,
      direction,
    );
  }

  private static handleMoveColumnAcrossDimensions(
    columnDimensions: TableColumnDimension[],
    tableColumnVisualSettings: TableColumnVisualSettings[], // Will be mutated
    elementSettingsColumn: TableColumnVisualSettings,
    swappingElementSettingsColumn: TableColumnVisualSettings,
    elementIndex: number,
    swappingElementIndex: number,
    direction: -1 | 1,
  ): boolean {

    const elementDimension = columnDimensions?.find(columnDimension => columnDimension.columnIds.includes(elementSettingsColumn.id));
    const swappingElementDimension = columnDimensions?.find(columnDimension => columnDimension.columnIds.includes(swappingElementSettingsColumn.id));

    if (columnDimensions?.length && (!elementDimension || !swappingElementDimension)) {
      return false;
    }

    if (elementDimension.id === swappingElementDimension.id) {
      // if the columns are in the same dimension
      TableUtil.swapTwoTableColumns(tableColumnVisualSettings, elementIndex, swappingElementIndex);
      return true;
    }

    const elementDimensionVisibleColumnCount = elementDimension.columnIds.filter(id => tableColumnVisualSettings.find(c => c.id === id)?.isVisible).length;
    const swappingElementDimensionVisibleColumnCount = swappingElementDimension.columnIds.filter(id => tableColumnVisualSettings.find(c => c.id === id)?.isVisible).length;

    if (elementDimensionVisibleColumnCount > 1 || swappingElementDimensionVisibleColumnCount > 1) {
      // if there is more than one visible column in the dimension
      TableUtil.swapTwoTableColumns(tableColumnVisualSettings, elementIndex, swappingElementIndex);
      return true;
    }

    const elementDimensionColumnsCount = elementDimension.columnIds.length;
    const elementDimensionIndices = elementDimension.columnIds.map(id => tableColumnVisualSettings.findIndex(c => c.id === id));
    const elementDimensionMinIndex = Math.min(...elementDimensionIndices);
    const elementDimensionMaxIndex = Math.max(...elementDimensionIndices);
    if (elementDimensionMaxIndex - elementDimensionMinIndex !== elementDimensionColumnsCount - 1) {
      // if the columns are NOT next to each other in the dimension
      TableUtil.swapTwoTableColumns(tableColumnVisualSettings, elementIndex, swappingElementIndex);
      return true;
    }

    const swappingElementDimensionIndices = swappingElementDimension.columnIds.map(id => tableColumnVisualSettings.findIndex(c => c.id === id));
    const swappingElementDimensionMinIndex = Math.min(...swappingElementDimensionIndices);
    const swappingElementDimensionMaxIndex = Math.max(...swappingElementDimensionIndices);

    const elementDimensionSettingColumns = elementDimension.columnIds.map(id => tableColumnVisualSettings.find(c => c.id === id));
    const swappingElementSettingsColumns = swappingElementDimension.columnIds.map(id => tableColumnVisualSettings.find(c => c.id === id));
    const swappingElementSettingsColumnsCount = swappingElementSettingsColumns.length;

    if (swappingElementDimensionMaxIndex - swappingElementDimensionMinIndex === swappingElementDimension.columnIds.length - 1) {
      // The swapping element columns are next to each other in the dimension

      // Swap all columns within the element dimension with the all the columns in the swapping element dimension
      tableColumnVisualSettings.splice(elementDimensionMinIndex, elementDimensionColumnsCount, ...swappingElementSettingsColumns);
      if (direction === 1) {
        tableColumnVisualSettings.splice(
          (swappingElementDimensionMinIndex - elementDimensionColumnsCount) + swappingElementSettingsColumnsCount,
          swappingElementSettingsColumnsCount,
          ...elementDimensionSettingColumns,
        );
      } else {
        tableColumnVisualSettings.splice(
          swappingElementDimensionMinIndex,
          swappingElementSettingsColumnsCount,
          ...elementDimensionSettingColumns,
        );
      }
    } else {
      // The swapping element columns are NOT next to each other in the dimension

      // Swap all columns within the element dimension with the swapping element
      tableColumnVisualSettings.splice(elementDimensionMinIndex, elementDimensionColumnsCount, swappingElementSettingsColumn);
      if (direction === 1) {
        tableColumnVisualSettings.splice(
          swappingElementDimensionMinIndex - (elementDimensionColumnsCount - 1),
          1,
          ...elementDimensionSettingColumns,
        );
      } else {
        tableColumnVisualSettings.splice(
          swappingElementDimensionMinIndex,
          1,
          ...elementDimensionSettingColumns,
        );
      }
    }
    return true;
  }

  private static swapTwoTableColumns(tableColumnVisualSettings: TableColumnVisualSettings[], elementIndex: number, swappingElementIndex: number): void {
    tableColumnVisualSettings[elementIndex] = tableColumnVisualSettings.splice(swappingElementIndex, 1, tableColumnVisualSettings[elementIndex])[0];
  }
}
